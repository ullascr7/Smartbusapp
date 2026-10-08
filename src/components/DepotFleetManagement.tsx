import React, { useState, useEffect } from 'react';
import {
  Building2,
  Bus as BusIcon,
  Plus,
  Route as RouteIcon,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Trash2,
  Shield,
  UserCheck,
  Calendar,
  Layers,
  ArrowRight,
  Activity,
  Wrench,
  Loader2,
  Sparkles
} from 'lucide-react';
import { Bus, Depot, Route, RouteStop, User } from '../types/index.js';
import { api } from '../services/api.js';

interface DepotFleetManagementProps {
  currentUser: User | null;
  isAdmin: boolean;
  isDepotManager: boolean;
  onBusUpdated?: () => void;
}

export const DepotFleetManagement: React.FC<DepotFleetManagementProps> = ({
  currentUser,
  isAdmin,
  isDepotManager,
  onBusUpdated
}) => {
  const [depots, setDepots] = useState<any[]>([]);
  const [selectedDepotId, setSelectedDepotId] = useState<string>('');
  const [depotDetails, setDepotDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Add Bus Modal State
  const [showAddBusModal, setShowAddBusModal] = useState(false);
  const [newBusName, setNewBusName] = useState('');
  const [newBusNumber, setNewBusNumber] = useState('');
  const [newBusType, setNewBusType] = useState('Karnataka Sarige');
  const [newBusSeats, setNewBusSeats] = useState(42);
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverContact, setNewDriverContact] = useState('');
  const [submittingBus, setSubmittingBus] = useState(false);

  // Status Change Modal State
  const [statusBus, setStatusBus] = useState<Bus | null>(null);
  const [newOperationalStatus, setNewOperationalStatus] = useState<string>('Active');
  const [newLiveStatus, setNewLiveStatus] = useState<string>('Running');

  // New Route Modal State
  const [showAddRouteModal, setShowAddRouteModal] = useState(false);
  const [selectedBusForRoute, setSelectedBusForRoute] = useState<string>('');
  const [newRouteName, setNewRouteName] = useState('');
  const [routeStopsInput, setRouteStopsInput] = useState<Array<{ location_id: string; locationName: string; arrival: string; departure: string; distance: number }>>([
    { location_id: 'loc-1', locationName: 'Mysuru (Suburban BS)', arrival: '06:00 AM', departure: '06:15 AM', distance: 0 },
    { location_id: 'loc-3', locationName: 'Hunsur', arrival: '07:05 AM', departure: '07:15 AM', distance: 45 },
    { location_id: 'loc-7', locationName: 'Madikeri', arrival: '09:00 AM', departure: '09:15 AM', distance: 120 }
  ]);
  const [allLocations, setAllLocations] = useState<any[]>([]);

  // Load depots
  const fetchDepots = async () => {
    setLoading(true);
    try {
      const res = await api.depots.getAll();
      setDepots(res.depots || []);

      // If user is a depot manager, default to their depot
      if (isDepotManager && currentUser?.depot_id) {
        setSelectedDepotId(currentUser.depot_id);
      } else if (res.depots && res.depots.length > 0 && !selectedDepotId) {
        setSelectedDepotId(res.depots[0].id);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to fetch depots');
    } finally {
      setLoading(false);
    }
  };

  // Load single depot details
  const fetchDepotDetails = async (id: string) => {
    if (!id) return;
    try {
      const details = await api.depots.getById(id);
      setDepotDetails(details);
    } catch (err: any) {
      console.warn('Error loading depot details:', err);
    }
  };

  useEffect(() => {
    fetchDepots();
    api.locations.getAll().then(res => setAllLocations(res.locations || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedDepotId) {
      fetchDepotDetails(selectedDepotId);
    }
  }, [selectedDepotId]);

  const handleAddBusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    if (!newBusName.trim() || !newBusNumber.trim()) {
      setActionError('Please specify bus name and unique registration number');
      return;
    }

    setSubmittingBus(true);
    try {
      const res = await api.depots.addBus(selectedDepotId, {
        bus_name: newBusName,
        bus_number: newBusNumber,
        bus_type: newBusType,
        total_seats: newBusSeats,
        driver_name: newDriverName || 'Depot Reserve Pilot',
        driver_contact: newDriverContact || '+91 94480 12345',
        amenities: ['Cushioned Seats', 'Luggage Compartment', 'Emergency Exit']
      });

      setActionSuccess(res.message || 'Bus registered in depot fleet!');
      setShowAddBusModal(false);
      setNewBusName('');
      setNewBusNumber('');
      fetchDepotDetails(selectedDepotId);
      if (onBusUpdated) onBusUpdated();
    } catch (err: any) {
      setActionError(err.message || 'Failed to add bus to depot');
    } finally {
      setSubmittingBus(false);
    }
  };

  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusBus) return;
    setActionError(null);

    try {
      await api.depots.updateBusStatus(selectedDepotId, statusBus.id, {
        operational_status: newOperationalStatus,
        live_status: newLiveStatus
      });
      setActionSuccess(`Bus ${statusBus.bus_number} status updated to ${newOperationalStatus} (${newLiveStatus})`);
      setStatusBus(null);
      fetchDepotDetails(selectedDepotId);
      if (onBusUpdated) onBusUpdated();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update bus status');
    }
  };

  const handleDeleteBus = async (busId: string, busNum: string) => {
    if (!window.confirm(`Are you sure you want to decommission and remove bus ${busNum} from this depot?`)) return;
    try {
      await api.depots.deleteBus(selectedDepotId, busId);
      setActionSuccess(`Bus ${busNum} decommissioned successfully`);
      fetchDepotDetails(selectedDepotId);
      if (onBusUpdated) onBusUpdated();
    } catch (err: any) {
      setActionError(err.message || 'Failed to remove bus');
    }
  };

  const handleCreateRouteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusForRoute || !newRouteName.trim() || routeStopsInput.length < 2) {
      setActionError('Please select a bus, specify route name, and include at least 2 stops');
      return;
    }

    try {
      await api.depots.addRoute(selectedDepotId, {
        bus_id: selectedBusForRoute,
        route_name: newRouteName,
        stops: routeStopsInput.map((s, idx) => ({
          location_id: s.location_id,
          stop_order: idx + 1,
          arrival_time: s.arrival,
          departure_time: s.departure,
          distance_from_start: s.distance
        }))
      });
      setActionSuccess(`Route "${newRouteName}" created and assigned to bus!`);
      setShowAddRouteModal(false);
      setNewRouteName('');
      fetchDepotDetails(selectedDepotId);
    } catch (err: any) {
      setActionError(err.message || 'Failed to create route');
    }
  };

  const activeDepot = depots.find(d => d.id === selectedDepotId);
  const isAuthorizedForCurrentDepot = isAdmin || (isDepotManager && currentUser?.depot_id === selectedDepotId);

  return (
    <div className="space-y-6">
      {/* Depot Selector & RBAC Access Notice */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">Bus Depot Fleet & Operations</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 uppercase">
                RBAC Active
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Manage depot assets, assign bus schedules, update maintenance status, and log live operational changes.
            </p>
          </div>
        </div>

        {/* Depot Selector Dropdown */}
        <div className="flex items-center gap-3">
          <label htmlFor="depot-select" className="text-xs font-bold text-slate-600 whitespace-nowrap">
            Selected Depot:
          </label>
          <select
            id="depot-select"
            value={selectedDepotId}
            disabled={isDepotManager && !isAdmin} // depot manager is locked to their depot
            onChange={e => setSelectedDepotId(e.target.value)}
            className="px-3 py-2 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
          >
            {depots.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code}) {currentUser?.depot_id === d.id ? '★ Assigned' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-900">×</button>
        </div>
      )}
      {actionError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-bold rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-red-600 hover:text-red-900">×</button>
        </div>
      )}

      {/* Depot Quick Stats Banner */}
      {activeDepot && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <p className="text-[11px] font-bold text-slate-500 uppercase">Total Fleet Size</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{depotDetails?.buses?.length || activeDepot.totalBuses || 0} Buses</p>
            <span className="text-[10px] text-slate-500">Depot Code: {activeDepot.code}</span>
          </div>
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
            <p className="text-[11px] font-bold text-emerald-700 uppercase">Active / On-Duty</p>
            <p className="text-2xl font-black text-emerald-800 mt-1">
              {depotDetails?.buses?.filter((b: Bus) => b.operational_status === 'Active' || !b.operational_status).length || 0} Buses
            </p>
            <span className="text-[10px] text-emerald-600">Available for Dispatch</span>
          </div>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <p className="text-[11px] font-bold text-amber-700 uppercase">In Maintenance</p>
            <p className="text-2xl font-black text-amber-800 mt-1">
              {depotDetails?.buses?.filter((b: Bus) => b.operational_status === 'Maintenance').length || 0} Buses
            </p>
            <span className="text-[10px] text-amber-600">Workshop Servicing</span>
          </div>
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl">
            <p className="text-[11px] font-bold text-purple-700 uppercase">Active Route Corridors</p>
            <p className="text-2xl font-black text-purple-800 mt-1">{depotDetails?.routes?.length || 0} Routes</p>
            <span className="text-[10px] text-purple-600">Covering Rural & Urban Hubs</span>
          </div>
        </div>
      )}

      {/* Fleet Action Controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <BusIcon className="w-4 h-4 text-red-600" />
            Depot Bus Fleet & Live Readiness
          </h3>
          <p className="text-xs text-slate-500">
            {isAuthorizedForCurrentDepot
              ? 'You have operational authority to add buses, modify statuses, and configure routes.'
              : 'View-only mode (Restricted: You do not have permissions for this depot).'}
          </p>
        </div>

        {isAuthorizedForCurrentDepot && (
          <div className="flex items-center gap-2">
            <button
              id="depot-add-route-btn"
              type="button"
              onClick={() => {
                if (depotDetails?.buses?.length === 0) {
                  setActionError('Please add at least one bus to the depot before configuring a route');
                  return;
                }
                setSelectedBusForRoute(depotDetails?.buses[0]?.id || '');
                setShowAddRouteModal(true);
              }}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RouteIcon className="w-3.5 h-3.5" />
              <span>Create New Route</span>
            </button>

            <button
              id="depot-add-bus-btn"
              type="button"
              onClick={() => setShowAddBusModal(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register Bus in Depot</span>
            </button>
          </div>
        )}
      </div>

      {/* Buses Fleet Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Bus & Reg. Number</th>
                <th className="py-3 px-4">Type & Capacity</th>
                <th className="py-3 px-4">Assigned Pilot / Driver</th>
                <th className="py-3 px-4">Operational Status</th>
                <th className="py-3 px-4">Live Trip Status</th>
                <th className="py-3 px-4">Last Status Update</th>
                {isAuthorizedForCurrentDepot && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {(!depotDetails?.buses || depotDetails.buses.length === 0) ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No buses registered in this depot yet.
                  </td>
                </tr>
              ) : (
                depotDetails.buses.map((bus: Bus) => {
                  const opStatus = bus.operational_status || 'Active';
                  const liveStatus = bus.live_status || 'Not Started';

                  return (
                    <tr key={bus.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 text-sm">{bus.bus_name}</div>
                        <div className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded inline-block mt-0.5">
                          {bus.bus_number}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800">{bus.bus_type}</span>
                        <div className="text-[11px] text-slate-500">{bus.total_seats} Passenger Seats</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{bus.driver_name || 'Unassigned'}</div>
                        <div className="text-[11px] text-slate-500">{bus.driver_contact || '—'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {opStatus === 'Active' ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-max">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Active
                          </span>
                        ) : opStatus === 'Maintenance' ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1 w-max">
                            <Wrench className="w-3 h-3" /> Maintenance
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800 flex items-center gap-1 w-max">
                            <AlertTriangle className="w-3 h-3" /> Breakdown
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-blue-500" />
                          <span>{liveStatus}</span>
                        </div>
                        {bus.live_speed !== undefined && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            {bus.live_speed} km/h • Next: {bus.live_next_stop || 'En Route'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-slate-500">
                        {bus.status_updated_at ? new Date(bus.status_updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                      </td>
                      {isAuthorizedForCurrentDepot && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setStatusBus(bus);
                                setNewOperationalStatus(bus.operational_status || 'Active');
                                setNewLiveStatus(bus.live_status || 'Running');
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-[11px] transition-colors"
                              title="Update operational status"
                            >
                              Update Status
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBus(bus.id, bus.bus_number)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Decommission bus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Routes Configured for this Depot */}
      {depotDetails?.routes && depotDetails.routes.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h4 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
            <RouteIcon className="w-4 h-4 text-red-600" />
            Configured Route Schedules ({depotDetails.routes.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {depotDetails.routes.map((r: any) => (
              <div key={r.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-black text-sm text-slate-900">{r.route_name}</h5>
                  <span className="text-[10px] font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                    {r.stops?.length || 0} Stops
                  </span>
                </div>
                <div className="space-y-1.5 mt-2">
                  {r.stops?.map((s: any, idx: number) => (
                    <div key={s.id || idx} className="flex items-center justify-between text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-slate-200 text-[10px] font-bold flex items-center justify-center text-slate-700">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-900">{s.locationName || s.name || 'Stop'}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">
                        {s.arrival_time} • {s.distance_from_start} km
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Bus Modal */}
      {showAddBusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <BusIcon className="w-5 h-5 text-red-600" />
                Register New Bus into {activeDepot?.name}
              </h3>
              <button onClick={() => setShowAddBusModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleAddBusSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Bus Brand / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Karnataka Sarige Express 09"
                  value={newBusName}
                  onChange={e => setNewBusName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Registration Number (Unique State Plate)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KA-09-F-9941"
                  value={newBusNumber}
                  onChange={e => setNewBusNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-sm font-mono uppercase font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Bus Category</label>
                  <select
                    value={newBusType}
                    onChange={e => setNewBusType(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                  >
                    <option value="Karnataka Sarige">Karnataka Sarige</option>
                    <option value="Rajahamsa Executive">Rajahamsa Executive</option>
                    <option value="Airavat Club Class">Airavat Club Class</option>
                    <option value="EV Power Plus">EV Power Plus</option>
                    <option value="Gramina Sarige">Gramina Sarige (Village Shuttle)</option>
                    <option value="Non-AC Sleeper">Non-AC Sleeper</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Total Capacity</label>
                  <input
                    type="number"
                    min={20}
                    max={55}
                    value={newBusSeats}
                    onChange={e => setNewBusSeats(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Depot Pilot Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Basavaraj Naik"
                    value={newDriverName}
                    onChange={e => setNewDriverName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Pilot Contact</label>
                  <input
                    type="text"
                    placeholder="+91 94480 12345"
                    value={newDriverContact}
                    onChange={e => setNewDriverContact(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddBusModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBus}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  {submittingBus ? 'Registering...' : 'Save & Allocate to Fleet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Operational Status Modal */}
      {statusBus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 animate-in fade-in">
            <h3 className="text-base font-black text-slate-900 mb-1">
              Update Fleet Status: {statusBus.bus_name}
            </h3>
            <p className="text-xs text-slate-500 font-mono mb-4">{statusBus.bus_number}</p>

            <form onSubmit={handleUpdateStatusSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Operational Fleet Status</label>
                <select
                  value={newOperationalStatus}
                  onChange={e => setNewOperationalStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                >
                  <option value="Active">Active (Ready for service / on-road)</option>
                  <option value="Maintenance">Maintenance (In depot workshop)</option>
                  <option value="Breakdown">Breakdown (Mechanical issue)</option>
                  <option value="Standby">Standby (Reserve fleet)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Live Trip Status</label>
                <select
                  value={newLiveStatus}
                  onChange={e => setNewLiveStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                >
                  <option value="Running">Running (On highway route)</option>
                  <option value="Delayed">Delayed (Traffic / Weather)</option>
                  <option value="Not Started">Not Started (Boarding at Depot)</option>
                  <option value="Completed">Completed (Arrived at Destination)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStatusBus(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Confirm & Broadcast Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Route Modal */}
      {showAddRouteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xl shadow-2xl border border-slate-200 animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <RouteIcon className="w-5 h-5 text-red-600" />
                Add Route with Intermediate Stops
              </h3>
              <button onClick={() => setShowAddRouteModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateRouteSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assign to Bus</label>
                <select
                  value={selectedBusForRoute}
                  onChange={e => setSelectedBusForRoute(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                >
                  {depotDetails?.buses?.map((b: Bus) => (
                    <option key={b.id} value={b.id}>
                      {b.bus_name} ({b.bus_number}) - {b.bus_type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Route Corridor Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mysuru - Bilikere - Hunsur - Madikeri Express"
                  value={newRouteName}
                  onChange={e => setNewRouteName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">Stops Sequence</label>
                  <button
                    type="button"
                    onClick={() => {
                      const nextLoc = allLocations[routeStopsInput.length % allLocations.length] || allLocations[0];
                      setRouteStopsInput(prev => [
                        ...prev,
                        {
                          location_id: nextLoc?.id || 'loc-1',
                          locationName: nextLoc?.name || 'New Stop',
                          arrival: '10:00 AM',
                          departure: '10:15 AM',
                          distance: (prev[prev.length - 1]?.distance || 0) + 30
                        }
                      ]);
                    }}
                    className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Stop
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {routeStopsInput.map((stop, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="w-5 h-5 rounded-full bg-red-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <select
                        value={stop.location_id}
                        onChange={e => {
                          const val = e.target.value;
                          const found = allLocations.find(l => l.id === val);
                          setRouteStopsInput(prev => {
                            const copy = [...prev];
                            copy[idx] = { ...copy[idx], location_id: val, locationName: found?.name || 'Stop' };
                            return copy;
                          });
                        }}
                        className="flex-1 px-2 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg outline-none"
                      >
                        {allLocations.map(l => (
                          <option key={l.id} value={l.id}>{l.name} ({l.district})</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={stop.arrival}
                        placeholder="07:00 AM"
                        onChange={e => {
                          const val = e.target.value;
                          setRouteStopsInput(prev => {
                            const copy = [...prev];
                            copy[idx] = { ...copy[idx], arrival: val };
                            return copy;
                          });
                        }}
                        className="w-20 px-2 py-1.5 text-xs font-mono border border-slate-200 rounded-lg bg-white"
                      />
                      <input
                        type="number"
                        min={0}
                        value={stop.distance}
                        placeholder="km"
                        onChange={e => {
                          const val = Number(e.target.value);
                          setRouteStopsInput(prev => {
                            const copy = [...prev];
                            copy[idx] = { ...copy[idx], distance: val };
                            return copy;
                          });
                        }}
                        className="w-16 px-2 py-1.5 text-xs font-mono border border-slate-200 rounded-lg bg-white"
                      />
                      <button
                        type="button"
                        disabled={routeStopsInput.length <= 2}
                        onClick={() => {
                          setRouteStopsInput(prev => prev.filter((_, i) => i !== idx));
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-30"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddRouteModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Save Route & Stops
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
