import {
  DatabaseData,
  Location,
  Bus,
  Route,
  RouteStop,
  Booking,
  Passenger,
  Seat,
  AdminSettings,
  User,
  LocationAlias,
  Depot,
  DepotManager,
  Trip,
  BusTracking
} from '../src/types/index.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_FILE = path.join(process.cwd(), 'data', 'database.json');

// Depots
const initialDepots: Depot[] = [
  {
    id: 'depot-mysuru',
    name: 'Mysuru Suburban Bus Depot',
    code: 'MYS-01',
    location: 'Mysuru Suburban Bus Stand, B.N. Road',
    district: 'Mysuru',
    state: 'Karnataka'
  },
  {
    id: 'depot-bengaluru',
    name: 'Bengaluru Central Majestic Depot',
    code: 'BLR-01',
    location: 'Kempegowda Bus Station, Majestic',
    district: 'Bengaluru Urban',
    state: 'Karnataka'
  },
  {
    id: 'depot-hassan',
    name: 'Hassan Central Bus Depot',
    code: 'HSN-01',
    location: 'B.M. Road, Hassan CBS',
    district: 'Hassan',
    state: 'Karnataka'
  },
  {
    id: 'depot-mangaluru',
    name: 'Mangaluru Bejai Bus Depot',
    code: 'MLR-01',
    location: 'Bejai Bus Stand, Mangaluru',
    district: 'Dakshina Kannada',
    state: 'Karnataka'
  }
];

const initialDepotManagers: DepotManager[] = [
  { id: 'dm-1', user_id: 'user-manager-mysuru', depot_id: 'depot-mysuru' },
  { id: 'dm-2', user_id: 'user-manager-bengaluru', depot_id: 'depot-bengaluru' }
];

// Multilingual Location Aliases
const initialLocationAliases: LocationAlias[] = [
  // Mysuru
  { id: 'alias-1', location_id: 'loc-9', alias_name: 'Mysore', language: 'en' },
  { id: 'alias-2', location_id: 'loc-9', alias_name: 'ಮೈಸೂರು', language: 'kn' },
  { id: 'alias-3', location_id: 'loc-9', alias_name: 'मैसूर', language: 'hi' },
  { id: 'alias-4', location_id: 'loc-9', alias_name: 'Mysuru CBS', language: 'en' },
  { id: 'alias-5', location_id: 'loc-9', alias_name: 'Palace City', language: 'en' },
  { id: 'alias-6', location_id: 'loc-9', alias_name: 'ಮೈಸೂರಿಗೆ', language: 'kn' },
  { id: 'alias-7', location_id: 'loc-9', alias_name: 'ಮೈಸೂರಿನಿಂದ', language: 'kn' },

  // Bengaluru (Majestic)
  { id: 'alias-8', location_id: 'loc-1', alias_name: 'Bangalore', language: 'en' },
  { id: 'alias-9', location_id: 'loc-1', alias_name: 'ಬೆಂಗಳೂರು', language: 'kn' },
  { id: 'alias-10', location_id: 'loc-1', alias_name: 'Kempegowda BS', language: 'en' },
  { id: 'alias-11', location_id: 'loc-1', alias_name: 'Majestic', language: 'en' },
  { id: 'alias-12', location_id: 'loc-1', alias_name: 'ಬೆಂಗಳೂರಿಗೆ', language: 'kn' },
  { id: 'alias-13', location_id: 'loc-1', alias_name: 'ಬೆಂಗಳೂರಿನಿಂದ', language: 'kn' },

  // Hunsur
  { id: 'alias-14', location_id: 'loc-12', alias_name: 'Hoonsoor', language: 'en' },
  { id: 'alias-15', location_id: 'loc-12', alias_name: 'Hunasuru', language: 'en' },
  { id: 'alias-16', location_id: 'loc-12', alias_name: 'ಹುನ್ಸೂರು', language: 'kn' },
  { id: 'alias-17', location_id: 'loc-12', alias_name: 'ಹುಣಸೂರು', language: 'kn' },
  { id: 'alias-18', location_id: 'loc-12', alias_name: 'ಹುನ್ಸೂರಿನಿಂದ', language: 'kn' },
  { id: 'alias-19', location_id: 'loc-12', alias_name: 'ಹುನ್ಸೂರಿಗೆ', language: 'kn' },
  { id: 'alias-20', location_id: 'loc-12', alias_name: 'Hunsur Handpost', language: 'en' },

  // Mandya
  { id: 'alias-21', location_id: 'loc-7', alias_name: 'ಮಂಡ್ಯ', language: 'kn' },
  { id: 'alias-22', location_id: 'loc-7', alias_name: 'Mandye', language: 'en' },
  { id: 'alias-23', location_id: 'loc-7', alias_name: 'Sugar City', language: 'en' },
  { id: 'alias-24', location_id: 'loc-7', alias_name: 'ಮಂಡ್ಯಕ್ಕೆ', language: 'kn' },
  { id: 'alias-25', location_id: 'loc-7', alias_name: 'ಮಂಡ್ಯದಿಂದ', language: 'kn' },

  // Srirangapatna
  { id: 'alias-26', location_id: 'loc-8', alias_name: 'ಶ್ರೀರಂಗಪಟ್ಟಣ', language: 'kn' },
  { id: 'alias-27', location_id: 'loc-8', alias_name: 'Srirangapatnam', language: 'en' },

  // Maddur
  { id: 'alias-28', location_id: 'loc-6', alias_name: 'ಮದ್ದೂರು', language: 'kn' },
  { id: 'alias-29', location_id: 'loc-6', alias_name: 'Madduru', language: 'en' },

  // Ramanagara
  { id: 'alias-30', location_id: 'loc-4', alias_name: 'ರಾಮನಗರ', language: 'kn' },
  { id: 'alias-31', location_id: 'loc-4', alias_name: 'Ramnagaram', language: 'en' },
  { id: 'alias-32', location_id: 'loc-4', alias_name: 'Ramnagar', language: 'en' },
  { id: 'alias-33', location_id: 'loc-4', alias_name: 'Silk City', language: 'en' },

  // Channapatna
  { id: 'alias-34', location_id: 'loc-5', alias_name: 'ಚನ್ನಪಟ್ಟಣ', language: 'kn' },
  { id: 'alias-35', location_id: 'loc-5', alias_name: 'Toy Town', language: 'en' },

  // Bilikere
  { id: 'alias-36', location_id: 'loc-11', alias_name: 'ಬಿಳಿಕೆರೆ', language: 'kn' },
  { id: 'alias-37', location_id: 'loc-11', alias_name: 'Bilekere', language: 'en' },
  { id: 'alias-38', location_id: 'loc-11', alias_name: 'Bilikere Handpost', language: 'en' },

  // Yelwala
  { id: 'alias-39', location_id: 'loc-10', alias_name: 'ಯಲವಾಲ', language: 'kn' },
  { id: 'alias-40', location_id: 'loc-10', alias_name: 'Ilavala', language: 'en' },

  // Periyapatna
  { id: 'alias-41', location_id: 'loc-13', alias_name: 'ಪಿರಿಯಾಪಟ್ಟಣ', language: 'kn' },
  { id: 'alias-42', location_id: 'loc-13', alias_name: 'Piriyapatna', language: 'en' },

  // Kushalnagar
  { id: 'alias-43', location_id: 'loc-14', alias_name: 'ಕುಶಾಲನಗರ', language: 'kn' },
  { id: 'alias-44', location_id: 'loc-14', alias_name: 'Bylakuppe', language: 'en' },

  // Madikeri
  { id: 'alias-45', location_id: 'loc-15', alias_name: 'ಮಡಿಕೇರಿ', language: 'kn' },
  { id: 'alias-46', location_id: 'loc-15', alias_name: 'Mercara', language: 'en' },
  { id: 'alias-47', location_id: 'loc-15', alias_name: 'Coorg', language: 'en' },

  // Tumakuru
  { id: 'alias-48', location_id: 'loc-16', alias_name: 'ತುಮಕೂರು', language: 'kn' },
  { id: 'alias-49', location_id: 'loc-16', alias_name: 'Tumkur', language: 'en' },

  // Shivamogga
  { id: 'alias-50', location_id: 'loc-17', alias_name: 'ಶಿವಮೊಗ್ಗ', language: 'kn' },
  { id: 'alias-51', location_id: 'loc-17', alias_name: 'Shimoga', language: 'en' },

  // Hassan
  { id: 'alias-52', location_id: 'loc-18', alias_name: 'ಹಾಸನ', language: 'kn' },
  { id: 'alias-53', location_id: 'loc-18', alias_name: 'Hassan CBS', language: 'en' },

  // Mangaluru
  { id: 'alias-54', location_id: 'loc-20', alias_name: 'ಮಂಗಳೂರು', language: 'kn' },
  { id: 'alias-55', location_id: 'loc-20', alias_name: 'Mangalore', language: 'en' },

  // Udupi
  { id: 'alias-56', location_id: 'loc-21', alias_name: 'ಉಡುಪಿ', language: 'kn' },
  { id: 'alias-57', location_id: 'loc-21', alias_name: 'Udipi', language: 'en' },

  // Hubballi
  { id: 'alias-58', location_id: 'loc-22', alias_name: 'ಹುಬ್ಬಳ್ಳಿ', language: 'kn' },
  { id: 'alias-59', location_id: 'loc-22', alias_name: 'Hubli', language: 'en' },

  // Belagavi
  { id: 'alias-60', location_id: 'loc-23', alias_name: 'ಬೆಳಗಾವಿ', language: 'kn' },
  { id: 'alias-61', location_id: 'loc-23', alias_name: 'Belgaum', language: 'en' },

  // Nanjangud
  { id: 'alias-62', location_id: 'loc-24', alias_name: 'ನಂಜನಗೂಡು', language: 'kn' },
  { id: 'alias-63', location_id: 'loc-24', alias_name: 'Temple Town', language: 'en' },

  // Gundlupet
  { id: 'alias-64', location_id: 'loc-25', alias_name: 'ಗುಂಡ್ಲುಪೇಟೆ', language: 'kn' },

  // KR Nagara
  { id: 'alias-65', location_id: 'loc-26', alias_name: 'ಕೆ ಆರ್ ನಗರ', language: 'kn' },
  { id: 'alias-66', location_id: 'loc-26', alias_name: 'ಕೆ.ಆರ್.ನಗರ', language: 'kn' },
  { id: 'alias-67', location_id: 'loc-26', alias_name: 'Krishnarajanagara', language: 'en' }
];

// Initial seed data with Karnataka villages, towns, and cities
const initialLocations: Location[] = [
  { id: 'loc-1', name: 'Bengaluru (Majestic)', type: 'city', district: 'Bengaluru Urban', state: 'Karnataka', latitude: 12.9774, longitude: 77.5708, aliases: ['Bangalore', 'Majestic', 'Kempegowda BS'] },
  { id: 'loc-2', name: 'Bengaluru (Satellite BS)', type: 'hub', district: 'Bengaluru Urban', state: 'Karnataka', latitude: 12.9554, longitude: 77.5385, aliases: ['Satellite', 'Kengeri'] },
  { id: 'loc-3', name: 'Bidadi', type: 'town', district: 'Ramanagara', state: 'Karnataka', latitude: 12.7972, longitude: 77.3828, aliases: ['Bidadi Ind Area'] },
  { id: 'loc-4', name: 'Ramanagara', type: 'town', district: 'Ramanagara', state: 'Karnataka', latitude: 12.7209, longitude: 77.2799, aliases: ['Ramnagaram', 'Silk City'] },
  { id: 'loc-5', name: 'Channapatna', type: 'town', district: 'Ramanagara', state: 'Karnataka', latitude: 12.6518, longitude: 77.2089, aliases: ['Toy Town', 'Channapatnam'] },
  { id: 'loc-6', name: 'Maddur', type: 'town', district: 'Mandya', state: 'Karnataka', latitude: 12.5844, longitude: 77.0453, aliases: ['Madduru', 'Tiffanys'] },
  { id: 'loc-7', name: 'Mandya', type: 'city', district: 'Mandya', state: 'Karnataka', latitude: 12.5242, longitude: 76.8958, aliases: ['Sugar City'] },
  { id: 'loc-8', name: 'Srirangapatna', type: 'town', district: 'Mandya', state: 'Karnataka', latitude: 12.4238, longitude: 76.6830, aliases: ['Srirangapatnam'] },
  { id: 'loc-9', name: 'Mysuru (Suburban BS)', type: 'city', district: 'Mysuru', state: 'Karnataka', latitude: 12.3118, longitude: 76.6529, aliases: ['Mysore', 'Mysuru CBS', 'Palace City'] },
  { id: 'loc-10', name: 'Yelwala', type: 'village', district: 'Mysuru', state: 'Karnataka', latitude: 12.3619, longitude: 76.5401, aliases: ['Yelwal', 'Ilavala'] },
  { id: 'loc-11', name: 'Bilikere', type: 'village', district: 'Mysuru', state: 'Karnataka', latitude: 12.3385, longitude: 76.4172, aliases: ['Bilekere', 'Bilikere Handpost'] },
  { id: 'loc-12', name: 'Hunsur', type: 'town', district: 'Mysuru', state: 'Karnataka', latitude: 12.3087, longitude: 76.2917, aliases: ['Hoonsoor', 'Hunasuru', 'Hunsur Bus Stand'] },
  { id: 'loc-13', name: 'Periyapatna', type: 'town', district: 'Mysuru', state: 'Karnataka', latitude: 12.3414, longitude: 76.0967, aliases: ['Piriyapatna', 'Piriyapattana'] },
  { id: 'loc-14', name: 'Kushalnagar', type: 'town', district: 'Kodagu', state: 'Karnataka', latitude: 12.4566, longitude: 75.9610, aliases: ['Kushalanagara', 'Bylakuppe'] },
  { id: 'loc-15', name: 'Madikeri', type: 'city', district: 'Kodagu', state: 'Karnataka', latitude: 12.4244, longitude: 75.7382, aliases: ['Mercara', 'Coorg Capital'] },
  { id: 'loc-16', name: 'Tumakuru', type: 'city', district: 'Tumakuru', state: 'Karnataka', latitude: 13.3379, longitude: 77.1010, aliases: ['Tumkur'] },
  { id: 'loc-17', name: 'Shivamogga', type: 'city', district: 'Shivamogga', state: 'Karnataka', latitude: 13.9299, longitude: 75.5681, aliases: ['Shimoga'] },
  { id: 'loc-18', name: 'Hassan', type: 'city', district: 'Hassan', state: 'Karnataka', latitude: 13.0033, longitude: 76.1004, aliases: ['Hassan CBS'] },
  { id: 'loc-19', name: 'Channarayapatna', type: 'town', district: 'Hassan', state: 'Karnataka', latitude: 12.9038, longitude: 76.3887, aliases: ['CR Patna'] },
  { id: 'loc-20', name: 'Mangaluru', type: 'city', district: 'Dakshina Kannada', state: 'Karnataka', latitude: 12.9141, longitude: 74.8560, aliases: ['Mangalore', 'KSRTC Bejai'] },
  { id: 'loc-21', name: 'Udupi', type: 'city', district: 'Udupi', state: 'Karnataka', latitude: 13.3409, longitude: 74.7421, aliases: ['Udipi'] },
  { id: 'loc-22', name: 'Hubballi', type: 'city', district: 'Dharwad', state: 'Karnataka', latitude: 15.3647, longitude: 75.1240, aliases: ['Hubli', 'Old Bus Stand'] },
  { id: 'loc-23', name: 'Belagavi', type: 'city', district: 'Belagavi', state: 'Karnataka', latitude: 15.8497, longitude: 74.4977, aliases: ['Belgaum'] },
  { id: 'loc-24', name: 'Nanjangud', type: 'town', district: 'Mysuru', state: 'Karnataka', latitude: 12.1203, longitude: 76.6826, aliases: ['Temple Town', 'Nanjangudu'] },
  { id: 'loc-25', name: 'Gundlupet', type: 'town', district: 'Chamarajanagar', state: 'Karnataka', latitude: 11.8058, longitude: 76.6896, aliases: ['Gundlupete', 'Bandipur Gateway'] },
  { id: 'loc-26', name: 'KR Nagara', type: 'town', district: 'Mysuru', state: 'Karnataka', latitude: 12.5828, longitude: 76.3813, aliases: ['Krishnarajanagara', 'KR Nagar'] }
];

const initialBuses: Bus[] = [
  {
    id: 'bus-1',
    bus_name: 'KSRTC Karnataka Sarige Demo',
    bus_number: 'KA-09-F-1234',
    bus_type: 'Karnataka Sarige',
    total_seats: 32,
    amenities: ['Cushion Seats', 'Emergency Exit', 'Luggage Carrier', 'Audio System'],
    live_lat: 12.3118,
    live_lng: 76.6529,
    live_speed: 48,
    live_status: 'On Route',
    live_next_stop: 'Hunsur'
  },
  {
    id: 'bus-2',
    bus_name: 'KSRTC Rajahamsa Executive',
    bus_number: 'KA-01-F-4589',
    bus_type: 'Rajahamsa Executive',
    total_seats: 36,
    amenities: ['Pushback Seats', 'Reading Lights', 'Mobile Charging Ports', 'Air Suspension'],
    live_lat: 12.5242,
    live_lng: 76.8958,
    live_speed: 62,
    live_status: 'On Route',
    live_next_stop: 'Mysuru (Suburban BS)'
  },
  {
    id: 'bus-3',
    bus_name: 'KSRTC Airavat Club Class Multi-Axle',
    bus_number: 'KA-57-F-9900',
    bus_type: 'Airavat Club Class',
    total_seats: 40,
    amenities: ['Volvo AC', 'Semi-Sleeper Leather Seats', 'Wi-Fi', 'Water Bottle', 'Blanket', 'Live GPS'],
    live_lat: 12.7209,
    live_lng: 77.2799,
    live_speed: 75,
    live_status: 'On Route',
    live_next_stop: 'Maddur'
  },
  {
    id: 'bus-4',
    bus_name: 'KSRTC EV Power Plus (Electric AC)',
    bus_number: 'KA-04-EV-2026',
    bus_type: 'EV Power Plus',
    total_seats: 36,
    amenities: ['100% Electric Eco-Ride', 'Silent Air Conditioning', 'USB Type-C at every seat', 'CCTV'],
    live_lat: 12.9774,
    live_lng: 77.5708,
    live_speed: 0,
    live_status: 'Boarding',
    live_next_stop: 'Bidadi'
  },
  {
    id: 'bus-5',
    bus_name: 'Gramina Sarige Rural Express',
    bus_number: 'KA-09-G-3312',
    bus_type: 'Gramina Sarige',
    total_seats: 28,
    amenities: ['Village Stop Facility', 'Spacious Legroom', 'Sturdy Mountain Suspension'],
    live_lat: 12.3385,
    live_lng: 76.4172,
    live_speed: 38,
    live_status: 'On Route',
    live_next_stop: 'Bilikere'
  },
  {
    id: 'bus-6',
    bus_name: 'KSRTC Non-AC Sleeper Coach',
    bus_number: 'KA-14-F-8811',
    bus_type: 'Non-AC Sleeper',
    total_seats: 30,
    amenities: ['Berth Beds', 'Curtains', 'Luggage Space', 'Night Lamps'],
    live_lat: 13.9299,
    live_lng: 75.5681,
    live_speed: 55,
    live_status: 'On Route',
    live_next_stop: 'Tumakuru'
  }
];

const initialRoutes: Route[] = [
  { id: 'route-1', bus_id: 'bus-1', route_name: 'Bengaluru ⇄ Madikeri via Mysuru & Hunsur' },
  { id: 'route-2', bus_id: 'bus-2', route_name: 'Bengaluru ⇄ Mysuru Express Highway' },
  { id: 'route-3', bus_id: 'bus-3', route_name: 'Bengaluru ⇄ Kushalnagar Club Class' },
  { id: 'route-4', bus_id: 'bus-4', route_name: 'Bengaluru ⇄ Mysuru EV Superfast' },
  { id: 'route-5', bus_id: 'bus-5', route_name: 'Mysuru ⇄ KR Nagara Rural Village Feeder' },
  { id: 'route-6', bus_id: 'bus-6', route_name: 'Shivamogga ⇄ Bengaluru via Tumakuru' }
];

// Define Route Stops with cumulative distances and times
const initialRouteStops: RouteStop[] = [
  // Route 1: Bengaluru -> Bidadi -> Ramanagara -> Channapatna -> Maddur -> Mandya -> Srirangapatna -> Mysuru -> Yelwala -> Bilikere -> Hunsur -> Periyapatna -> Kushalnagar -> Madikeri
  { id: 'rs-1-1', route_id: 'route-1', location_id: 'loc-1', stop_order: 1, arrival_time: '06:00 AM', departure_time: '06:15 AM', distance_from_start: 0 },
  { id: 'rs-1-2', route_id: 'route-1', location_id: 'loc-3', stop_order: 2, arrival_time: '06:55 AM', departure_time: '07:00 AM', distance_from_start: 32 },
  { id: 'rs-1-3', route_id: 'route-1', location_id: 'loc-4', stop_order: 3, arrival_time: '07:15 AM', departure_time: '07:20 AM', distance_from_start: 48 },
  { id: 'rs-1-4', route_id: 'route-1', location_id: 'loc-5', stop_order: 4, arrival_time: '07:35 AM', departure_time: '07:40 AM', distance_from_start: 60 },
  { id: 'rs-1-5', route_id: 'route-1', location_id: 'loc-6', stop_order: 5, arrival_time: '07:55 AM', departure_time: '08:00 AM', distance_from_start: 78 },
  { id: 'rs-1-6', route_id: 'route-1', location_id: 'loc-7', stop_order: 6, arrival_time: '08:25 AM', departure_time: '08:35 AM', distance_from_start: 98 },
  { id: 'rs-1-7', route_id: 'route-1', location_id: 'loc-8', stop_order: 7, arrival_time: '09:05 AM', departure_time: '09:10 AM', distance_from_start: 124 },
  { id: 'rs-1-8', route_id: 'route-1', location_id: 'loc-9', stop_order: 8, arrival_time: '09:30 AM', departure_time: '09:45 AM', distance_from_start: 142 },
  { id: 'rs-1-9', route_id: 'route-1', location_id: 'loc-10', stop_order: 9, arrival_time: '10:05 AM', departure_time: '10:08 AM', distance_from_start: 156 },
  { id: 'rs-1-10', route_id: 'route-1', location_id: 'loc-11', stop_order: 10, arrival_time: '10:20 AM', departure_time: '10:25 AM', distance_from_start: 168 },
  { id: 'rs-1-11', route_id: 'route-1', location_id: 'loc-12', stop_order: 11, arrival_time: '10:45 AM', departure_time: '10:55 AM', distance_from_start: 184 },
  { id: 'rs-1-12', route_id: 'route-1', location_id: 'loc-13', stop_order: 12, arrival_time: '11:25 AM', departure_time: '11:30 AM', distance_from_start: 210 },
  { id: 'rs-1-13', route_id: 'route-1', location_id: 'loc-14', stop_order: 13, arrival_time: '11:55 AM', departure_time: '12:00 PM', distance_from_start: 236 },
  { id: 'rs-1-14', route_id: 'route-1', location_id: 'loc-15', stop_order: 14, arrival_time: '12:45 PM', departure_time: '01:00 PM', distance_from_start: 268 },

  // Route 2: Bengaluru -> Mandya -> Mysuru (Fast)
  { id: 'rs-2-1', route_id: 'route-2', location_id: 'loc-1', stop_order: 1, arrival_time: '08:00 AM', departure_time: '08:15 AM', distance_from_start: 0 },
  { id: 'rs-2-2', route_id: 'route-2', location_id: 'loc-7', stop_order: 2, arrival_time: '09:45 AM', departure_time: '09:50 AM', distance_from_start: 98 },
  { id: 'rs-2-3', route_id: 'route-2', location_id: 'loc-9', stop_order: 3, arrival_time: '10:45 AM', departure_time: '11:00 AM', distance_from_start: 142 },

  // Route 3: Bengaluru -> Mysuru -> Hunsur -> Kushalnagar
  { id: 'rs-3-1', route_id: 'route-3', location_id: 'loc-1', stop_order: 1, arrival_time: '07:00 AM', departure_time: '07:15 AM', distance_from_start: 0 },
  { id: 'rs-3-2', route_id: 'route-3', location_id: 'loc-9', stop_order: 2, arrival_time: '09:45 AM', departure_time: '10:00 AM', distance_from_start: 142 },
  { id: 'rs-3-3', route_id: 'route-3', location_id: 'loc-12', stop_order: 3, arrival_time: '10:50 AM', departure_time: '10:55 AM', distance_from_start: 184 },
  { id: 'rs-3-4', route_id: 'route-3', location_id: 'loc-14', stop_order: 4, arrival_time: '11:45 AM', departure_time: '11:50 AM', distance_from_start: 236 },

  // Route 4: Bengaluru -> Ramanagara -> Mandya -> Mysuru (Electric)
  { id: 'rs-4-1', route_id: 'route-4', location_id: 'loc-1', stop_order: 1, arrival_time: '09:30 AM', departure_time: '09:45 AM', distance_from_start: 0 },
  { id: 'rs-4-2', route_id: 'route-4', location_id: 'loc-4', stop_order: 2, arrival_time: '10:30 AM', departure_time: '10:35 AM', distance_from_start: 48 },
  { id: 'rs-4-3', route_id: 'route-4', location_id: 'loc-7', stop_order: 3, arrival_time: '11:20 AM', departure_time: '11:25 AM', distance_from_start: 98 },
  { id: 'rs-4-4', route_id: 'route-4', location_id: 'loc-9', stop_order: 4, arrival_time: '12:15 PM', departure_time: '12:30 PM', distance_from_start: 142 },

  // Route 5: Mysuru -> Yelwala -> Bilikere -> Hunsur -> KR Nagara
  { id: 'rs-5-1', route_id: 'route-5', location_id: 'loc-9', stop_order: 1, arrival_time: '07:30 AM', departure_time: '07:45 AM', distance_from_start: 0 },
  { id: 'rs-5-2', route_id: 'route-5', location_id: 'loc-10', stop_order: 2, arrival_time: '08:05 AM', departure_time: '08:10 AM', distance_from_start: 14 },
  { id: 'rs-5-3', route_id: 'route-5', location_id: 'loc-11', stop_order: 3, arrival_time: '08:25 AM', departure_time: '08:30 AM', distance_from_start: 26 },
  { id: 'rs-5-4', route_id: 'route-5', location_id: 'loc-12', stop_order: 4, arrival_time: '08:50 AM', departure_time: '09:00 AM', distance_from_start: 42 },
  { id: 'rs-5-5', route_id: 'route-5', location_id: 'loc-26', stop_order: 5, arrival_time: '09:35 AM', departure_time: '09:45 AM', distance_from_start: 65 },

  // Route 6: Shivamogga -> Tumakuru -> Bengaluru
  { id: 'rs-6-1', route_id: 'route-6', location_id: 'loc-17', stop_order: 1, arrival_time: '05:30 AM', departure_time: '05:45 AM', distance_from_start: 0 },
  { id: 'rs-6-2', route_id: 'route-6', location_id: 'loc-16', stop_order: 2, arrival_time: '09:15 AM', departure_time: '09:25 AM', distance_from_start: 205 },
  { id: 'rs-6-3', route_id: 'route-6', location_id: 'loc-1', stop_order: 3, arrival_time: '11:00 AM', departure_time: '11:15 AM', distance_from_start: 275 }
];

const initialTrips: Trip[] = [
  {
    id: 'trip-1',
    bus_id: 'bus-1',
    route_id: 'route-1',
    travel_date: new Date().toISOString().split('T')[0],
    driver_id: 'user-driver-1',
    status: 'Running',
    start_time: '06:00 AM',
    current_stop_order: 10,
    updated_at: new Date().toISOString()
  },
  {
    id: 'trip-2',
    bus_id: 'bus-2',
    route_id: 'route-2',
    travel_date: new Date().toISOString().split('T')[0],
    driver_id: 'user-driver-1',
    status: 'Running',
    start_time: '08:00 AM',
    current_stop_order: 2,
    updated_at: new Date().toISOString()
  },
  {
    id: 'trip-3',
    bus_id: 'bus-3',
    route_id: 'route-3',
    travel_date: new Date().toISOString().split('T')[0],
    driver_id: 'user-driver-1',
    status: 'Running',
    start_time: '07:00 AM',
    current_stop_order: 2,
    updated_at: new Date().toISOString()
  }
];

const initialBusTracking: BusTracking[] = [
  {
    id: 'track-1',
    bus_id: 'bus-1',
    trip_id: 'trip-1',
    latitude: 12.3385,
    longitude: 76.4172,
    speed: 48,
    heading: 265,
    timestamp: new Date().toISOString(),
    status: 'Approaching Bilikere Handpost',
    next_stop: 'Hunsur'
  },
  {
    id: 'track-2',
    bus_id: 'bus-2',
    trip_id: 'trip-2',
    latitude: 12.5242,
    longitude: 76.8958,
    speed: 62,
    heading: 215,
    timestamp: new Date().toISOString(),
    status: 'Departed Mandya Sugar City',
    next_stop: 'Srirangapatna'
  }
];

// Helper to generate standard seats for buses
function generateSeatsForBuses(buses: Bus[]): Seat[] {
  const seats: Seat[] = [];
  for (const bus of buses) {
    for (let i = 1; i <= bus.total_seats; i++) {
      let seat_type: 'window' | 'aisle' | 'sleeper_lower' | 'sleeper_upper' | 'regular' = 'regular';
      if (bus.bus_type === 'Non-AC Sleeper') {
        seat_type = i % 2 === 1 ? 'sleeper_lower' : 'sleeper_upper';
      } else {
        const col = i % 4;
        if (col === 1 || col === 0) seat_type = 'window';
        else seat_type = 'aisle';
      }
      seats.push({
        id: `seat-${bus.id}-${i}`,
        bus_id: bus.id,
        seat_number: `${String.fromCharCode(65 + Math.floor((i - 1) / 4))}${(i - 1) % 4 + 1}`,
        seat_type
      });
    }
  }
  return seats;
}

const initialSettings: AdminSettings = {
  id: 'settings-default',
  fare_per_km: 1.50
};

// Default seed users with hashed passwords
const defaultPasswordHash = bcrypt.hashSync('password123', 10);
const adminPasswordHash = bcrypt.hashSync('admin123', 10);
const managerPasswordHash = bcrypt.hashSync('manager123', 10);
const driverPasswordHash = bcrypt.hashSync('driver123', 10);

const initialUsers: User[] = [
  {
    id: 'user-demo-1',
    name: 'Ramesh Gowda',
    email: 'user@smartbus.ai',
    password: defaultPasswordHash,
    phone: '+91 98450 12345',
    role: 'user',
    created_at: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'user-admin-1',
    name: 'KSRTC Chief Controller (Admin)',
    email: 'admin@smartbus.ai',
    password: adminPasswordHash,
    phone: '+91 94480 99999',
    role: 'admin',
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'user-manager-mysuru',
    name: 'S. Kumar (Mysuru Depot Manager)',
    email: 'manager.mysuru@smartbus.ai',
    password: managerPasswordHash,
    phone: '+91 98450 88776',
    role: 'depot_manager',
    depot_id: 'depot-mysuru',
    created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'user-manager-bengaluru',
    name: 'V. Shivaram (Bengaluru Depot Manager)',
    email: 'manager.bengaluru@smartbus.ai',
    password: managerPasswordHash,
    phone: '+91 98450 44332',
    role: 'depot_manager',
    depot_id: 'depot-bengaluru',
    created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'user-driver-1',
    name: 'R. Veerendra (Chief Pilot #9284)',
    email: 'driver@smartbus.ai',
    password: driverPasswordHash,
    phone: '+91 94480 12044',
    role: 'driver',
    assigned_bus_id: 'bus-1',
    created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
  }
];

const initialBookings: Booking[] = [
  {
    id: 'booking-seed-1',
    user_id: 'user-demo-1',
    bus_id: 'bus-1',
    source_location: 'Hunsur',
    destination_location: 'Mysuru (Suburban BS)',
    travel_date: new Date().toISOString().split('T')[0],
    distance: 42,
    fare_per_km: 1.50,
    total_amount: 63.00,
    pnr_number: 'SBAI-2026-KA9042',
    booking_status: 'CONFIRMED',
    payment_method: 'UPI',
    payment_status: 'SUCCESS',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  },
  {
    id: 'booking-seed-2',
    user_id: 'user-demo-1',
    bus_id: 'bus-3',
    source_location: 'Bengaluru (Majestic)',
    destination_location: 'Madikeri',
    travel_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    distance: 268,
    fare_per_km: 1.50,
    total_amount: 804.00,
    pnr_number: 'SBAI-2026-BL2680',
    booking_status: 'CONFIRMED',
    payment_method: 'Credit Card',
    payment_status: 'SUCCESS',
    created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
  }
];

const initialPassengers: Passenger[] = [
  {
    id: 'pass-seed-1',
    booking_id: 'booking-seed-1',
    name: 'Ramesh Gowda',
    age: 38,
    gender: 'Male',
    seat_number: 'A1'
  },
  {
    id: 'pass-seed-2',
    booking_id: 'booking-seed-2',
    name: 'Ramesh Gowda',
    age: 38,
    gender: 'Male',
    seat_number: 'B1'
  },
  {
    id: 'pass-seed-3',
    booking_id: 'booking-seed-2',
    name: 'Lakshmi Gowda',
    age: 34,
    gender: 'Female',
    seat_number: 'B2'
  }
];

// In-Memory Database with JSON Persistence and ACID-style Transaction Locks
class DatabaseStore {
  private data: DatabaseData;
  private isSaving = false;
  private transactionLock = false;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseData {
    try {
      if (!fs.existsSync(path.dirname(DB_FILE))) {
        fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        if (parsed.locations && parsed.buses && parsed.routes) {
          // Schema Migration: populate new tables if missing
          if (!parsed.depots || parsed.depots.length === 0) {
            parsed.depots = initialDepots;
          }
          if (!parsed.depotManagers || parsed.depotManagers.length === 0) {
            parsed.depotManagers = initialDepotManagers;
          }
          if (!parsed.locationAliases || parsed.locationAliases.length === 0) {
            parsed.locationAliases = initialLocationAliases;
          }
          if (!parsed.trips || parsed.trips.length === 0) {
            parsed.trips = initialTrips;
          }
          if (!parsed.busTracking || parsed.busTracking.length === 0) {
            parsed.busTracking = initialBusTracking;
          }

          // Ensure demo users exist
          for (const seedUser of initialUsers) {
            const existingIdx = parsed.users.findIndex((u: any) => u.email.toLowerCase() === seedUser.email.toLowerCase());
            if (existingIdx === -1) {
              parsed.users.push(seedUser);
            } else {
              // Ensure role and depot assignment
              parsed.users[existingIdx].role = seedUser.role;
              if (seedUser.depot_id) parsed.users[existingIdx].depot_id = seedUser.depot_id;
              if (seedUser.assigned_bus_id) parsed.users[existingIdx].assigned_bus_id = seedUser.assigned_bus_id;
              parsed.users[existingIdx].password = seedUser.password;
            }
          }

          // Ensure buses have depot_id and operational_status
          parsed.buses.forEach((b: Bus) => {
            if (!b.operational_status) b.operational_status = 'Active';
            if (!b.live_status) b.live_status = 'Running';
            if (!b.depot_id) {
              if (b.id === 'bus-3' || b.id === 'bus-4') {
                b.depot_id = 'depot-bengaluru';
              } else if (b.id === 'bus-6') {
                b.depot_id = 'depot-hassan';
              } else {
                b.depot_id = 'depot-mysuru';
              }
            }
            if (!b.driver_name) {
              b.driver_name = b.id === 'bus-1' ? 'R. Veerendra (Chief Pilot)' : 'KSRTC Senior Driver';
              b.driver_contact = '+91 94480 12044';
            }
          });

          this.saveDataDirect(parsed);
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read existing database.json, seeding fresh store.', e);
    }

    const seededData: DatabaseData = {
      users: initialUsers,
      locations: initialLocations,
      locationAliases: initialLocationAliases,
      depots: initialDepots,
      depotManagers: initialDepotManagers,
      buses: initialBuses.map((b, idx) => ({
        ...b,
        depot_id: idx % 2 === 0 ? 'depot-mysuru' : 'depot-bengaluru',
        operational_status: 'Active',
        live_status: 'Running',
        driver_name: idx === 0 ? 'R. Veerendra (Chief Pilot)' : 'KSRTC Staff Driver',
        driver_contact: '+91 94480 12044'
      })),
      routes: initialRoutes,
      routeStops: initialRouteStops,
      trips: initialTrips,
      busTracking: initialBusTracking,
      seats: generateSeatsForBuses(initialBuses),
      bookings: initialBookings,
      passengers: initialPassengers,
      adminSettings: initialSettings
    };

    this.saveDataDirect(seededData);
    return seededData;
  }

  private saveDataDirect(dataToSave: DatabaseData) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  public save() {
    if (this.isSaving) return;
    this.isSaving = true;
    setTimeout(() => {
      this.saveDataDirect(this.data);
      this.isSaving = false;
    }, 100);
  }

  // Getters
  public getUsers() { return this.data.users; }
  public getLocations() { return this.data.locations; }
  public getLocationAliases() { return this.data.locationAliases || []; }
  public getDepots() { return this.data.depots || []; }
  public getDepotManagers() { return this.data.depotManagers || []; }
  public getBuses() { return this.data.buses; }
  public getRoutes() { return this.data.routes; }
  public getRouteStops() { return this.data.routeStops; }
  public getTrips() { return this.data.trips || []; }
  public getBusTracking(busId?: string) {
    const list = this.data.busTracking || [];
    if (busId) {
      return list.filter(t => t.bus_id === busId);
    }
    return list;
  }
  public getSeats() { return this.data.seats; }
  public getBookings() { return this.data.bookings; }
  public getPassengers() { return this.data.passengers; }
  public getAdminSettings() { return this.data.adminSettings; }

  // Location Aliases
  public addLocationAlias(alias: LocationAlias): LocationAlias {
    if (!this.data.locationAliases) this.data.locationAliases = [];
    this.data.locationAliases.push(alias);
    this.save();
    return alias;
  }

  // Depots
  public getDepotById(id: string): Depot | undefined {
    return (this.data.depots || []).find(d => d.id === id);
  }

  public addDepot(depot: Depot): Depot {
    if (!this.data.depots) this.data.depots = [];
    this.data.depots.push(depot);
    this.save();
    return depot;
  }

  public updateDepot(id: string, updates: Partial<Depot>): Depot | null {
    if (!this.data.depots) this.data.depots = [];
    const idx = this.data.depots.findIndex(d => d.id === id);
    if (idx === -1) return null;
    this.data.depots[idx] = { ...this.data.depots[idx], ...updates };
    this.save();
    return this.data.depots[idx];
  }

  public deleteDepot(id: string): boolean {
    if (!this.data.depots) return false;
    const prev = this.data.depots.length;
    this.data.depots = this.data.depots.filter(d => d.id !== id);
    this.save();
    return this.data.depots.length < prev;
  }

  // Depot Managers
  public assignDepotManager(userId: string, depotId: string): DepotManager {
    if (!this.data.depotManagers) this.data.depotManagers = [];
    // remove previous assignment if any
    this.data.depotManagers = this.data.depotManagers.filter(dm => dm.user_id !== userId);
    const newDm: DepotManager = {
      id: `dm-${Date.now()}`,
      user_id: userId,
      depot_id: depotId
    };
    this.data.depotManagers.push(newDm);
    // Update user record
    const u = this.data.users.find(usr => usr.id === userId);
    if (u) {
      u.role = 'depot_manager';
      u.depot_id = depotId;
    }
    this.save();
    return newDm;
  }

  // Trips
  public addTrip(trip: Trip): Trip {
    if (!this.data.trips) this.data.trips = [];
    this.data.trips.push(trip);
    this.save();
    return trip;
  }

  public updateTrip(id: string, updates: Partial<Trip>): Trip | null {
    if (!this.data.trips) this.data.trips = [];
    const idx = this.data.trips.findIndex(t => t.id === id);
    if (idx === -1) return null;
    this.data.trips[idx] = { ...this.data.trips[idx], ...updates, updated_at: new Date().toISOString() };
    this.save();
    return this.data.trips[idx];
  }

  public getTripByBusAndDate(busId: string, travelDate: string): Trip | undefined {
    return (this.data.trips || []).find(t => t.bus_id === busId && t.travel_date === travelDate);
  }

  // Bus Tracking History
  public recordBusTracking(telemetry: BusTracking): BusTracking {
    if (!this.data.busTracking) this.data.busTracking = [];
    this.data.busTracking.push(telemetry);
    // Update bus live coordinates and status
    const bus = this.data.buses.find(b => b.id === telemetry.bus_id);
    if (bus) {
      bus.live_lat = telemetry.latitude;
      bus.live_lng = telemetry.longitude;
      bus.live_speed = telemetry.speed;
      if (telemetry.status) bus.live_status = telemetry.status as any;
      if (telemetry.next_stop) bus.live_next_stop = telemetry.next_stop;
      bus.status_updated_at = telemetry.timestamp;
    }
    this.save();
    return telemetry;
  }

  public getLatestBusTracking(busId: string): BusTracking | null {
    const list = (this.data.busTracking || []).filter(t => t.bus_id === busId);
    if (list.length === 0) return null;
    return list[list.length - 1];
  }

  // Setters & Updaters
  public updateAdminFare(rate: number): number {
    this.data.adminSettings.fare_per_km = Number(rate);
    this.save();
    return this.data.adminSettings.fare_per_km;
  }

  public addUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public addLocation(location: Location): Location {
    this.data.locations.push(location);
    this.save();
    return location;
  }

  public addBus(bus: Bus): Bus {
    // Unique registration validation
    const existing = this.data.buses.find(
      b => b.bus_number.trim().toUpperCase() === bus.bus_number.trim().toUpperCase()
    );
    if (existing) {
      throw new Error(`A bus with registration number "${bus.bus_number}" already exists in the system.`);
    }

    if (!bus.operational_status) {
      bus.operational_status = 'Active';
    }
    if (!bus.live_status) {
      bus.live_status = 'Not Started';
    }

    this.data.buses.push(bus);
    // Auto-generate seats for this bus
    const seats = generateSeatsForBuses([bus]);
    this.data.seats.push(...seats);
    this.save();
    return bus;
  }

  public updateBus(id: string, updates: Partial<Bus>, requestingUser?: { role: string; depot_id?: string }): Bus | null {
    const idx = this.data.buses.findIndex(b => b.id === id);
    if (idx === -1) return null;

    const bus = this.data.buses[idx];
    const reqRole = (requestingUser?.role || '').toLowerCase();
    if (reqRole === 'depot_manager' && bus.depot_id && requestingUser?.depot_id && bus.depot_id !== requestingUser.depot_id) {
      throw new Error('Unauthorized: You can only manage buses belonging to your assigned depot');
    }

    // Check unique number if changing bus_number
    if (updates.bus_number && updates.bus_number.trim().toUpperCase() !== bus.bus_number.trim().toUpperCase()) {
      const duplicate = this.data.buses.find(
        b => b.id !== id && b.bus_number.trim().toUpperCase() === updates.bus_number!.trim().toUpperCase()
      );
      if (duplicate) {
        throw new Error(`Bus registration number "${updates.bus_number}" is already assigned to another vehicle.`);
      }
    }

    this.data.buses[idx] = { ...bus, ...updates };
    this.save();
    return this.data.buses[idx];
  }

  public deleteBus(id: string, requestingUser?: { role: string; depot_id?: string }): boolean {
    const bus = this.data.buses.find(b => b.id === id);
    if (!bus) return false;

    const reqRole = (requestingUser?.role || '').toLowerCase();
    if (reqRole === 'depot_manager' && bus.depot_id && requestingUser?.depot_id && bus.depot_id !== requestingUser.depot_id) {
      throw new Error('Unauthorized: You can only delete buses belonging to your assigned depot');
    }

    const prevLen = this.data.buses.length;
    this.data.buses = this.data.buses.filter(b => b.id !== id);
    this.data.routes = this.data.routes.filter(r => r.bus_id !== id);
    this.data.seats = this.data.seats.filter(s => s.bus_id !== id);
    if (this.data.trips) {
      this.data.trips = this.data.trips.filter(t => t.bus_id !== id);
    }
    this.save();
    return this.data.buses.length < prevLen;
  }

  public addRoute(route: Route, stops: RouteStop[]): Route {
    this.data.routes.push(route);
    this.data.routeStops.push(...stops);
    this.save();
    return route;
  }

  public updateRouteStops(routeId: string, stops: RouteStop[]) {
    this.data.routeStops = this.data.routeStops.filter(rs => rs.route_id !== routeId);
    this.data.routeStops.push(...stops);
    this.save();
  }

  // Double-booking and atomic transaction validation
  public async createBookingAtomic(
    bookingData: Omit<Booking, 'id' | 'pnr_number' | 'created_at' | 'booking_status'>,
    passengersData: Array<{ name: string; age: number; gender: string; seat_number: string }>
  ): Promise<{ booking: Booking; passengers: Passenger[] }> {
    // Acquire lock
    while (this.transactionLock) {
      await new Promise(res => setTimeout(res, 25));
    }
    this.transactionLock = true;

    try {
      const { bus_id, travel_date } = bookingData;
      const requestedSeats = passengersData.map(p => p.seat_number);

      // Check existing confirmed bookings for this bus on this travel date
      const activeBookings = this.data.bookings.filter(
        b => b.bus_id === bus_id && b.travel_date === travel_date && b.booking_status === 'CONFIRMED'
      );
      const activeBookingIds = new Set(activeBookings.map(b => b.id));
      const alreadyBookedSeats = new Set<string>();

      for (const p of this.data.passengers) {
        if (activeBookingIds.has(p.booking_id)) {
          alreadyBookedSeats.add(p.seat_number);
        }
      }

      // Check collision
      for (const seat of requestedSeats) {
        if (alreadyBookedSeats.has(seat)) {
          throw new Error(`Seat ${seat} was just reserved by another passenger. Please select another seat.`);
        }
      }

      // Generate PNR: SBAI-YEAR-RANDOMHEX
      const year = new Date().getFullYear();
      const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      const pnr_number = `SBAI-${year}-${randStr}`;

      const newBooking: Booking = {
        id: `bk-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        ...bookingData,
        pnr_number,
        booking_status: 'CONFIRMED',
        created_at: new Date().toISOString()
      };

      const newPassengers: Passenger[] = passengersData.map((p, idx) => ({
        id: `pass-${Date.now()}-${idx}`,
        booking_id: newBooking.id,
        name: p.name,
        age: Number(p.age),
        gender: p.gender,
        seat_number: p.seat_number
      }));

      this.data.bookings.push(newBooking);
      this.data.passengers.push(...newPassengers);
      this.save();

      return { booking: newBooking, passengers: newPassengers };
    } finally {
      this.transactionLock = false;
    }
  }

  public cancelBooking(bookingId: string, userId?: string): Booking | null {
    const booking = this.data.bookings.find(b => b.id === bookingId);
    if (!booking) return null;
    if (userId && booking.user_id !== userId) {
      throw new Error('Unauthorized to cancel this booking');
    }
    booking.booking_status = 'CANCELLED';
    this.save();
    return booking;
  }
}

export const dbStore = new DatabaseStore();
