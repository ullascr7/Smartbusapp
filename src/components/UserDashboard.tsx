import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Calendar, MapPin, Bus, Eye, XCircle, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Booking, Bus as BusType, Passenger } from '../types/index.js';
import { api } from '../services/api.js';

interface UserDashboardProps {
  onViewTicket: (booking: Booking & { bus?: BusType; passengers?: Passenger[] }) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ onViewTicket }) => {
  const [tab, setTab] = useState<'upcoming' | 'previous' | 'all'>('upcoming');
  const [bookings, setBookings] = useState<Array<Booking & { bus?: BusType; passengers: Passenger[]; isUpcoming: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [pnrSearch, setPnrSearch] = useState('');
  const [pnrResult, setPnrResult] = useState<(Booking & { bus?: BusType; passengers: Passenger[] }) | null>(null);
  const [pnrError, setPnrError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadBookings = () => {
    setLoading(true);
    api.user.getBookings()
      .then(res => {
        setBookings(res.all || []);
      })
      .catch(err => {
        console.warn('Failed to load user bookings:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handlePnrSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pnrSearch.trim()) return;
    setPnrError(null);
    setPnrResult(null);

    try {
      const res = await api.bookings.getByPnr(pnrSearch.trim());
      setPnrResult(res.booking);
    } catch (err: any) {
      setPnrError(err.message || 'No booking found for this PNR');
    }
  };

  const handleCancelBooking = async (id: string, pnr: string) => {
    if (!window.confirm(`Are you sure you want to cancel booking with PNR: ${pnr}? Your seats will be released immediately.`)) {
      return;
    }

    setCancellingId(id);
    try {
      const res = await api.bookings.cancel(id);
      setMessage(res.message || 'Booking cancelled successfully');
      loadBookings();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (tab === 'upcoming') return b.isUpcoming;
    if (tab === 'previous') return !b.isUpcoming;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">My Trip Reservations</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
              {bookings.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Access your confirmed e-tickets, download boarding passes, or manage cancellations.
          </p>
        </div>

        <button
          onClick={loadBookings}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center gap-1.5 text-xs font-semibold self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* PNR Fast Lookup Banner */}
      <div className="bg-linear-to-r from-red-600 to-amber-600 rounded-2xl p-5 text-white shadow-md">
        <h2 className="text-sm font-bold uppercase tracking-wider mb-2">Quick PNR Ticket Retrieval</h2>
        <form onSubmit={handlePnrSearch} className="flex gap-2 max-w-lg">
          <input
            type="text"
            placeholder="Enter 16-character PNR (e.g. SBAI-2026-KA...)"
            value={pnrSearch}
            onChange={e => setPnrSearch(e.target.value)}
            className="flex-1 px-4 py-2 text-sm font-mono font-bold text-slate-900 bg-white rounded-xl outline-hidden"
          />
          <button
            type="submit"
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Find
          </button>
        </form>

        {pnrError && (
          <p className="text-xs text-red-200 font-semibold mt-2">{pnrError}</p>
        )}

        {pnrResult && (
          <div className="mt-3 p-3 bg-white text-slate-900 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
            <div>
              <span className="font-mono font-bold text-red-600">{pnrResult.pnr_number}</span>
              <p className="font-bold text-sm">{pnrResult.source_location} → {pnrResult.destination_location}</p>
              <p className="text-slate-500 text-[11px]">Travel Date: {pnrResult.travel_date}</p>
            </div>
            <button
              onClick={() => onViewTicket(pnrResult)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg cursor-pointer"
            >
              View Ticket
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-sm font-bold">
        <button
          onClick={() => setTab('upcoming')}
          className={`pb-3 border-b-2 transition-all cursor-pointer ${
            tab === 'upcoming' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Upcoming Journeys ({bookings.filter(b => b.isUpcoming).length})
        </button>

        <button
          onClick={() => setTab('previous')}
          className={`pb-3 border-b-2 transition-all cursor-pointer ${
            tab === 'previous' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Completed & Past Trips ({bookings.filter(b => !b.isUpcoming).length})
        </button>

        <button
          onClick={() => setTab('all')}
          className={`pb-3 border-b-2 transition-all cursor-pointer ${
            tab === 'all' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All ({bookings.length})
        </button>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">
          Loading your ticket reservations...
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">No bookings in this category</p>
          <p className="text-xs text-slate-400 mt-1">Book your bus tickets with automatic fare calculation from the search tab.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map(b => (
            <div
              key={b.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-black text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    {b.pnr_number}
                  </span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    b.booking_status === 'CONFIRMED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {b.booking_status}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Booked on {new Date(b.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-slate-900 font-bold text-base">
                  <span>{b.source_location}</span>
                  <span className="text-red-500">→</span>
                  <span>{b.destination_location}</span>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Travel Date: <strong>{b.travel_date}</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bus className="w-3.5 h-3.5 text-slate-400" />
                    <span>{b.bus?.bus_name || 'KSRTC Express'} ({b.bus?.bus_number})</span>
                  </div>
                  <div>
                    <span>Seats: <strong>{b.passengers.map(p => p.seat_number).join(', ')}</strong></span>
                  </div>
                </div>
              </div>

              {/* Price & Actions */}
              <div className="flex items-center justify-between md:flex-col md:items-end gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                <div className="text-left md:text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Total Fare</p>
                  <p className="text-xl font-black text-slate-900">₹{b.total_amount}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewTicket(b)}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Ticket</span>
                  </button>

                  {b.booking_status === 'CONFIRMED' && (
                    <button
                      disabled={cancellingId === b.id}
                      onClick={() => handleCancelBooking(b.id, b.pnr_number)}
                      className="px-3 py-2 border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                      title="Cancel Booking and free seats"
                    >
                      {cancellingId === b.id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
