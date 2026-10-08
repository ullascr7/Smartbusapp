import { Router } from 'express';
import { dbStore } from '../db.js';
import { requireAuth, requireAdmin, requireDepotManagerForAssignedDepot, AuthRequest } from '../auth.js';
import { Bus, Route, RouteStop, Trip, OperationalStatus, LiveBusStatus } from '../../src/types/index.js';

const router = Router();

// GET /api/depots - List all depots with summary statistics
router.get('/', (req, res) => {
  try {
    const depots = dbStore.getDepots();
    const buses = dbStore.getBuses();
    const routes = dbStore.getRoutes();
    const managers = dbStore.getDepotManagers();
    const users = dbStore.getUsers();

    const result = depots.map(depot => {
      const depotBuses = buses.filter(b => b.depot_id === depot.id);
      const depotBusIds = new Set(depotBuses.map(b => b.id));
      const depotRoutes = routes.filter(r => depotBusIds.has(r.bus_id));
      const depotManagerRecord = managers.find(m => m.depot_id === depot.id);
      const managerUser = depotManagerRecord ? users.find(u => u.id === depotManagerRecord.user_id) : null;

      const activeBuses = depotBuses.filter(b => b.operational_status === 'Active' || !b.operational_status);
      const maintenanceBuses = depotBuses.filter(b => b.operational_status === 'Maintenance');
      const breakdownBuses = depotBuses.filter(b => b.operational_status === 'Breakdown');

      return {
        ...depot,
        totalBuses: depotBuses.length,
        activeBusesCount: activeBuses.length,
        maintenanceBusesCount: maintenanceBuses.length,
        breakdownBusesCount: breakdownBuses.length,
        routesCount: depotRoutes.length,
        manager: managerUser ? { id: managerUser.id, name: managerUser.name, email: managerUser.email, phone: managerUser.phone } : null
      };
    });

    return res.json({ depots: result });
  } catch (error: any) {
    console.error('Error fetching depots:', error);
    return res.status(500).json({ error: 'Failed to retrieve depots' });
  }
});

// GET /api/depots/:id - Get details of a single depot
router.get('/:id', (req, res) => {
  try {
    const depot = dbStore.getDepotById(req.params.id);
    if (!depot) return res.status(404).json({ error: 'Depot not found' });

    const buses = dbStore.getBuses().filter(b => b.depot_id === depot.id);
    const routes = dbStore.getRoutes();
    const routeStops = dbStore.getRouteStops();
    const locations = dbStore.getLocations();
    const locMap = new Map(locations.map(l => [l.id, l]));

    const depotBusIds = new Set(buses.map(b => b.id));
    const depotRoutes = routes.filter(r => depotBusIds.has(r.bus_id)).map(r => {
      const stops = routeStops
        .filter(rs => rs.route_id === r.id)
        .sort((a, b) => a.stop_order - b.stop_order)
        .map(rs => ({
          ...rs,
          locationName: locMap.get(rs.location_id)?.name || 'Stop'
        }));
      return { ...r, stops };
    });

    const managers = dbStore.getDepotManagers().filter(m => m.depot_id === depot.id);
    const users = dbStore.getUsers();
    const managerUsers = managers.map(m => {
      const u = users.find(usr => usr.id === m.user_id);
      return u ? { id: u.id, name: u.name, email: u.email, phone: u.phone } : null;
    }).filter(Boolean);

    return res.json({
      depot,
      buses,
      routes: depotRoutes,
      managers: managerUsers
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve depot details' });
  }
});

// POST /api/depots - Admin creates new depot
router.post('/', requireAdmin, (req: AuthRequest, res) => {
  try {
    const { name, code, location, district, state } = req.body;
    if (!name || !code || !location || !district) {
      return res.status(400).json({ error: 'Name, code, location, and district are required' });
    }

    const existingCode = dbStore.getDepots().find(d => d.code.toUpperCase() === code.trim().toUpperCase());
    if (existingCode) {
      return res.status(400).json({ error: `Depot with code "${code}" already exists` });
    }

    const newDepot = dbStore.addDepot({
      id: `depot-${Date.now()}`,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      location: location.trim(),
      district: district.trim(),
      state: state || 'Karnataka'
    });

    return res.status(201).json({ message: 'Depot created successfully', depot: newDepot });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to create depot' });
  }
});

// PUT /api/depots/:id - Update depot details
router.put('/:id', requireDepotManagerForAssignedDepot, (req: AuthRequest, res) => {
  try {
    const depotId = req.params.id;
    const updated = dbStore.updateDepot(depotId, req.body);
    if (!updated) return res.status(404).json({ error: 'Depot not found' });

    return res.json({ message: 'Depot updated successfully', depot: updated });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update depot' });
  }
});

// GET /api/depots/:id/buses - Get buses for this depot
router.get('/:id/buses', (req, res) => {
  try {
    const depotId = req.params.id;
    const buses = dbStore.getBuses().filter(b => b.depot_id === depotId);
    return res.json({ buses });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch buses for depot' });
  }
});

// POST /api/depots/:id/buses - Add new bus assigned to this depot
router.post('/:id/buses', requireDepotManagerForAssignedDepot, (req: AuthRequest, res) => {
  try {
    const depotId = req.params.id;
    const depot = dbStore.getDepotById(depotId);
    if (!depot) return res.status(404).json({ error: 'Depot not found' });

    const { bus_name, bus_number, bus_type, total_seats, amenities, driver_name, driver_contact } = req.body;
    if (!bus_name || !bus_number || !bus_type) {
      return res.status(400).json({ error: 'Bus name, registration number, and bus type are required' });
    }

    const newBus: Bus = {
      id: `bus-${Date.now()}`,
      bus_name: bus_name.trim(),
      bus_number: bus_number.trim().toUpperCase(),
      bus_type,
      total_seats: Number(total_seats) || 36,
      amenities: Array.isArray(amenities) ? amenities : ['Pushback Seats', 'Luggage Carrier', 'Emergency Exit'],
      depot_id: depotId,
      operational_status: 'Active',
      live_status: 'Not Started',
      driver_name: driver_name || 'Assigned Depot Pilot',
      driver_contact: driver_contact || '+91 94480 00000',
      status_updated_at: new Date().toISOString(),
      live_lat: 12.3118,
      live_lng: 76.6529,
      live_speed: 0
    };

    const added = dbStore.addBus(newBus);
    return res.status(201).json({ message: 'Bus registered successfully in depot', bus: added });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to add bus' });
  }
});

// PUT /api/depots/:id/buses/:busId - Edit bus details
router.put('/:id/buses/:busId', requireDepotManagerForAssignedDepot, (req: AuthRequest, res) => {
  try {
    const { busId } = req.params;
    const bus = dbStore.getBuses().find(b => b.id === busId);
    if (!bus) return res.status(404).json({ error: 'Bus not found' });

    const updated = dbStore.updateBus(busId, req.body, req.user);
    return res.json({ message: 'Bus updated successfully', bus: updated });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to update bus' });
  }
});

// PUT /api/depots/:id/buses/:busId/status - Update operational or live status with timestamp
router.put('/:id/buses/:busId/status', requireDepotManagerForAssignedDepot, (req: AuthRequest, res) => {
  try {
    const { busId } = req.params;
    const { operational_status, live_status, delay_minutes } = req.body;
    const updates: Partial<Bus> = {
      status_updated_at: new Date().toISOString()
    };

    if (operational_status) updates.operational_status = operational_status as OperationalStatus;
    if (live_status) updates.live_status = live_status as LiveBusStatus;

    const updated = dbStore.updateBus(busId, updates, req.user);
    if (!updated) return res.status(404).json({ error: 'Bus not found' });

    return res.json({
      message: `Bus status changed to ${updated.operational_status} (${updated.live_status})`,
      bus: updated
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to update bus status' });
  }
});

// DELETE /api/depots/:id/buses/:busId - Delete bus from depot
router.delete('/:id/buses/:busId', requireDepotManagerForAssignedDepot, (req: AuthRequest, res) => {
  try {
    const { busId } = req.params;
    const success = dbStore.deleteBus(busId, req.user);
    if (!success) return res.status(404).json({ error: 'Bus not found or could not be removed' });

    return res.json({ message: 'Bus removed from depot fleet successfully' });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to delete bus' });
  }
});

// POST /api/depots/:id/routes - Create route with stops for bus in depot
router.post('/:id/routes', requireDepotManagerForAssignedDepot, (req: AuthRequest, res) => {
  try {
    const { id: depotId } = req.params;
    const { bus_id, route_name, stops } = req.body;
    if (!bus_id || !route_name || !stops || !Array.isArray(stops) || stops.length < 2) {
      return res.status(400).json({ error: 'Bus ID, route name, and at least 2 stops are required' });
    }

    const bus = dbStore.getBuses().find(b => b.id === bus_id);
    if (!bus) return res.status(404).json({ error: 'Bus not found' });
    if (bus.depot_id !== depotId) {
      return res.status(403).json({ error: 'Cannot attach route: Bus belongs to a different depot' });
    }

    const newRoute: Route = {
      id: `route-${Date.now()}`,
      bus_id,
      route_name: route_name.trim()
    };

    const routeStops: RouteStop[] = stops.map((s: any, idx: number) => ({
      id: `rs-${Date.now()}-${idx + 1}`,
      route_id: newRoute.id,
      location_id: s.location_id,
      stop_order: idx + 1,
      arrival_time: s.arrival_time || '07:00 AM',
      departure_time: s.departure_time || '07:15 AM',
      distance_from_start: Number(s.distance_from_start) || (idx * 20)
    }));

    dbStore.addRoute(newRoute, routeStops);

    return res.status(201).json({
      message: 'Route and stops created successfully',
      route: newRoute,
      stops: routeStops
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to create route for depot' });
  }
});

// GET /api/depots/:id/trips - List trips for depot
router.get('/:id/trips', requireDepotManagerForAssignedDepot, (req: AuthRequest, res) => {
  try {
    const { id: depotId } = req.params;
    const buses = dbStore.getBuses().filter(b => b.depot_id === depotId);
    const busIds = new Set(buses.map(b => b.id));

    const trips = dbStore.getTrips().filter(t => busIds.has(t.bus_id));
    return res.json({ trips });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// POST /api/depots/:id/trips - Create trip
router.post('/:id/trips', requireDepotManagerForAssignedDepot, (req: AuthRequest, res) => {
  try {
    const { id: depotId } = req.params;
    const { bus_id, route_id, travel_date, driver_id, start_time } = req.body;

    if (!bus_id || !travel_date) {
      return res.status(400).json({ error: 'bus_id and travel_date are required' });
    }

    const bus = dbStore.getBuses().find(b => b.id === bus_id);
    if (!bus) return res.status(404).json({ error: 'Bus not found' });
    if (bus.depot_id !== depotId) {
      return res.status(403).json({ error: 'Bus does not belong to this depot' });
    }

    const newTrip: Trip = {
      id: `trip-${Date.now()}`,
      bus_id,
      route_id: route_id || '',
      travel_date,
      driver_id: driver_id || bus.driver_id,
      status: 'Not Started',
      start_time: start_time || '06:00 AM',
      current_stop_order: 1,
      updated_at: new Date().toISOString()
    };

    dbStore.addTrip(newTrip);
    return res.status(201).json({ message: 'Trip created successfully', trip: newTrip });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to create trip' });
  }
});

export default router;
