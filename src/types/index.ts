export interface Location {
  id: string;
  name: string;
  type: 'village' | 'town' | 'city' | 'hub';
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  aliases?: string[];
}

export interface LocationAlias {
  id: string;
  location_id: string;
  alias_name: string;
  language: 'kn' | 'en' | 'hi' | 'mixed';
}

export interface Depot {
  id: string;
  name: string;
  code: string;
  location: string;
  district: string;
  state: string;
}

export interface DepotManager {
  id: string;
  user_id: string;
  depot_id: string;
}

export type OperationalStatus = 'Active' | 'Inactive' | 'Under Maintenance' | 'Maintenance' | 'Breakdown' | 'Standby';
export type LiveBusStatus = 'Running' | 'Delayed' | 'Not Started' | 'Cancelled' | 'Completed' | 'On Route' | 'Boarding' | 'Depot Ready' | string;

export interface Bus {
  id: string;
  bus_name: string;
  bus_number: string;
  bus_type: 'Karnataka Sarige' | 'Rajahamsa Executive' | 'Airavat Club Class' | 'EV Power Plus' | 'Gramina Sarige' | 'Non-AC Sleeper' | string;
  depot_id?: string;
  driver_id?: string;
  driver_name?: string;
  driver_contact?: string;
  total_seats: number;
  operational_status?: OperationalStatus;
  amenities?: string[];
  live_lat?: number;
  live_lng?: number;
  live_speed?: number;
  live_status?: LiveBusStatus;
  live_next_stop?: string;
  status_updated_at?: string;
}

export interface Route {
  id: string;
  bus_id: string;
  route_name: string;
  depot_id?: string;
}

export interface Trip {
  id: string;
  bus_id: string;
  route_id: string;
  travel_date: string;
  driver_id?: string;
  status: 'Not Started' | 'Running' | 'Delayed' | 'Completed' | 'Cancelled';
  start_time?: string;
  end_time?: string;
  current_stop_order?: number;
  updated_at?: string;
}

export interface BusTracking {
  id: string;
  bus_id: string;
  trip_id?: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: string;
  status?: string;
  next_stop?: string;
}

export interface RouteStop {
  id: string;
  route_id: string;
  location_id: string;
  stop_order: number;
  arrival_time: string;
  departure_time: string;
  distance_from_start: number;
}

export interface Seat {
  id: string;
  bus_id: string;
  seat_number: string;
  seat_type: 'window' | 'aisle' | 'sleeper_lower' | 'sleeper_upper' | 'regular';
}

export interface Booking {
  id: string;
  user_id: string;
  bus_id: string;
  source_location: string;
  destination_location: string;
  travel_date: string;
  distance: number;
  fare_per_km: number;
  total_amount: number;
  pnr_number: string;
  booking_status: 'CONFIRMED' | 'CANCELLED';
  payment_method?: string;
  payment_status?: string;
  created_at: string;
}

export interface Passenger {
  id: string;
  booking_id: string;
  name: string;
  age: number;
  gender: string;
  seat_number: string;
}

export interface AdminSettings {
  id: string;
  fare_per_km: number;
}

export type UserRole =
  | 'user'
  | 'depot_manager'
  | 'driver'
  | 'admin'
  | 'DEPOT_MANAGER'
  | 'DRIVER'
  | 'ADMIN'
  | 'USER';

export function isDepotManagerRole(role?: string): boolean {
  if (!role) return false;
  return role.toLowerCase() === 'depot_manager';
}

export function isDriverRole(role?: string): boolean {
  if (!role) return false;
  return role.toLowerCase() === 'driver';
}

export function isAdminRole(role?: string): boolean {
  if (!role) return false;
  return role.toLowerCase() === 'admin';
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  role: UserRole;
  depot_id?: string;
  assigned_bus_id?: string;
  status?: 'active' | 'suspended';
  created_at: string;
}

export interface DatabaseData {
  users: User[];
  locations: Location[];
  locationAliases?: LocationAlias[];
  depots?: Depot[];
  depotManagers?: DepotManager[];
  buses: Bus[];
  routes: Route[];
  routeStops: RouteStop[];
  trips?: Trip[];
  busTracking?: BusTracking[];
  seats: Seat[];
  bookings: Booking[];
  passengers: Passenger[];
  adminSettings: AdminSettings;
}

export interface BusSearchResult {
  bus: Bus;
  route: Route;
  sourceStop: RouteStop;
  destinationStop: RouteStop;
  sourceLocationName: string;
  destinationLocationName: string;
  departureTime: string;
  arrivalTime: string;
  estimatedDuration: string;
  distanceKm: number;
  fareRatePerKm: number;
  ticketPricePerSeat: number;
  availableSeatsCount: number;
  bookedSeats: string[];
  stopsList: Array<{
    locationName: string;
    arrivalTime: string;
    departureTime: string;
    stopOrder: number;
    distanceKm: number;
    type: string;
  }>;
}

export interface ConnectingRouteOption {
  hubLocation: Location;
  leg1: BusSearchResult;
  leg2: BusSearchResult;
  totalDistance: number;
  totalFare: number;
  layoverDuration: string;
}

export interface PassengerInput {
  name: string;
  age: number | string;
  gender: 'Male' | 'Female' | 'Other';
  seat_number: string;
  phone?: string;
}

export interface DistanceCalculationResult {
  source: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
  roadDistanceKm: number;
  straightDistanceKm: number;
  routeGeometry?: [number, number][];
  defaultRatePerKm: number;
  estimatedFare: number;
}
