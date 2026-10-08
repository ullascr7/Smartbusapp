import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Navigation,
  Gauge,
  Clock,
  Users,
  Fuel,
  Radio,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle,
  Bus as BusIcon,
  PhoneCall,
  ShieldCheck,
  Zap,
  Wifi,
  WifiOff,
  Compass,
  Signal
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

interface LiveTrackingDashboardProps {
  initialBusId?: string;
}

export const LiveTrackingDashboard: React.FC<LiveTrackingDashboardProps> = ({ initialBusId }) => {
  const { user, isDriver, isAdmin } = useAuth();
  const [buses, setBuses] = useState<any[]>([]);
  const [selectedBusId, setSelectedBusId] = useState<string>(initialBusId || '');
  const [telemetry, setTelemetry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // WebSocket State
  const [wsConnected, setWsConnected] = useState(false);
  const [lastWsUpdate, setLastWsUpdate] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Driver Transmitter State
  const [driverModeActive, setDriverModeActive] = useState(false);
  const [simSpeed, setSimSpeed] = useState<number>(65);

  // Load all active buses
  useEffect(() => {
    api.tracking.getAll()
      .then(res => {
        setBuses(res.buses || []);
        if (!selectedBusId && res.buses.length > 0) {
          setSelectedBusId(res.buses[0].busId);
        }
      })
      .catch(err => {
        console.warn('Failed to load tracking buses:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Fetch telemetry via REST fallback or initial
  const fetchTelemetry = (busId: string) => {
    if (!busId) return;
    api.tracking.getBus(busId)
      .then(res => {
        setTelemetry(res);
      })
      .catch(err => {
        console.warn('Failed to get bus telemetry:', err);
      });
  };

  // WebSocket Connection Management
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/tracking`;

    let socket: WebSocket;
    let reconnectTimeout: any;

    const connectWebSocket = () => {
      try {
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          setWsConnected(true);
          if (selectedBusId) {
            socket.send(JSON.stringify({ type: 'subscribe', busId: selectedBusId }));
          }
        };

        socket.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'snapshot') {
              setLastWsUpdate(new Date().toLocaleTimeString());
              // If we have selectedBusId, check if it's updated in snapshot
              const currentBus = msg.buses?.find((b: any) => b.busId === selectedBusId);
              if (currentBus) {
                setTelemetry((prev: any) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    currentLocation: {
                      ...prev.currentLocation,
                      lat: currentBus.lat,
                      lng: currentBus.lng,
                      speedKmh: currentBus.speed,
                      status: currentBus.liveStatus,
                      nextStop: currentBus.nextStop
                    }
                  };
                });
              }
            } else if (msg.type === 'bus_update' && msg.busId === selectedBusId) {
              setLastWsUpdate(new Date().toLocaleTimeString());
              setTelemetry((prev: any) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  currentLocation: {
                    ...prev.currentLocation,
                    lat: msg.telemetry.latitude,
                    lng: msg.telemetry.longitude,
                    speedKmh: msg.telemetry.speed,
                    status: msg.telemetry.status || prev.currentLocation.status,
                    nextStop: msg.telemetry.next_stop || prev.currentLocation.nextStop
                  }
                };
              });
            }
          } catch (e) {
            console.error('WS parse error', e);
          }
        };

        socket.onclose = () => {
          setWsConnected(false);
          // Reconnect after 4s
          reconnectTimeout = setTimeout(connectWebSocket, 4000);
        };

        socket.onerror = () => {
          setWsConnected(false);
        };
      } catch (err) {
        setWsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socket) socket.close();
    };
  }, []);

  // When selectedBusId changes, notify WS and fetch initial telemetry
  useEffect(() => {
    if (selectedBusId) {
      fetchTelemetry(selectedBusId);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'subscribe', busId: selectedBusId }));
      }
    }
  }, [selectedBusId]);

  // Polling fallback if WebSocket is disconnected
  useEffect(() => {
    if (!wsConnected && selectedBusId) {
      const interval = setInterval(() => {
        fetchTelemetry(selectedBusId);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [wsConnected, selectedBusId]);

  // Simulation step: advance along route stops
  const handleAdvanceStop = async () => {
    if (!telemetry || !telemetry.stops || telemetry.stops.length === 0) return;

    const currentLat = telemetry.currentLocation.lat;
    const currentLng = telemetry.currentLocation.lng;

    const stops = telemetry.stops;
    const currentIndex = stops.findIndex((s: any) => Math.abs(s.lat - currentLat) < 0.05 && Math.abs(s.lng - currentLng) < 0.05);
    const nextIndex = (currentIndex + 1) % stops.length;
    const nextStop = stops[nextIndex];

    try {
      // Send both via REST and via WebSocket if available
      await api.tracking.updateBus(selectedBusId, {
        lat: nextStop.lat,
        lng: nextStop.lng,
        speed: simSpeed,
        status: `Approaching ${nextStop.name}`,
        next_stop: stops[(nextIndex + 1) % stops.length]?.name || 'Terminal'
      });

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'driver_telemetry',
          busId: selectedBusId,
          lat: nextStop.lat,
          lng: nextStop.lng,
          speed: simSpeed,
          nextStop: stops[(nextIndex + 1) % stops.length]?.name || 'Terminal'
        }));
      }

      fetchTelemetry(selectedBusId);
      setStatusNotice(`Bus telemetry advanced to ${nextStop.name}!`);
      setTimeout(() => setStatusNotice(null), 4000);
    } catch (e: any) {
      alert('Failed to advance telemetry');
    }
  };

  const handleBroadcastNotice = async (statusText: string) => {
    try {
      await api.tracking.updateBus(selectedBusId, {
        status: statusText
      });
      fetchTelemetry(selectedBusId);
      setStatusNotice(`Broadcast update dispatched: ${statusText}`);
      setTimeout(() => setStatusNotice(null), 4000);
    } catch (e) {
      // ignore
    }
  };

  if (loading && buses.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500 text-sm font-semibold">
        Connecting to KSRTC Live GPS Satellite Fleet Feed...
      </div>
    );
  }

  const busInfo = telemetry?.bus;
  const stops = telemetry?.stops || [];
  const curr = telemetry?.currentLocation || { lat: 12.3118, lng: 76.6529, speedKmh: 54, status: 'On Route', nextStop: 'Next Station' };
  const metrics = telemetry?.metrics || { driverName: 'R. Veerendra (Badge #9284)', batteryFuelPercentage: 86, occupiedSeats: 26, totalCapacity: 36 };

  // Calculate bounding box for the visual map canvas
  const allLats = stops.map((s: any) => s.lat).concat([curr.lat]).filter(Boolean);
  const allLngs = stops.map((s: any) => s.lng).concat([curr.lng]).filter(Boolean);
  const minLat = Math.min(...allLats, 12.0);
  const maxLat = Math.max(...allLats, 13.5);
  const minLng = Math.min(...allLngs, 75.5);
  const maxLng = Math.max(...allLngs, 77.8);

  const getMapX = (lng: number) => {
    const range = maxLng - minLng || 1;
    return 10 + ((lng - minLng) / range) * 80;
  };

  const getMapY = (lat: number) => {
    const range = maxLat - minLat || 1;
    return 85 - ((lat - minLat) / range) * 70;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <h1 className="text-2xl font-black tracking-tight">Real-Time Driver & GPS Telemetry</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time WebSocket telemetry with rural intermediate stops, live speed, and driver dispatcher controls.
          </p>
        </div>

        {/* WebSocket Status & Bus Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold">
            {wsConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="text-emerald-400">WebSocket Live</span>
              </>
            ) : (
              <>
                <Signal className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300">HTTP Polling</span>
              </>
            )}
            {lastWsUpdate && <span className="text-[10px] text-slate-400 font-mono">({lastWsUpdate})</span>}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-400 whitespace-nowrap">Track Vehicle:</label>
            <select
              value={selectedBusId}
              onChange={e => setSelectedBusId(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold outline-none cursor-pointer"
            >
              {buses.map(b => (
                <option key={b.busId} value={b.busId}>
                  {b.busNumber} – {b.busName} ({b.routeName})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {statusNotice && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Radio className="w-4 h-4 text-amber-600 animate-pulse" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Main Grid: Map & HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Interactive Route Visualizer Map */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="font-mono text-xs font-black text-red-600 px-2 py-0.5 bg-red-50 rounded">
                {busInfo?.bus_number || 'KA-09-F-1204'}
              </span>
              <h2 className="text-base font-black text-slate-900 mt-1">
                {busInfo?.bus_name || 'Hunsur-Mysuru-Blr Express'}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {curr.status}
              </span>
            </div>
          </div>

          {/* SVG Route Simulation Canvas */}
          <div className="relative my-4 w-full h-80 bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
            {/* Grid lines background */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />

            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full p-6">
              {/* Route Polyline connecting all stops */}
              {stops.length > 1 && (
                <polyline
                  points={stops.map((s: any) => `${getMapX(s.lng)},${getMapY(s.lat)}`).join(' ')}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                  strokeLinecap="round"
                />
              )}

              {/* Intermediate Village & Stop Nodes */}
              {stops.map((s: any, idx: number) => {
                const x = getMapX(s.lng);
                const y = getMapY(s.lat);
                return (
                  <g key={s.id || idx}>
                    <circle cx={x} cy={y} r="3" fill="#ffffff" stroke="#1e293b" strokeWidth="1" />
                    <text
                      x={x}
                      y={y - 4}
                      fill="#94a3b8"
                      fontSize="3.2"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {s.name}
                    </text>
                  </g>
                );
              })}

              {/* Active Bus Live Position Beacon */}
              <g>
                <circle
                  cx={getMapX(curr.lng)}
                  cy={getMapY(curr.lat)}
                  r="7"
                  fill="#ef4444"
                  opacity="0.3"
                  className="animate-ping"
                />
                <circle
                  cx={getMapX(curr.lng)}
                  cy={getMapY(curr.lat)}
                  r="4.5"
                  fill="#dc2626"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <text
                  x={getMapX(curr.lng)}
                  y={getMapY(curr.lat) + 8}
                  fill="#facc15"
                  fontSize="3.5"
                  fontWeight="black"
                  textAnchor="middle"
                >
                  BUS {busInfo?.bus_number?.slice(-4) || 'LIVE'}
                </text>
              </g>
            </svg>

            {/* In-Map Floating GPS Badge */}
            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-[11px] font-mono text-slate-300">
              GPS: {curr.lat?.toFixed(4)}°N, {curr.lng?.toFixed(4)}°E
            </div>

            <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-[10px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Real-time GPS Coordinate Vector</span>
            </div>
          </div>

          {/* Stops Progress Sequence */}
          <div className="overflow-x-auto pb-1">
            <div className="flex items-center gap-2 min-w-max text-xs">
              {stops.map((s: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="font-bold text-slate-900">{s.name}</p>
                    <p className="text-[10px] text-slate-500">{s.arrivalTime}</p>
                  </div>
                  {i < stops.length - 1 && <span className="text-slate-300">→</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Driver HUD & Telemetry Controls */}
        <div className="lg:col-span-4 space-y-4">
          {/* Real-time Telemetry Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Vehicle Telemetry HUD
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                  <Gauge className="w-4 h-4 text-red-600" />
                  <span>Speed</span>
                </div>
                <p className="text-2xl font-black text-slate-900 mt-1">{curr.speedKmh} <span className="text-xs font-normal text-slate-500">km/h</span></p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Occupancy</span>
                </div>
                <p className="text-2xl font-black text-slate-900 mt-1">{metrics.occupiedSeats} <span className="text-xs font-normal text-slate-500">/ {metrics.totalCapacity}</span></p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                  <Fuel className="w-4 h-4 text-emerald-600" />
                  <span>Battery / Fuel</span>
                </div>
                <p className="text-2xl font-black text-slate-900 mt-1">{metrics.batteryFuelPercentage}%</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Next Stop</span>
                </div>
                <p className="text-sm font-black text-slate-900 mt-1 truncate">{curr.nextStop}</p>
              </div>
            </div>

            {/* Assigned Driver Profile */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">{metrics.driverName}</p>
                <p className="text-[10px] text-slate-500">{metrics.depot || 'Central Division Depot'}</p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                Active Shift
              </span>
            </div>
          </div>

          {/* Interactive Driver Simulator & Live Controls */}
          <div className="bg-linear-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Compass className="w-4 h-4" />
                Driver Dispatch Simulator
              </h3>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-mono">
                Real-Time GPS
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Simulate live driver telemetry to demonstrate instant GPS streaming across passengers' screens:
            </p>

            <div className="space-y-2 pt-1">
              <button
                id="simulate-advance-stop-btn"
                onClick={handleAdvanceStop}
                className="w-full py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Advance to Next Route Stop</span>
              </button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => handleBroadcastNotice('Highway Cruising (Clear Traffic)')}
                  className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-[11px] rounded-xl border border-slate-700 transition-colors cursor-pointer"
                >
                  Cruising Normal
                </button>
                <button
                  onClick={() => handleBroadcastNotice('Toll Plaza Traffic (+8 mins delay)')}
                  className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[11px] rounded-xl border border-slate-700 transition-colors cursor-pointer"
                >
                  Toll Delay (+8m)
                </button>
              </div>

              <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                <span>Cruising Speed:</span>
                <div className="flex gap-1 font-bold">
                  {[45, 65, 80].map(s => (
                    <button
                      key={s}
                      onClick={() => setSimSpeed(s)}
                      className={`px-2 py-0.5 rounded ${simSpeed === s ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-300'}`}
                    >
                      {s} km/h
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
