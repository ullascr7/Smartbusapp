import { Router } from 'express';
import { dbStore } from '../db.js';
import { requireAdmin, AuthRequest } from '../auth.js';
import { Bus, Location, Route, RouteStop } from '../../src/types/index.js';

const router = Router();

// GET /api/admin/dashboard - Overall platform metrics & analytics
router.get('/dashboard', requireAdmin, (req: AuthRequest, res) => {
  try {
    const bookings = dbStore.getBookings();
    const buses = dbStore.getBuses();
    const users = dbStore.getUsers();
    const passengers = dbStore.getPassengers();
    const settings = dbStore.getAdminSettings();
    const routes = dbStore.getRoutes();

    const confirmedBookings = bookings.filter(b => b.booking_status === 'CONFIRMED');
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);

    // Group bookings by date for analytics chart
    const dailyMap: Record<string, { bookings: number; revenue: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 3600 * 1000).toISOString().split('T')[0];
      dailyMap[d] = { bookings: 0, revenue: 0 };
    }

    for (const b of confirmedBookings) {
      const dateKey = b.travel_date;
      if (dailyMap[dateKey]) {
        dailyMap[dateKey].bookings += 1;
        dailyMap[dateKey].revenue += b.total_amount;
      }
    }

    const dailyAnalytics = Object.entries(dailyMap).map(([date, data]) => ({
      date: date.slice(5), // MM-DD
      fullDate: date,
      bookings: data.bookings,
      revenue: Math.round(data.revenue)
    }));

    // Route popularity
    const routeCounter: Record<string, number> = {};
    for (const b of confirmedBookings) {
      const key = `${b.source_location} → ${b.destination_location}`;
      routeCounter[key] = (routeCounter[key] || 0) + 1;
    }
    const popularRoutes = Object.entries(routeCounter)
      .map(([route, count]) => ({ route, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Recent bookings
    const recentBookings = [...bookings]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8)
      .map(b => {
        const bus = buses.find(busItem => busItem.id === b.bus_id);
        const bPassengers = passengers.filter(p => p.booking_id === b.id);
        return {
          ...b,
          busName: bus?.bus_name || 'KSRTC Express',
          passengersCount: bPassengers.length,
          passengerNames: bPassengers.map(p => p.name).join(', ')
        };
      });

    return res.json({
      stats: {
        totalBookings: bookings.length,
        confirmedBookings: confirmedBookings.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        activeBuses: buses.length,
        registeredUsers: users.length,
        currentFareRate: settings.fare_per_km
      },
      dailyAnalytics,
      popularRoutes,
      recentBookings,
      buses,
      routes
    });
  } catch (error: any) {
    console.error('Admin dashboard error:', error);
    return res.status(500).json({ error: 'Failed to fetch admin dashboard' });
  }
});

// PUT /api/admin/settings/fare - Change fare per km rate
router.put('/settings/fare', requireAdmin, (req: AuthRequest, res) => {
  try {
    const { fare_per_km } = req.body;
    const num = parseFloat(fare_per_km);
    if (isNaN(num) || num <= 0 || num > 50) {
      return res.status(400).json({ error: 'Invalid fare rate. Must be between ₹0.10 and ₹50.00 per km' });
    }

    const updatedRate = dbStore.updateAdminFare(num);
    return res.json({
      message: `Fare rate successfully updated to ₹${updatedRate.toFixed(2)} per kilometer! All searches will now use this updated rate.`,
      fare_per_km: updatedRate
    });
  } catch (error: any) {
    console.error('Fare update error:', error);
    return res.status(500).json({ error: 'Failed to update fare rate' });
  }
});

// POST /api/admin/buses - Add new bus
router.post('/buses', requireAdmin, (req: AuthRequest, res) => {
  try {
    const { bus_name, bus_number, bus_type, total_seats, amenities } = req.body;
    if (!bus_name || !bus_number || !bus_type) {
      return res.status(400).json({ error: 'Bus name, bus registration number, and type are required' });
    }

    const newBus: Bus = {
      id: `bus-${Date.now()}`,
      bus_name: bus_name.trim(),
      bus_number: bus_number.trim().toUpperCase(),
      bus_type,
      total_seats: Number(total_seats) || 36,
      amenities: Array.isArray(amenities) ? amenities : ['Standard Seating', 'Emergency Exit'],
      live_lat: 12.9774,
      live_lng: 77.5708,
      live_speed: 0,
      live_status: 'Depot Ready',
      live_next_stop: 'Depot'
    };

    dbStore.addBus(newBus);
    return res.status(201).json({ message: 'Bus created successfully', bus: newBus });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to create bus' });
  }
});

// PUT /api/admin/buses/:id - Edit bus
router.put('/buses/:id', requireAdmin, (req: AuthRequest, res) => {
  try {
    const updated = dbStore.updateBus(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Bus not found' });
    return res.json({ message: 'Bus updated successfully', bus: updated });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update bus' });
  }
});

// DELETE /api/admin/buses/:id - Delete bus
router.delete('/buses/:id', requireAdmin, (req: AuthRequest, res) => {
  try {
    const success = dbStore.deleteBus(req.params.id);
    if (!success) return res.status(404).json({ error: 'Bus not found' });
    return res.json({ message: 'Bus deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to delete bus' });
  }
});

// POST /api/admin/locations - Add village / town / city
router.post('/locations', requireAdmin, (req: AuthRequest, res) => {
  try {
    const { name, type, district, state, latitude, longitude, aliases } = req.body;
    if (!name || !district || isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'Name, district, latitude, and longitude are required' });
    }

    const newLoc: Location = {
      id: `loc-${Date.now()}`,
      name: name.trim(),
      type: type || 'village',
      district: district.trim(),
      state: state || 'Karnataka',
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      aliases: aliases ? (Array.isArray(aliases) ? aliases : aliases.split(',').map((s: string) => s.trim())) : []
    };

    dbStore.addLocation(newLoc);
    return res.status(201).json({ message: 'Location added successfully', location: newLoc });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to add location' });
  }
});

// POST /api/admin/routes - Create Route with Stops
router.post('/routes', requireAdmin, (req: AuthRequest, res) => {
  try {
    const { bus_id, route_name, stops } = req.body;
    if (!bus_id || !route_name || !stops || !Array.isArray(stops) || stops.length < 2) {
      return res.status(400).json({ error: 'Bus ID, route name, and at least 2 stops are required' });
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
      arrival_time: s.arrival_time || '08:00 AM',
      departure_time: s.departure_time || '08:15 AM',
      distance_from_start: Number(s.distance_from_start) || (idx * 25)
    }));

    dbStore.addRoute(newRoute, routeStops);
    return res.status(201).json({ message: 'Route created successfully', route: newRoute, stops: routeStops });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to create route' });
  }
});

export default router;
