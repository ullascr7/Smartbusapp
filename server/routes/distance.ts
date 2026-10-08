import { Router } from 'express';
import { dbStore } from '../db.js';
import { DistanceCalculationResult } from '../../src/types/index.js';

const router = Router();

// Haversine formula for straight-line distance fallback
function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// In-memory cache for OSRM routes
const routeCache = new Map<string, { roadDistance: number; geometry?: [number, number][] }>();

// POST /api/distance/calculate
router.post('/calculate', async (req, res) => {
  try {
    const { source, destination } = req.body;

    if (!source || !destination) {
      return res.status(400).json({ error: 'Source and destination coordinates are required' });
    }

    const sLat = parseFloat(source.latitude || source.lat);
    const sLng = parseFloat(source.longitude || source.lng);
    const dLat = parseFloat(destination.latitude || destination.lat);
    const dLng = parseFloat(destination.longitude || destination.lng);

    if (isNaN(sLat) || isNaN(sLng) || isNaN(dLat) || isNaN(dLng)) {
      return res.status(400).json({ error: 'Invalid coordinates provided' });
    }

    // Check same location
    if (Math.abs(sLat - dLat) < 0.001 && Math.abs(sLng - dLng) < 0.001) {
      return res.status(400).json({ error: 'Source and destination cannot be the same location' });
    }

    const straightDist = calculateHaversineKm(sLat, sLng, dLat, dLng);
    const cacheKey = `${sLat.toFixed(4)},${sLng.toFixed(4)}-${dLat.toFixed(4)},${dLng.toFixed(4)}`;

    let roadDistanceKm = straightDist * 1.28; // Empirical highway curvature factor fallback
    let routeGeometry: [number, number][] | undefined = undefined;

    if (routeCache.has(cacheKey)) {
      const cached = routeCache.get(cacheKey)!;
      roadDistanceKm = cached.roadDistance;
      routeGeometry = cached.geometry;
    } else {
      try {
        // Call OSRM public routing API for driving road network distance
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${sLng},${sLat};${dLng},${dLat}?overview=full&geometries=geojson`;
        const response = await fetch(osrmUrl, {
          headers: {
            'User-Agent': 'SmartBusAI-KSRTC/1.0'
          },
          signal: AbortSignal.timeout(4000)
        });

        if (response.ok) {
          const data = await response.json() as any;
          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            roadDistanceKm = Math.round((route.distance / 1000) * 10) / 10;
            if (route.geometry && route.geometry.coordinates) {
              // Convert [lng, lat] to [lat, lng]
              routeGeometry = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
            }
            routeCache.set(cacheKey, { roadDistance: roadDistanceKm, geometry: routeGeometry });
          }
        }
      } catch (routingErr) {
        console.warn('OSRM routing service unavailable, using road curvature model:', routingErr);
        roadDistanceKm = Math.round(straightDist * 1.26 * 10) / 10;
      }
    }

    const adminSettings = dbStore.getAdminSettings();
    const ratePerKm = adminSettings.fare_per_km || 1.50;
    const estimatedFare = Math.round(roadDistanceKm * ratePerKm * 100) / 100;

    const result: DistanceCalculationResult = {
      source: { name: source.name || 'Source', lat: sLat, lng: sLng },
      destination: { name: destination.name || 'Destination', lat: dLat, lng: dLng },
      roadDistanceKm,
      straightDistanceKm: straightDist,
      routeGeometry,
      defaultRatePerKm: ratePerKm,
      estimatedFare
    };

    return res.json(result);
  } catch (error: any) {
    console.error('Distance calculation error:', error);
    return res.status(500).json({ error: 'Failed to calculate distance' });
  }
});

export default router;
