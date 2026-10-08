import {
  Location,
  Bus,
  BusSearchResult,
  ConnectingRouteOption,
  DistanceCalculationResult,
  Booking,
  Passenger,
  User,
  PassengerInput
} from '../types/index.js';

const API_BASE = '/api';

// Retrieve stored JWT token
export function getAuthToken(): string | null {
  return localStorage.getItem('smartbus_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('smartbus_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('smartbus_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Network request failed');
  }

  return data;
}

export const api = {
  auth: {
    register: (data: { name: string; email: string; password: string; phone: string }) =>
      request<{ user: User; token: string; message: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    login: (data: { email: string; password: string }) =>
      request<{ user: User; token: string; message: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    getMe: () => request<{ user: User }>('/auth/me')
  },

  locations: {
    search: (query: string) =>
      request<{ locations: Location[] }>(`/locations/search?q=${encodeURIComponent(query)}`),
    getAll: () => request<{ locations: Location[] }>('/locations'),
    parseVoice: (speechText: string, fieldTarget?: string) =>
      request<{
        originalSpeech: string;
        detectedIntent: 'two_locations' | 'single_location';
        sourceLocation: { name: string; id: string } | null;
        destinationLocation: { name: string; id: string } | null;
        singleLocation: { name: string; id: string } | null;
        suggestedQuery: string;
      }>('/locations/parse-voice', {
        method: 'POST',
        body: JSON.stringify({ speechText, fieldTarget })
      })
  },

  depots: {
    getAll: () => request<{ depots: any[] }>('/depots'),
    getById: (id: string) => request<any>(`/depots/${id}`),
    create: (data: any) => request<{ message: string; depot: any }>('/depots', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id: string, data: any) => request<{ message: string; depot: any }>(`/depots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    getBuses: (depotId: string) => request<{ buses: Bus[] }>(`/depots/${depotId}/buses`),
    addBus: (depotId: string, busData: any) => request<{ message: string; bus: Bus }>(`/depots/${depotId}/buses`, {
      method: 'POST',
      body: JSON.stringify(busData)
    }),
    editBus: (depotId: string, busId: string, busData: any) => request<{ message: string; bus: Bus }>(`/depots/${depotId}/buses/${busId}`, {
      method: 'PUT',
      body: JSON.stringify(busData)
    }),
    updateBusStatus: (depotId: string, busId: string, statusData: { operational_status?: string; live_status?: string }) =>
      request<{ message: string; bus: Bus }>(`/depots/${depotId}/buses/${busId}/status`, {
        method: 'PUT',
        body: JSON.stringify(statusData)
      }),
    deleteBus: (depotId: string, busId: string) => request<{ message: string }>(`/depots/${depotId}/buses/${busId}`, {
      method: 'DELETE'
    }),
    addRoute: (depotId: string, routeData: any) => request<{ message: string; route: any; stops: any[] }>(`/depots/${depotId}/routes`, {
      method: 'POST',
      body: JSON.stringify(routeData)
    }),
    getTrips: (depotId: string) => request<{ trips: any[] }>(`/depots/${depotId}/trips`),
    createTrip: (depotId: string, tripData: any) => request<{ message: string; trip: any }>(`/depots/${depotId}/trips`, {
      method: 'POST',
      body: JSON.stringify(tripData)
    })
  },

  distance: {
    calculate: (source: { latitude: number; longitude: number; name?: string }, destination: { latitude: number; longitude: number; name?: string }) =>
      request<DistanceCalculationResult>('/distance/calculate', {
        method: 'POST',
        body: JSON.stringify({ source, destination })
      })
  },

  buses: {
    search: (sourceName: string, destinationName: string, travelDate: string) =>
      request<{
        directBuses: BusSearchResult[];
        connectingRoutes: ConnectingRouteOption[];
        totalFound: number;
        fareRatePerKm: number;
        travelDate: string;
      }>('/buses/search', {
        method: 'POST',
        body: JSON.stringify({ sourceName, destinationName, travelDate })
      }),
    getById: (id: string) => request<{ bus: Bus }>(`/buses/${id}`),
    getSeats: (busId: string, date: string) =>
      request<{
        bus: Bus;
        travelDate: string;
        totalSeats: number;
        availableCount: number;
        seats: Array<{ id: string; seat_number: string; seat_type: string; isBooked: boolean }>;
      }>(`/buses/${busId}/seats?date=${date}`)
  },

  bookings: {
    create: (data: {
      bus_id: string;
      source_location: string;
      destination_location: string;
      travel_date: string;
      distance: number;
      fare_per_km: number;
      total_amount: number;
      passengers: PassengerInput[];
      payment_method?: string;
    }) =>
      request<{
        message: string;
        booking: Booking & { bus?: Bus; passengers: Passenger[] };
      }>('/bookings', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    getById: (id: string) => request<{ booking: Booking & { bus?: Bus; passengers: Passenger[] } }>(`/bookings/${id}`),
    getByPnr: (pnr: string) => request<{ booking: Booking & { bus?: Bus; passengers: Passenger[] } }>(`/bookings/pnr/${pnr}`),
    cancel: (id: string) => request<{ message: string; booking: Booking }>(`/bookings/${id}/cancel`, { method: 'POST' })
  },

  user: {
    getBookings: () =>
      request<{
        all: Array<Booking & { bus?: Bus; passengers: Passenger[]; isUpcoming: boolean }>;
        upcoming: Array<Booking & { bus?: Bus; passengers: Passenger[]; isUpcoming: boolean }>;
        previous: Array<Booking & { bus?: Bus; passengers: Passenger[]; isUpcoming: boolean }>;
        count: number;
      }>('/user/bookings')
  },

  admin: {
    getDashboard: () =>
      request<{
        stats: {
          totalBookings: number;
          confirmedBookings: number;
          totalRevenue: number;
          activeBuses: number;
          registeredUsers: number;
          currentFareRate: number;
        };
        dailyAnalytics: Array<{ date: string; fullDate: string; bookings: number; revenue: number }>;
        popularRoutes: Array<{ route: string; count: number }>;
        recentBookings: any[];
        buses: Bus[];
        routes: any[];
      }>('/admin/dashboard'),
    updateFare: (fare_per_km: number) =>
      request<{ message: string; fare_per_km: number }>('/admin/settings/fare', {
        method: 'PUT',
        body: JSON.stringify({ fare_per_km })
      }),
    addBus: (busData: any) =>
      request<{ message: string; bus: Bus }>('/admin/buses', {
        method: 'POST',
        body: JSON.stringify(busData)
      }),
    editBus: (id: string, busData: any) =>
      request<{ message: string; bus: Bus }>(`/admin/buses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(busData)
      }),
    deleteBus: (id: string) =>
      request<{ message: string }>(`/admin/buses/${id}`, {
        method: 'DELETE'
      }),
    addLocation: (locData: any) =>
      request<{ message: string; location: Location }>('/admin/locations', {
        method: 'POST',
        body: JSON.stringify(locData)
      }),
    addRoute: (routeData: any) =>
      request<{ message: string; route: any; stops: any[] }>('/admin/routes', {
        method: 'POST',
        body: JSON.stringify(routeData)
      })
  },

  tracking: {
    getAll: () => request<{ buses: any[]; timestamp: string }>('/tracking/all'),
    getBus: (busId: string) => request<any>(`/tracking/${busId}`),
    updateBus: (busId: string, data: any) =>
      request<any>(`/tracking/${busId}/update`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
  },

  ai: {
    getAdvice: (query: string, source?: string, destination?: string) =>
      request<{ reply: string }>('/ai/assistant', {
        method: 'POST',
        body: JSON.stringify({ query, source, destination })
      })
  }
};
