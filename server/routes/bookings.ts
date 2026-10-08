import { Router } from 'express';
import { dbStore } from '../db.ts';
import { authenticateToken, optionalAuth, type AuthRequest } from '../auth.ts';

const router = Router();

// POST /api/bookings - Atomic reservation & simulated payment confirmation
router.post('/', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const {
      bus_id,
      source_location,
      destination_location,
      travel_date,
      distance,
      fare_per_km,
      total_amount,
      passengers,
      payment_method
    } = req.body;

    if (!bus_id || !source_location || !destination_location || !travel_date || !passengers || passengers.length === 0) {
      return res.status(400).json({ error: 'Missing required booking information' });
    }

    // Validate travel date
    const todayStr = new Date().toISOString().split('T')[0];
    if (travel_date < todayStr) {
      return res.status(400).json({ error: 'Travel date cannot be in the past' });
    }

    // Validate passenger details
    for (const p of passengers) {
      if (!p.name || !p.name.trim()) {
        return res.status(400).json({ error: 'All passengers must have a valid name' });
      }
      if (!p.age || isNaN(Number(p.age)) || Number(p.age) <= 0 || Number(p.age) > 120) {
        return res.status(400).json({ error: `Invalid age for passenger ${p.name}` });
      }
      if (!p.gender) {
        return res.status(400).json({ error: `Please select gender for passenger ${p.name}` });
      }
      if (!p.seat_number) {
        return res.status(400).json({ error: `Seat number missing for passenger ${p.name}` });
      }
    }

    const userId = req.user?.id || 'guest-user';
    const rate = Number(fare_per_km) || dbStore.getAdminSettings().fare_per_km || 1.50;
    const dist = Number(distance) || 50;
    const calculatedTotal = Math.round(dist * rate * passengers.length * 100) / 100;

    // Use atomic transaction in dbStore to prevent concurrency double-booking
    const { booking, passengers: savedPassengers } = await dbStore.createBookingAtomic(
      {
        user_id: userId,
        bus_id,
        source_location,
        destination_location,
        travel_date,
        distance: dist,
        fare_per_km: rate,
        total_amount: calculatedTotal,
        payment_method: payment_method || 'UPI Demo',
        payment_status: 'SUCCESS'
      },
      passengers
    );

    const bus = dbStore.getBuses().find(b => b.id === bus_id);

    return res.status(201).json({
      message: 'Booking confirmed successfully!',
      booking: {
        ...booking,
        bus,
        passengers: savedPassengers
      }
    });
  } catch (error: any) {
    console.error('Booking confirmation failed:', error);
    return res.status(409).json({ error: error.message || 'Failed to complete booking' });
  }
});

// GET /api/bookings/:id
router.get('/:id', optionalAuth, (req: AuthRequest, res) => {
  const booking = dbStore.getBookings().find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const bus = dbStore.getBuses().find(b => b.id === booking.bus_id);
  const passengers = dbStore.getPassengers().filter(p => p.booking_id === booking.id);

  return res.json({
    booking: {
      ...booking,
      bus,
      passengers
    }
  });
});

// GET /api/bookings/pnr/:pnr
router.get('/pnr/:pnr', (req, res) => {
  const pnr = req.params.pnr.trim().toUpperCase();
  const booking = dbStore.getBookings().find(b => b.pnr_number.toUpperCase() === pnr);

  if (!booking) {
    return res.status(404).json({ error: `No booking found for PNR: ${pnr}` });
  }

  const bus = dbStore.getBuses().find(b => b.id === booking.bus_id);
  const passengers = dbStore.getPassengers().filter(p => p.booking_id === booking.id);

  return res.json({
    booking: {
      ...booking,
      bus,
      passengers
    }
  });
});

// POST /api/bookings/:id/cancel
router.post('/:id/cancel', optionalAuth, (req: AuthRequest, res) => {
  try {
    const updated = dbStore.cancelBooking(req.params.id, req.user?.role === 'admin' ? undefined : req.user?.id);
    if (!updated) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    return res.json({ message: 'Booking cancelled successfully. Seats have been released.', booking: updated });
  } catch (err: any) {
    return res.status(403).json({ error: err.message || 'Failed to cancel booking' });
  }
});

export default router;
