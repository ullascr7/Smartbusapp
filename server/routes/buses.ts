import { Router } from 'express';
import { dbStore } from '../db.js';
import { BusSearchResult, ConnectingRouteOption, Location, RouteStop } from '../../src/types/index.js';

const router = Router();

// Helper to normalize location names for matching
function normalizeLoc(name: string): string {
  return name.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim();
}

// Find if a location matches a given search string or location object
function matchesLocation(stopLoc: Location, searchName: string): boolean {
  const sNorm = normalizeLoc(searchName);
  const lNorm = normalizeLoc(stopLoc.name);
  if (lNorm.includes(sNorm) || sNorm.includes(lNorm)) return true;
  if (stopLoc.aliases && stopLoc.aliases.some(a => normalizeLoc(a).includes(sNorm) || sNorm.includes(normalizeLoc(a)))) {
    return true;
  }
  return false;
}

// Calculate estimated journey duration between two times (e.g. "08:00 AM" and "10:30 AM")
function calculateDuration(depTime: string, arrTime: string): string {
  try {
    const parseTime = (tStr: string) => {
      const [time, modifier] = tStr.trim().split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };
    const depM = parseTime(depTime);
    let arrM = parseTime(arrTime);
    if (arrM < depM) arrM += 24 * 60; // Next day
    const diff = arrM - depM;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}h ${m > 0 ? `${m}m` : '00m'}`;
  } catch {
    return '2h 30m';
  }
}

// POST /api/buses/search
router.post('/search', (req, res) => {
  try {
    const { sourceName, destinationName, travelDate } = req.body;

    if (!sourceName || !destinationName) {
      return res.status(400).json({ error: 'Source and destination locations are required' });
    }

    if (normalizeLoc(sourceName) === normalizeLoc(destinationName)) {
      return res.status(400).json({ error: 'Source and destination cannot be the same' });
    }

    const tDate = travelDate || new Date().toISOString().split('T')[0];

    const buses = dbStore.getBuses();
    const routes = dbStore.getRoutes();
    const routeStops = dbStore.getRouteStops();
    const locations = dbStore.getLocations();
    const bookings = dbStore.getBookings();
    const passengers = dbStore.getPassengers();
    const ratePerKm = dbStore.getAdminSettings().fare_per_km || 1.50;

    const locMap = new Map<string, Location>();
    for (const loc of locations) {
      locMap.set(loc.id, loc);
    }

    const directResults: BusSearchResult[] = [];

    // Check each route for smart route matching
    for (const route of routes) {
      const bus = buses.find(b => b.id === route.bus_id);
      if (!bus) continue;

      const stops = routeStops
        .filter(rs => rs.route_id === route.id)
        .sort((a, b) => a.stop_order - b.stop_order);

      // Find source stop index and destination stop index
      let srcStopIndex = -1;
      let destStopIndex = -1;

      for (let i = 0; i < stops.length; i++) {
        const stopLoc = locMap.get(stops[i].location_id);
        if (!stopLoc) continue;

        if (srcStopIndex === -1 && matchesLocation(stopLoc, sourceName)) {
          srcStopIndex = i;
        }
        if (destStopIndex === -1 && matchesLocation(stopLoc, destinationName)) {
          destStopIndex = i;
        }
      }

      // Valid match if both stops are on this route
      if (srcStopIndex !== -1 && destStopIndex !== -1 && srcStopIndex !== destStopIndex) {
        const isForward = srcStopIndex < destStopIndex;
        const sourceStop = stops[srcStopIndex];
        const destStop = stops[destStopIndex];
        const srcLoc = locMap.get(sourceStop.location_id)!;
        const destLoc = locMap.get(destStop.location_id)!;

        // Distance between intermediate stops
        const distanceKm = Math.max(
          1,
          Math.abs(destStop.distance_from_start - sourceStop.distance_from_start)
        );
        const ticketPricePerSeat = Math.round(distanceKm * ratePerKm * 100) / 100;

        // Departure and Arrival times
        let depTime = sourceStop.departure_time;
        let arrTime = destStop.arrival_time;

        if (!isForward) {
          // Return journey on this corridor (scheduled afternoon/evening return)
          const offsetHours = 6;
          const shiftTime = (tStr: string) => {
            try {
              const [time, mod] = tStr.trim().split(' ');
              let [h, m] = time.split(':').map(Number);
              if (mod === 'PM' && h < 12) h += 12;
              if (mod === 'AM' && h === 12) h = 0;
              h = (h + offsetHours) % 24;
              const newMod = h >= 12 ? 'PM' : 'AM';
              const displayH = h % 12 === 0 ? 12 : h % 12;
              return `${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${newMod}`;
            } catch {
              return '02:30 PM';
            }
          };

          depTime = shiftTime(sourceStop.departure_time);

          // Calculate realistic arrival time based on distance
          const tripMinutes = Math.max(25, Math.round((distanceKm / 45) * 60));
          try {
            const [time, mod] = depTime.split(' ');
            let [h, m] = time.split(':').map(Number);
            if (mod === 'PM' && h < 12) h += 12;
            if (mod === 'AM' && h === 12) h = 0;
            const totalMins = h * 60 + m + tripMinutes;
            const finalH = Math.floor(totalMins / 60) % 24;
            const finalM = totalMins % 60;
            const finalMod = finalH >= 12 ? 'PM' : 'AM';
            const displayH = finalH % 12 === 0 ? 12 : finalH % 12;
            arrTime = `${displayH.toString().padStart(2, '0')}:${finalM.toString().padStart(2, '0')} ${finalMod}`;
          } catch {
            arrTime = '04:00 PM';
          }
        }

        // Check booked seats for this bus on the travel date
        const busBookings = bookings.filter(
          b => b.bus_id === bus.id && b.travel_date === tDate && b.booking_status === 'CONFIRMED'
        );
        const busBookingIds = new Set(busBookings.map(b => b.id));
        const bookedSeats = passengers
          .filter(p => busBookingIds.has(p.booking_id))
          .map(p => p.seat_number);

        const availableSeatsCount = Math.max(0, bus.total_seats - bookedSeats.length);

        const stopsList = (isForward ? stops : [...stops].reverse()).map(s => {
          const l = locMap.get(s.location_id);
          return {
            locationName: l ? l.name : 'Stop',
            arrivalTime: s.arrival_time,
            departureTime: s.departure_time,
            stopOrder: s.stop_order,
            distanceKm: s.distance_from_start,
            type: l ? l.type : 'town'
          };
        });

        directResults.push({
          bus,
          route,
          sourceStop,
          destinationStop: destStop,
          sourceLocationName: srcLoc.name,
          destinationLocationName: destLoc.name,
          departureTime: depTime,
          arrivalTime: arrTime,
          estimatedDuration: calculateDuration(depTime, arrTime),
          distanceKm,
          fareRatePerKm: ratePerKm,
          ticketPricePerSeat,
          availableSeatsCount,
          bookedSeats,
          stopsList
        });
      }
    }

    // Sort direct results by departure time
    directResults.sort((a, b) => a.departureTime.localeCompare(b.departureTime));

    // If no direct bus or user requested alternatives, check Connecting Routes
    const connectingRoutes: ConnectingRouteOption[] = [];

    if (directResults.length === 0) {
      // Find major transit hubs (e.g., Mysuru, Bengaluru, Tumakuru)
      const majorHubs = locations.filter(l => l.type === 'hub' || l.type === 'city');

      for (const hub of majorHubs) {
        if (matchesLocation(hub, sourceName) || matchesLocation(hub, destinationName)) {
          continue;
        }

        // Check if there is a bus from source -> hub
        const leg1Buses: BusSearchResult[] = [];
        const leg2Buses: BusSearchResult[] = [];

        for (const route of routes) {
          const bus = buses.find(b => b.id === route.bus_id);
          if (!bus) continue;

          const stops = routeStops
            .filter(rs => rs.route_id === route.id)
            .sort((a, b) => a.stop_order - b.stop_order);

          // Leg 1 check
          let sIdx = -1;
          let hIdx1 = -1;
          for (let i = 0; i < stops.length; i++) {
            const loc = locMap.get(stops[i].location_id);
            if (!loc) continue;
            if (sIdx === -1 && matchesLocation(loc, sourceName)) sIdx = i;
            else if (sIdx !== -1 && hIdx1 === -1 && matchesLocation(loc, hub.name)) hIdx1 = i;
          }

          if (sIdx !== -1 && hIdx1 !== -1 && sIdx < hIdx1) {
            const srcStop = stops[sIdx];
            const hubStop = stops[hIdx1];
            const dist = hubStop.distance_from_start - srcStop.distance_from_start;
            leg1Buses.push({
              bus,
              route,
              sourceStop: srcStop,
              destinationStop: hubStop,
              sourceLocationName: locMap.get(srcStop.location_id)!.name,
              destinationLocationName: hub.name,
              departureTime: srcStop.departure_time,
              arrivalTime: hubStop.arrival_time,
              estimatedDuration: calculateDuration(srcStop.departure_time, hubStop.arrival_time),
              distanceKm: dist,
              fareRatePerKm: ratePerKm,
              ticketPricePerSeat: Math.round(dist * ratePerKm * 100) / 100,
              availableSeatsCount: bus.total_seats - 2,
              bookedSeats: [],
              stopsList: []
            });
          }

          // Leg 2 check
          let hIdx2 = -1;
          let dIdx = -1;
          for (let i = 0; i < stops.length; i++) {
            const loc = locMap.get(stops[i].location_id);
            if (!loc) continue;
            if (hIdx2 === -1 && matchesLocation(loc, hub.name)) hIdx2 = i;
            else if (hIdx2 !== -1 && dIdx === -1 && matchesLocation(loc, destinationName)) dIdx = i;
          }

          if (hIdx2 !== -1 && dIdx !== -1 && hIdx2 < dIdx) {
            const hubStop = stops[hIdx2];
            const destStop = stops[dIdx];
            const dist = destStop.distance_from_start - hubStop.distance_from_start;
            leg2Buses.push({
              bus,
              route,
              sourceStop: hubStop,
              destinationStop: destStop,
              sourceLocationName: hub.name,
              destinationLocationName: locMap.get(destStop.location_id)!.name,
              departureTime: hubStop.departure_time,
              arrivalTime: destStop.arrival_time,
              estimatedDuration: calculateDuration(hubStop.departure_time, destStop.arrival_time),
              distanceKm: dist,
              fareRatePerKm: ratePerKm,
              ticketPricePerSeat: Math.round(dist * ratePerKm * 100) / 100,
              availableSeatsCount: bus.total_seats - 4,
              bookedSeats: [],
              stopsList: []
            });
          }
        }

        if (leg1Buses.length > 0 && leg2Buses.length > 0) {
          const l1 = leg1Buses[0];
          const l2 = leg2Buses[0];
          connectingRoutes.push({
            hubLocation: hub,
            leg1: l1,
            leg2: l2,
            totalDistance: l1.distanceKm + l2.distanceKm,
            totalFare: l1.ticketPricePerSeat + l2.ticketPricePerSeat,
            layoverDuration: '30 mins transfer'
          });
        }
      }
    }

    return res.json({
      directBuses: directResults,
      connectingRoutes,
      totalFound: directResults.length,
      fareRatePerKm: ratePerKm,
      travelDate: tDate
    });
  } catch (error: any) {
    console.error('Bus search error:', error);
    return res.status(500).json({ error: 'Failed to search buses' });
  }
});

// GET /api/buses/:id
router.get('/:id', (req, res) => {
  const bus = dbStore.getBuses().find(b => b.id === req.params.id);
  if (!bus) return res.status(404).json({ error: 'Bus not found' });
  return res.json({ bus });
});

// GET /api/buses/:id/seats?date=YYYY-MM-DD
router.get('/:id/seats', (req, res) => {
  const busId = req.params.id;
  const travelDate = (req.query.date as string) || new Date().toISOString().split('T')[0];

  const bus = dbStore.getBuses().find(b => b.id === busId);
  if (!bus) return res.status(404).json({ error: 'Bus not found' });

  const allSeats = dbStore.getSeats().filter(s => s.bus_id === busId);
  const bookings = dbStore.getBookings().filter(
    b => b.bus_id === busId && b.travel_date === travelDate && b.booking_status === 'CONFIRMED'
  );
  const bookingIds = new Set(bookings.map(b => b.id));
  const bookedSeatNumbers = new Set(
    dbStore.getPassengers().filter(p => bookingIds.has(p.booking_id)).map(p => p.seat_number)
  );

  const seatDetails = allSeats.map(s => ({
    ...s,
    isBooked: bookedSeatNumbers.has(s.seat_number)
  }));

  return res.json({
    bus,
    travelDate,
    totalSeats: bus.total_seats,
    availableCount: bus.total_seats - bookedSeatNumbers.size,
    seats: seatDetails
  });
});

export default router;
