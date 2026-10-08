import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { dbStore } from '../db.js';
import { BusTracking } from '../../src/types/index.js';

interface ClientConnection {
  ws: WebSocket;
  subscribedBusId: string | 'all';
  isAlive: boolean;
}

let wss: WebSocketServer | null = null;
const clients = new Set<ClientConnection>();
let simulationInterval: NodeJS.Timeout | null = null;

// Route waypoint interpolation progress for buses in simulation mode
const busSimulationState = new Map<string, {
  segmentIndex: number;
  segmentProgress: number; // 0 to 1
  direction: 1 | -1;
}>();

export function initWebSocketServer(httpServer: HttpServer) {
  wss = new WebSocketServer({ server: httpServer, path: '/ws/tracking' });

  wss.on('connection', (ws: WebSocket) => {
    const conn: ClientConnection = { ws, subscribedBusId: 'all', isAlive: true };
    clients.add(conn);

    // Send initial snapshot of all active buses
    sendBusSnapshot(ws);

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'subscribe') {
          conn.subscribedBusId = data.busId || 'all';
        } else if (data.type === 'driver_telemetry') {
          // Real GPS or Driver Manual push
          handleDriverTelemetry(data);
        } else if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', time: Date.now() }));
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    });

    ws.on('pong', () => {
      conn.isAlive = true;
    });

    ws.on('close', () => {
      clients.delete(conn);
    });

    ws.on('error', (err) => {
      console.warn('WebSocket connection error:', err);
      clients.delete(conn);
    });
  });

  // Heartbeat keep-alive every 30s
  setInterval(() => {
    for (const conn of clients) {
      if (!conn.isAlive) {
        conn.ws.terminate();
        clients.delete(conn);
      } else {
        conn.isAlive = false;
        conn.ws.ping();
      }
    }
  }, 30000);

  // Start realistic background simulation for live demo tracking
  startLiveBusSimulation();
}

function sendBusSnapshot(ws: WebSocket) {
  if (ws.readyState !== WebSocket.OPEN) return;
  const buses = dbStore.getBuses();
  const snapshot = buses.map(b => ({
    busId: b.id,
    busNumber: b.bus_number,
    busName: b.bus_name,
    busType: b.bus_type,
    operationalStatus: b.operational_status || 'Active',
    liveStatus: b.live_status || 'Running',
    lat: b.live_lat,
    lng: b.live_lng,
    speed: b.live_speed ?? 50,
    nextStop: b.live_next_stop,
    statusUpdatedAt: b.status_updated_at || new Date().toISOString()
  }));

  ws.send(JSON.stringify({
    type: 'snapshot',
    buses: snapshot,
    timestamp: new Date().toISOString()
  }));
}

export function broadcastBusUpdate(telemetry: BusTracking & { bus_name?: string; bus_number?: string; operational_status?: string }) {
  if (!wss) return;

  const payload = JSON.stringify({
    type: 'bus_update',
    data: telemetry
  });

  for (const client of clients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      if (client.subscribedBusId === 'all' || client.subscribedBusId === telemetry.bus_id) {
        client.ws.send(payload);
      }
    }
  }
}

export function handleDriverTelemetry(data: {
  busId: string;
  lat: number;
  lng: number;
  speed: number;
  heading?: number;
  status?: string;
  nextStop?: string;
}) {
  const bus = dbStore.getBuses().find(b => b.id === data.busId);
  if (!bus) return;

  const telemetry: BusTracking = {
    id: `track-${Date.now()}`,
    bus_id: data.busId,
    latitude: data.lat,
    longitude: data.lng,
    speed: data.speed,
    heading: data.heading || 0,
    timestamp: new Date().toISOString(),
    status: data.status || 'Running',
    next_stop: data.nextStop || bus.live_next_stop
  };

  dbStore.recordBusTracking(telemetry);

  broadcastBusUpdate({
    ...telemetry,
    bus_name: bus.bus_name,
    bus_number: bus.bus_number,
    operational_status: bus.operational_status
  });
}

// Background simulation along actual Karnataka route stops
function startLiveBusSimulation() {
  if (simulationInterval) clearInterval(simulationInterval);

  simulationInterval = setInterval(() => {
    try {
      const buses = dbStore.getBuses().filter(b => b.operational_status !== 'Maintenance');
      const routes = dbStore.getRoutes();
      const routeStops = dbStore.getRouteStops();
      const locations = dbStore.getLocations();
      const locMap = new Map(locations.map(l => [l.id, l]));

      for (const bus of buses) {
        const route = routes.find(r => r.bus_id === bus.id);
        if (!route) continue;

        const stops = routeStops
          .filter(rs => rs.route_id === route.id)
          .sort((a, b) => a.stop_order - b.stop_order);

        if (stops.length < 2) continue;

        let state = busSimulationState.get(bus.id);
        if (!state) {
          state = { segmentIndex: 0, segmentProgress: 0.1, direction: 1 };
          busSimulationState.set(bus.id, state);
        }

        // Advance progress
        const step = 0.05 + Math.random() * 0.03; // ~5-8% progress per tick
        state.segmentProgress += step;

        if (state.segmentProgress >= 1.0) {
          state.segmentProgress = 0;
          state.segmentIndex += state.direction;

          if (state.segmentIndex >= stops.length - 1) {
            state.direction = -1;
            state.segmentIndex = stops.length - 2;
          } else if (state.segmentIndex < 0) {
            state.direction = 1;
            state.segmentIndex = 0;
          }
        }

        const stopA = stops[state.segmentIndex];
        const stopB = stops[state.segmentIndex + 1] || stops[state.segmentIndex];
        const locA = locMap.get(stopA.location_id);
        const locB = locMap.get(stopB.location_id);

        if (!locA || !locB) continue;

        // Linear interpolation of coordinates
        const progress = Math.min(1, Math.max(0, state.segmentProgress));
        const currentLat = locA.latitude + (locB.latitude - locA.latitude) * progress;
        const currentLng = locA.longitude + (locB.longitude - locA.longitude) * progress;
        const currentSpeed = Math.round(42 + Math.random() * 26); // 42-68 km/h

        const targetStopName = state.direction === 1 ? locB.name : locA.name;
        const statusText = progress < 0.15
          ? `Departed ${locA.name}`
          : (progress > 0.85 ? `Approaching ${locB.name}` : `En Route to ${targetStopName}`);

        const telemetry: BusTracking = {
          id: `sim-${bus.id}-${Date.now()}`,
          bus_id: bus.id,
          latitude: parseFloat(currentLat.toFixed(5)),
          longitude: parseFloat(currentLng.toFixed(5)),
          speed: currentSpeed,
          heading: Math.round(Math.atan2(locB.longitude - locA.longitude, locB.latitude - locA.latitude) * (180 / Math.PI)),
          timestamp: new Date().toISOString(),
          status: statusText,
          next_stop: targetStopName
        };

        dbStore.recordBusTracking(telemetry);

        broadcastBusUpdate({
          ...telemetry,
          bus_name: bus.bus_name,
          bus_number: bus.bus_number,
          operational_status: bus.operational_status
        });
      }
    } catch (simErr) {
      console.error('Simulation loop error:', simErr);
    }
  }, 4000); // update every 4 seconds
}
