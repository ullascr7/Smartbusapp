import { Router } from 'express';
import { dbStore } from '../db.ts';

const router = Router();

// GET /api/tracking/all - status of all operational buses
router.get('/all', (req, res) => {
  const buses = dbStore.getBuses();
  const routes = dbStore.getRoutes();
  const routeStops = dbStore.getRouteStops();
  const locations = dbStore.getLocations();

  const locMap = new Map(locations.map(l => [l.id, l]));

  const activeTracking = buses.map(bus => {
    const route = routes.find(r => r.bus_id === bus.id);
    const stops = route ? routeStops.filter(rs => rs.route_id === route.id).sort((a, b) => a.stop_order - b.stop_order) : [];

    const stopDetails = stops.map(s => {
      const loc = locMap.get(s.location_id);
      return {
        stopOrder: s.stop_order,
        name: loc ? loc.name : 'Unknown Stop',
        type: loc ? loc.type : 'town',
        lat: loc ? loc.latitude : 0,
        lng: loc ? loc.longitude : 0,
        arrival: s.arrival_time,
        departure: s.departure_time
      };
    });

    return {
      busId: bus.id,
      busName: bus.bus_name,
      busNumber: bus.bus_number,
      busType: bus.bus_type,
      routeName: route ? route.route_name : 'Depot Transit',
      currentLat: bus.live_lat || 12.3118,
      currentLng: bus.live_lng || 76.6529,
      speedKmh: bus.live_speed ?? 52,
      status: bus.live_status || 'On Route',
      nextStop: bus.live_next_stop || (stopDetails[1]?.name || 'Next Transit Hub'),
      stops: stopDetails
    };
  });

  return res.json({ buses: activeTracking, timestamp: new Date().toISOString() });
});

// GET /api/tracking/:busId - Real-time telemetry for a specific bus
router.get('/:busId', (req, res) => {
  const { busId } = req.params;
  const bus = dbStore.getBuses().find(b => b.id === busId);
  if (!bus) return res.status(404).json({ error: 'Bus not found' });

  const routes = dbStore.getRoutes();
  const route = routes.find(r => r.bus_id === bus.id);
  const routeStops = dbStore.getRouteStops();
  const locations = dbStore.getLocations();
  const locMap = new Map(locations.map(l => [l.id, l]));

  const stops = route ? routeStops.filter(rs => rs.route_id === route.id).sort((a, b) => a.stop_order - b.stop_order) : [];

  const stopCoords = stops.map(s => {
    const loc = locMap.get(s.location_id);
    return {
      id: s.id,
      stopOrder: s.stop_order,
      name: loc ? loc.name : 'Stop',
      district: loc ? loc.district : '',
      type: loc ? loc.type : 'town',
      lat: loc ? loc.latitude : 0,
      lng: loc ? loc.longitude : 0,
      arrivalTime: s.arrival_time,
      departureTime: s.departure_time,
      distanceKm: s.distance_from_start
    };
  });

  // Current bookings on this bus for passenger manifest
  const todayStr = new Date().toISOString().split('T')[0];
  const bookings = dbStore.getBookings().filter(b => b.bus_id === bus.id && b.travel_date === todayStr && b.booking_status === 'CONFIRMED');
  const bookingIds = new Set(bookings.map(b => b.id));
  const passengers = dbStore.getPassengers().filter(p => bookingIds.has(p.booking_id));

  return res.json({
    bus,
    route,
    stops: stopCoords,
    currentLocation: {
      lat: bus.live_lat || stopCoords[0]?.lat || 12.3118,
      lng: bus.live_lng || stopCoords[0]?.lng || 76.6529,
      speedKmh: bus.live_speed ?? 55,
      status: bus.live_status || 'En Route',
      nextStop: bus.live_next_stop || stopCoords[1]?.name || 'Next Destination'
    },
    metrics: {
      totalCapacity: bus.total_seats,
      occupiedSeats: passengers.length,
      driverName: 'R. Veerendra (Badge #9284)',
      depot: 'KSRTC Central Division',
      batteryFuelPercentage: 84
    },
    passengerManifest: passengers
  });
});

// POST /api/tracking/:busId/update - Update bus live GPS coordinates (e.g., from Driver Control dashboard)
router.post('/:busId/update', (req, res) => {
  const { busId } = req.params;
  const { lat, lng, speed, status, next_stop } = req.body;

  const bus = dbStore.getBuses().find(b => b.id === busId);
  if (!bus) return res.status(404).json({ error: 'Bus not found' });

  const updates: Partial<typeof bus> = {};
  if (lat !== undefined) updates.live_lat = parseFloat(lat);
  if (lng !== undefined) updates.live_lng = parseFloat(lng);
  if (speed !== undefined) updates.live_speed = parseInt(speed, 10);
  if (status !== undefined) updates.live_status = status;
  if (next_stop !== undefined) updates.live_next_stop = next_stop;

  const updated = dbStore.updateBus(busId, updates);
  return res.json({ message: 'Live telemetry updated', bus: updated });
});

export default router;
