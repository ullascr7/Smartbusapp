import React, { useState, useEffect } from 'react';
import {
  Shield,
  TrendingUp,
  DollarSign,
  Bus as BusIcon,
  Users,
  Route as RouteIcon,
  MapPin,
  Edit2,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  IndianRupee,
  Layers,
  Settings,
  Building2
} from 'lucide-react';
import { Bus, Location } from '../types/index.js';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { DepotFleetManagement } from './DepotFleetManagement.js';

interface AdminDashboardProps {
  onFareUpdated?: (newRate: number) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onFareUpdated }) => {
  const { user, isAdmin, isDepotManager } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'pricing' | 'buses' | 'routes' | 'locations' | 'depots'>(
    isDepotManager && !isAdmin ? 'depots' : 'overview'
  );
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [fareInput, setFareInput] = useState<string>('1.50');
  const [fareStatusMessage, setFareStatusMessage] = useState<string | null>(null);

  // New Bus Form State
  const [showAddBusModal, setShowAddBusModal] = useState(false);
  const [busName, setBusName] = useState('');
  const [busNumber, setBusNumber] = useState('');
  const [busType, setBusType] = useState('Karnataka Sarige (Express)');
  const [totalSeats, setTotalSeats] = useState(36);

  // New Location Form State
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [locName, setLocName] = useState('');
  const [locType, setLocType] = useState<'village' | 'town' | 'city' | 'hub'>('village');
  const [locDistrict, setLocDistrict] = useState('');
  const [locLat, setLocLat] = useState('');
  const [locLng, setLocLng] = useState('');

  const loadDashboard = () => {
    setLoading(true);
    api.admin.getDashboard()
      .then(res => {
        setData(res);
        setFareInput(res.stats.currentFareRate.toString());
      })
      .catch(err => {
        console.warn('Failed to load admin dashboard:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleUpdateFare = async (e: React.FormEvent) => {
    e.preventDefault();
    setFareStatusMessage(null);
    const num = parseFloat(fareInput);
    if (isNaN(num) || num <= 0) {
      setFareStatusMessage('Error: Please enter a valid rate greater than ₹0');
      return;
    }

    try {
      const res = await api.admin.updateFare(num);
      setFareStatusMessage(res.message);
      if (onFareUpdated) onFareUpdated(res.fare_per_km);
      loadDashboard();
      setTimeout(() => setFareStatusMessage(null), 5000);
    } catch (err: any) {
      setFareStatusMessage(err.message || 'Failed to update fare rate');
    }
  };

  const handleAddBus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.admin.addBus({
        bus_name: busName,
        bus_number: busNumber,
        bus_type: busType,
        total_seats: Number(totalSeats),
        amenities: ['Cushioned Seats', 'Emergency Exit', 'Mobile Charging']
      });
      setShowAddBusModal(false);
      setBusName('');
      setBusNumber('');
      loadDashboard();
    } catch (err: any) {
      alert(err.message || 'Failed to add bus');
    }
  };

  const handleDeleteBus = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from active fleet?`)) return;
    try {
      await api.admin.deleteBus(id);
      loadDashboard();
    } catch (err: any) {
      alert(err.message || 'Failed to delete bus');
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.admin.addLocation({
        name: locName,
        type: locType,
        district: locDistrict,
        latitude: parseFloat(locLat),
        longitude: parseFloat(locLng),
        aliases: []
      });
      setShowAddLocationModal(false);
      setLocName('');
      setLocDistrict('');
      setLocLat('');
      setLocLng('');
      alert('Village/Location registered successfully!');
      loadDashboard();
    } catch (err: any) {
      alert(err.message || 'Failed to add location');
    }
  };

  if (loading && !data) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="font-semibold text-sm">Loading KSRTC Administrative Console...</p>
      </div>
    );
  }

  const { stats, dailyAnalytics = [], popularRoutes = [], recentBookings = [], buses = [], routes = [] } = data || {};

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Admin Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">KSRTC Operations & Pricing Console</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            System Master Settings • Dynamic Fare Configurator • Fleet & Rural Stop Manager
          </p>
        </div>

        {/* Current Active Rate Badge */}
        <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Live Rate / Km</p>
            <p className="text-lg font-black text-amber-400">₹{stats?.currentFareRate?.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto text-xs sm:text-sm font-bold pb-2">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'overview' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          KPIs & Analytics
        </button>

        <button
          onClick={() => setActiveSubTab('pricing')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'pricing' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Pricing & Fare Config (₹/km)
        </button>

        <button
          onClick={() => setActiveSubTab('buses')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'buses' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Fleet Management ({buses.length})
        </button>

        <button
          onClick={() => setActiveSubTab('locations')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'locations' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Village Geocoding Manager
        </button>

        <button
          id="tab-depots-rbac"
          onClick={() => setActiveSubTab('depots')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'depots' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Depot Fleet & Operations
        </button>
      </div>

      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Key KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Total Revenue</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">₹{stats?.totalRevenue}</p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">Confirmed E-Tickets</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Total Bookings</span>
                <TrendingUp className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{stats?.totalBookings}</p>
              <p className="text-[11px] text-slate-500 font-semibold mt-1">Across all districts</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Active Fleet</span>
                <BusIcon className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{stats?.activeBuses}</p>
              <p className="text-[11px] text-slate-500 font-semibold mt-1">Sarige, Rajahamsa, EV</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Registered Users</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{stats?.registeredUsers}</p>
              <p className="text-[11px] text-slate-500 font-semibold mt-1">Commuters & Travelers</p>
            </div>
          </div>

          {/* Daily Revenue & Volume Visualizer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Daily Booking Volume (Last 7 Days)
                </h3>
                <span className="text-xs text-slate-400 font-semibold">Real-time DB counts</span>
              </div>

              {/* Bar Chart Representation */}
              <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-200">
                {dailyAnalytics.map((day: any) => {
                  const maxVal = Math.max(...dailyAnalytics.map((d: any) => d.bookings), 5);
                  const heightPercent = Math.max((day.bookings / maxVal) * 100, 15);
                  return (
                    <div key={day.fullDate} className="flex-1 flex flex-col items-center gap-1 group">
                      <span className="text-[10px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        {day.bookings} trips (₹{day.revenue})
                      </span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[32px] bg-red-600 group-hover:bg-red-700 rounded-t-lg transition-all shadow-xs"
                      />
                      <span className="text-[10px] font-mono text-slate-500 mt-1 font-semibold">
                        {day.date}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Routes */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3">
                Most In-Demand Corridors
              </h3>
              <div className="space-y-2.5">
                {popularRoutes.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4">Bookings will populate popular routes automatically.</p>
                ) : (
                  popularRoutes.map((r: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{r.route}</span>
                      <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-black">
                        {r.count} bookings
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Recent 8 Bookings Manifest */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3">
              Recent System Reservations
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase font-black">
                  <tr>
                    <th className="p-2.5">PNR</th>
                    <th className="p-2.5">Corridor</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Passengers</th>
                    <th className="p-2.5">Amount</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {recentBookings.map((b: any) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-red-600">{b.pnr_number}</td>
                      <td className="p-2.5 font-bold text-slate-900">{b.source_location} → {b.destination_location}</td>
                      <td className="p-2.5">{b.travel_date}</td>
                      <td className="p-2.5">{b.passengerNames} ({b.passengersCount} seats)</td>
                      <td className="p-2.5 font-bold text-slate-900">₹{b.total_amount}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black text-[10px]">
                          {b.booking_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRICING & FARE CONFIGURATION */}
      {activeSubTab === 'pricing' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-lg font-black text-slate-900">Configurable Fare Formula Rate</h2>
            <p className="text-xs text-slate-500 mt-1">
              Per requirements, ticket pricing follows: <span className="font-mono font-bold text-slate-800">FARE = DISTANCE IN KILOMETERS × RATE</span>.
              Modifying this value updates the calculation across all public searches instantly.
            </p>
          </div>

          {fareStatusMessage && (
            <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              fareStatusMessage.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{fareStatusMessage}</span>
            </div>
          )}

          <form onSubmit={handleUpdateFare} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Fare Rate Per Kilometer (INR ₹)
              </label>
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-3 text-slate-400 font-bold">₹</span>
                <input
                  id="admin-fare-rate-input"
                  type="number"
                  step="0.05"
                  min="0.10"
                  max="50.00"
                  value={fareInput}
                  onChange={e => setFareInput(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 text-lg font-mono font-black border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-hidden"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Default benchmark rate is ₹1.50/km.</p>
            </div>

            {/* Live calculation simulation preview */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <p className="font-bold text-slate-700">Real-Time Fare Computation Preview:</p>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <p className="text-[10px] text-slate-400">Village Run (30 km)</p>
                  <p className="text-sm font-black text-slate-900">
                    ₹{(30 * (parseFloat(fareInput) || 1.5)).toFixed(0)}
                  </p>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <p className="text-[10px] text-slate-400">Hunsur → Mysuru (45 km)</p>
                  <p className="text-sm font-black text-slate-900">
                    ₹{(45 * (parseFloat(fareInput) || 1.5)).toFixed(0)}
                  </p>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <p className="text-[10px] text-slate-400">Mysuru → Blr (140 km)</p>
                  <p className="text-sm font-black text-slate-900">
                    ₹{(140 * (parseFloat(fareInput) || 1.5)).toFixed(0)}
                  </p>
                </div>
              </div>
            </div>

            <button
              id="save-fare-rate-btn"
              type="submit"
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm rounded-xl shadow-md shadow-red-600/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Apply Fare Rate System-Wide</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: BUS FLEET MANAGEMENT */}
      {activeSubTab === 'buses' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">Operational Bus Fleet</h2>
            <button
              onClick={() => setShowAddBusModal(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Bus</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buses.map((bus: Bus) => (
              <div key={bus.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-black px-2 py-0.5 bg-slate-100 text-slate-800 rounded">
                      {bus.bus_number}
                    </span>
                    <h3 className="font-black text-base text-slate-900 mt-1">{bus.bus_name}</h3>
                    <span className="text-xs text-amber-700 font-semibold">{bus.bus_type}</span>
                  </div>

                  <button
                    onClick={() => handleDeleteBus(bus.id, bus.bus_name)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove Bus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Capacity: <strong className="text-slate-800">{bus.total_seats} seats</strong></span>
                  <span className="text-emerald-600 font-bold">● Active in Service</span>
                </div>
              </div>
            ))}
          </div>

          {/* Add Bus Modal */}
          {showAddBusModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
                <h3 className="text-lg font-black text-slate-900 mb-3">Register New Bus to Fleet</h3>
                <form onSubmit={handleAddBus} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Bus Service Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Karnataka Sarige Express"
                      value={busName}
                      onChange={e => setBusName(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Bus Registration Number</label>
                    <input
                      type="text"
                      required
                      placeholder="KA-09-F-9988"
                      value={busNumber}
                      onChange={e => setBusNumber(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Service Class</label>
                    <select
                      value={busType}
                      onChange={e => setBusType(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
                    >
                      <option value="Karnataka Sarige (Express)">Karnataka Sarige (Express)</option>
                      <option value="Rajahamsa Executive">Rajahamsa Executive</option>
                      <option value="Airavat Club Class (Multi-Axle)">Airavat Club Class (Multi-Axle)</option>
                      <option value="EV Power Plus (Electric)">EV Power Plus (Electric)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Total Seats</label>
                    <input
                      type="number"
                      min="20"
                      max="60"
                      value={totalSeats}
                      onChange={e => setTotalSeats(Number(e.target.value))}
                      className="w-full p-2.5 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div className="flex gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowAddBusModal(false)}
                      className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl"
                    >
                      Save Bus
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: VILLAGE & LOCATION MANAGER */}
      {activeSubTab === 'locations' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Rural Village & Transit Hub Directory</h2>
              <p className="text-xs text-slate-500">
                Register small hamlets, rural handposts, or new town bus stops with custom GPS coordinates for instant routing.
              </p>
            </div>

            <button
              onClick={() => setShowAddLocationModal(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register Village</span>
            </button>
          </div>

          {/* Quick Location Form Modal */}
          {showAddLocationModal && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <h3 className="text-sm font-black text-slate-900 mb-2">Register New Village or Stop</h3>
              <form onSubmit={handleAddLocation} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Village/Town Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Saligrama"
                    value={locName}
                    onChange={e => setLocName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Category</label>
                  <select
                    value={locType}
                    onChange={e => setLocType(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="village">Village</option>
                    <option value="town">Town</option>
                    <option value="city">City</option>
                    <option value="hub">Transit Hub</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">District</label>
                  <input
                    type="text"
                    required
                    placeholder="Mysuru"
                    value={locDistrict}
                    onChange={e => setLocDistrict(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    placeholder="12.55"
                    value={locLat}
                    onChange={e => setLocLat(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    placeholder="76.32"
                    value={locLng}
                    onChange={e => setLocLng(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div className="md:col-span-5 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddLocationModal(false)}
                    className="px-4 py-1.5 border border-slate-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-1.5 bg-red-600 text-white font-bold rounded-lg"
                  >
                    Save Location
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: DEPOT FLEET & RBAC OPERATIONS */}
      {activeSubTab === 'depots' && (
        <div className="space-y-6 animate-in fade-in">
          <DepotFleetManagement
            currentUser={user}
            isAdmin={isAdmin}
            isDepotManager={isDepotManager}
            onBusUpdated={loadDashboard}
          />
        </div>
      )}
    </div>
  );
};
