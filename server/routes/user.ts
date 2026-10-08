import { Router } from 'express';
import { dbStore } from '../db.ts';
import { authenticateToken, type AuthRequest } from '../auth.ts';

const router = Router();

// GET /api/user/bookings
router.get('/bookings', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const allBookings = dbStore.getBookings();
    const buses = dbStore.getBuses();
    const passengers = dbStore.getPassengers();

    // Find bookings belonging to user or demo user
    const userBookings = allBookings.filter(b => b.user_id === userId || (userId === 'user-demo-1' && b.user_id === 'guest-user'));

    const todayStr = new Date().toISOString().split('T')[0];

    const enriched = userBookings.map(b => {
      const bus = buses.find(busItem => busItem.id === b.bus_id);
      const bookingPassengers = passengers.filter(p => p.booking_id === b.id);
      return {
        ...b,
        bus,
        passengers: bookingPassengers,
        isUpcoming: b.travel_date >= todayStr && b.booking_status === 'CONFIRMED'
      };
    });

    enriched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const upcoming = enriched.filter(b => b.isUpcoming);
    const previous = enriched.filter(b => !b.isUpcoming);

    return res.json({
      all: enriched,
      upcoming,
      previous,
      count: enriched.length
    });
  } catch (error: any) {
    console.error('User bookings error:', error);
    return res.status(500).json({ error: 'Failed to fetch user bookings' });
  }
});

export default router;
