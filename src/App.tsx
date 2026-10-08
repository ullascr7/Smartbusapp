import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { HeroSearch } from './components/HeroSearch.js';
import { BusSearchResults } from './components/BusSearchResults.js';
import { ConnectingRoutes } from './components/ConnectingRoutes.js';
import { SeatMapModal } from './components/SeatMapModal.js';
import { PassengerDetailsStep } from './components/PassengerDetailsStep.js';
import { BookingSummaryStep } from './components/BookingSummaryStep.js';
import { PaymentModal } from './components/PaymentModal.js';
import { TicketModal } from './components/TicketModal.js';
import { UserDashboard } from './components/UserDashboard.js';
import { AdminDashboard } from './components/AdminDashboard.js';
import { LiveTrackingDashboard } from './components/LiveTrackingDashboard.js';
import { AuthModal } from './components/AuthModal.js';
import { AiAssistantModal } from './components/AiAssistantModal.js';
import {
  Location,
  DistanceCalculationResult,
  BusSearchResult,
  ConnectingRouteOption,
  PassengerInput,
  Booking,
  Bus,
  Passenger
} from './types/index.js';
import { api } from './services/api.js';
import { Sparkles, Shield, Compass, BookOpen, MapPin, Heart, Info, ArrowRight } from 'lucide-react';

function AppContent() {
  const { user, isAdmin } = useAuth();

  // Navigation State
  const [currentTab, setCurrentTab] = useState<'search' | 'my-bookings' | 'live-tracking' | 'admin'>('search');
  const [trackingBusId, setTrackingBusId] = useState<string | undefined>(undefined);

  // Search & Results State
  const [sourceLoc, setSourceLoc] = useState<Location | null>(null);
  const [destLoc, setDestLoc] = useState<Location | null>(null);
  const [travelDate, setTravelDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [distanceInfo, setDistanceInfo] = useState<DistanceCalculationResult | null>(null);
  const [searchResults, setSearchResults] = useState<BusSearchResult[]>([]);
  const [connectingRoutes, setConnectingRoutes] = useState<ConnectingRouteOption[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [activeFareRate, setActiveFareRate] = useState<number>(1.50);

  // Booking Flow State
  const [bookingStep, setBookingStep] = useState<'none' | 'seats' | 'passengers' | 'summary' | 'payment' | 'ticket'>('none');
  const [selectedBusResult, setSelectedBusResult] = useState<BusSearchResult | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [totalFare, setTotalFare] = useState<number>(0);
  const [passengersList, setPassengersList] = useState<PassengerInput[]>([]);
  const [confirmedBooking, setConfirmedBooking] = useState<(Booking & { bus?: Bus; passengers?: Passenger[] }) | null>(null);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [aiModalOpen, setAiModalOpen] = useState(false);

  // Load active fare rate
  useEffect(() => {
    api.distance.calculate(
      { latitude: 12.3051, longitude: 76.6554 },
      { latitude: 12.9716, longitude: 77.5946 }
    ).then(res => {
      if (res.defaultRatePerKm) {
        setActiveFareRate(res.defaultRatePerKm);
      }
    }).catch(() => {});
  }, []);

  // Handle Search
  const handleSearch = async (
    source: Location,
    dest: Location,
    date: string,
    distResult?: DistanceCalculationResult
  ) => {
    setSourceLoc(source);
    setDestLoc(dest);
    setTravelDate(date);
    if (distResult) setDistanceInfo(distResult);

    setSearching(true);
    setHasSearched(true);
    setBookingStep('none');

    try {
      const res = await api.buses.search(source.name, dest.name, date);
      setSearchResults(res.directBuses || []);
      setConnectingRoutes(res.connectingRoutes || []);
      setActiveFareRate(res.fareRatePerKm || 1.50);
    } catch (err: any) {
      console.warn('Search error:', err);
      setSearchResults([]);
      setConnectingRoutes([]);
    } finally {
      setSearching(false);
    }
  };

  // Step 1: Open Seat Selection
  const handleSelectSeats = (busResult: BusSearchResult) => {
    setSelectedBusResult(busResult);
    setBookingStep('seats');
  };

  // Step 2: Proceed from Seats to Passenger Details
  const handleProceedToPassengers = (seats: string[], fare: number) => {
    setSelectedSeats(seats);
    setTotalFare(fare);
    setBookingStep('passengers');
  };

  // Step 3: Proceed from Passengers to Summary
  const handleProceedToSummary = (passengers: PassengerInput[]) => {
    setPassengersList(passengers);
    setBookingStep('summary');
  };

  // Step 4: Proceed from Summary to Payment Modal
  const handleProceedToPayment = () => {
    setBookingStep('payment');
  };

  // Step 5: Payment Success -> Show Digital Ticket
  const handlePaymentSuccess = (booking: Booking & { bus?: Bus; passengers?: Passenger[] }) => {
    setConfirmedBooking(booking);
    setBookingStep('ticket');
  };

  // Jump to Live Tracking for a specific bus
  const handleTrackBus = (busId: string) => {
    setTrackingBusId(busId);
    setCurrentTab('live-tracking');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        onTabChange={tab => {
          setCurrentTab(tab);
          if (tab !== 'search') setBookingStep('none');
        }}
        onOpenAuth={mode => {
          setAuthMode(mode);
          setAuthModalOpen(true);
        }}
        onOpenAiAssistant={() => setAiModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {currentTab === 'search' && (
          <div>
            {/* Hero & Search Widget */}
            <HeroSearch
              onSearch={handleSearch}
              loading={searching}
              activeFareRate={activeFareRate}
            />

            {/* Results or Step Container */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
              {/* If in Passenger Details Step */}
              {bookingStep === 'passengers' && selectedBusResult && (
                <PassengerDetailsStep
                  busResult={selectedBusResult}
                  selectedSeats={selectedSeats}
                  totalFare={totalFare}
                  onBack={() => setBookingStep('seats')}
                  onProceedToSummary={handleProceedToSummary}
                />
              )}

              {/* If in Booking Summary Step */}
              {bookingStep === 'summary' && selectedBusResult && (
                <BookingSummaryStep
                  busResult={selectedBusResult}
                  passengers={passengersList}
                  travelDate={travelDate}
                  totalFare={totalFare}
                  onBack={() => setBookingStep('passengers')}
                  onProceedToPayment={handleProceedToPayment}
                />
              )}

              {/* Normal Results List View */}
              {(bookingStep === 'none' || bookingStep === 'seats') && hasSearched && (
                <div className="space-y-6">
                  {searchResults.length > 0 ? (
                    <BusSearchResults
                      results={searchResults}
                      sourceName={sourceLoc?.name || ''}
                      destName={destLoc?.name || ''}
                      travelDate={travelDate}
                      fareRatePerKm={activeFareRate}
                      onSelectSeats={handleSelectSeats}
                      onTrackBus={handleTrackBus}
                    />
                  ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-600">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
                        <Info className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-black text-slate-900">
                        No direct bus found between {sourceLoc?.name} and {destLoc?.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                        Check out our automated connecting transit routes below to reach your destination smoothly via major transport hubs.
                      </p>
                    </div>
                  )}

                  {/* Connecting Transit Options */}
                  <ConnectingRoutes
                    connectingRoutes={connectingRoutes}
                    sourceName={sourceLoc?.name || ''}
                    destName={destLoc?.name || ''}
                    onSelectLeg={handleSelectSeats}
                  />
                </div>
              )}

              {/* Initial Landing Feature Cards (before search) */}
              {!hasSearched && (
                <div className="py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <h3 className="font-black text-slate-900 text-base">Small Village Support</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Search by rural hamlets, handposts, and village bus shelters across Karnataka with intelligent OpenStreetMap geocoding.
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="font-black text-slate-900 text-base">Automated Distance & Fare</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Real-time road distance calculation at ₹1.50 per km. Configurable on-the-fly by administrative controllers.
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                      <Shield className="w-5 h-5" />
                    </div>
                    <h3 className="font-black text-slate-900 text-base">Driver GPS Telemetry</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Live satellite bus tracking, passenger manifests, digital QR tickets, and simulated driver dispatcher controls.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: User Bookings */}
        {currentTab === 'my-bookings' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <UserDashboard
              onViewTicket={b => {
                setConfirmedBooking(b);
                setBookingStep('ticket');
              }}
            />
          </div>
        )}

        {/* Tab 3: Real-Time Live Driver Tracking */}
        {currentTab === 'live-tracking' && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <LiveTrackingDashboard initialBusId={trackingBusId} />
          </div>
        )}

        {/* Tab 4: Admin Dashboard */}
        {currentTab === 'admin' && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <AdminDashboard
              onFareUpdated={newRate => {
                setActiveFareRate(newRate);
              }}
            />
          </div>
        )}
      </main>

      {/* MODALS */}

      {/* Seat Map Modal */}
      {selectedBusResult && (
        <SeatMapModal
          isOpen={bookingStep === 'seats'}
          busResult={selectedBusResult}
          travelDate={travelDate}
          onClose={() => setBookingStep('none')}
          onProceedToPassengers={handleProceedToPassengers}
        />
      )}

      {/* Demo Payment Modal */}
      {selectedBusResult && (
        <PaymentModal
          isOpen={bookingStep === 'payment'}
          busResult={selectedBusResult}
          passengers={passengersList}
          travelDate={travelDate}
          totalFare={totalFare}
          onClose={() => setBookingStep('summary')}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* E-Ticket Display Modal */}
      <TicketModal
        isOpen={bookingStep === 'ticket'}
        booking={confirmedBooking}
        onClose={() => {
          setBookingStep('none');
          setConfirmedBooking(null);
        }}
        onViewMyBookings={() => {
          setBookingStep('none');
          setCurrentTab('my-bookings');
        }}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* AI Assistant Modal */}
      <AiAssistantModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        currentSource={sourceLoc?.name}
        currentDest={destLoc?.name}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-slate-700">
            SmartBus AI – KSRTC-Style Intelligent Bus Ticket Booking System
          </p>
          <p className="text-[11px] text-slate-400">
            Educational Demo Project • Inspired by public bus reservation systems
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
