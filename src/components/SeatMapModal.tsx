import React, { useState, useEffect } from 'react';
import { X, Check, Users, ArrowRight, ShieldCheck, Armchair, Disc as Wheel, Info, Loader2 } from 'lucide-react';
import { BusSearchResult, Seat } from '../types/index.js';
import { api } from '../services/api.js';

interface SeatMapModalProps {
  isOpen: boolean;
  busResult: BusSearchResult;
  travelDate: string;
  onClose: () => void;
  onProceedToPassengers: (selectedSeats: string[], totalFare: number) => void;
}

export const SeatMapModal: React.FC<SeatMapModalProps> = ({
  isOpen,
  busResult,
  travelDate,
  onClose,
  onProceedToPassengers
}) => {
  const [seats, setSeats] = useState<Array<Seat & { isBooked: boolean }>>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const { bus, ticketPricePerSeat, distanceKm } = busResult;

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setSelectedSeats([]);

    api.buses.getSeats(bus.id, travelDate)
      .then(res => {
        setSeats(res.seats as any);
      })
      .catch(err => {
        console.warn('Failed to load bus seats:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, bus.id, travelDate]);

  if (!isOpen) return null;

  const toggleSeat = (seatNumber: string, isBooked: boolean) => {
    if (isBooked) return;
    setSelectedSeats(prev =>
      prev.includes(seatNumber)
        ? prev.filter(s => s !== seatNumber)
        : [...prev, seatNumber]
    );
  };

  const totalFare = Math.round(selectedSeats.length * ticketPricePerSeat * 100) / 100;

  // Group seats in rows of 4 (2 on left, aisle, 2 on right)
  const rows: Array<Array<Seat & { isBooked: boolean }>> = [];
  for (let i = 0; i < seats.length; i += 4) {
    rows.push(seats.slice(i, i + 4));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-linear-to-r from-red-600 via-red-700 to-amber-600 p-5 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black bg-white/20 px-2 py-0.5 rounded">
                {bus.bus_number}
              </span>
              <span className="text-xs text-red-100 font-semibold">{bus.bus_type}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black mt-1">{bus.bus_name}</h2>
            <p className="text-xs text-red-100">
              {busResult.sourceLocationName} → {busResult.destinationLocationName} • {travelDate}
            </p>
          </div>

          <button
            id="close-seat-modal-btn"
            onClick={onClose}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legend */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex items-center justify-center gap-4 sm:gap-8 text-xs font-semibold text-slate-600 flex-wrap shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded border-2 border-emerald-500 bg-white" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-amber-500 text-white flex items-center justify-center text-[10px]">
              ✓
            </div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-slate-300 border border-slate-400 opacity-60" />
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <Info className="w-3.5 h-3.5" />
            <span>Window / Aisle</span>
          </div>
        </div>

        {/* Bus Cabin Interior */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center">
          {loading ? (
            <div className="py-16 text-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-red-600 mb-2" />
              <p className="text-xs font-semibold">Loading real-time seat configuration...</p>
            </div>
          ) : (
            <div className="w-full max-w-sm bg-slate-100 rounded-3xl p-4 sm:p-5 border-2 border-slate-300 shadow-inner">
              {/* Driver & Entry Area */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b-2 border-dashed border-slate-300 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Entry Door</span>
                </div>
                <div className="flex items-center gap-1 text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-300">
                  <span>Driver</span>
                  <div className="w-5 h-5 rounded-full border-2 border-slate-500 flex items-center justify-center text-[10px] font-mono">
                    ⎈
                  </div>
                </div>
              </div>

              {/* Rows Layout */}
              <div className="space-y-3">
                {rows.map((row, rowIdx) => (
                  <div key={rowIdx} className="flex items-center justify-between">
                    {/* Left 2 seats */}
                    <div className="flex items-center gap-2">
                      {row.slice(0, 2).map(seat => {
                        const isSelected = selectedSeats.includes(seat.seat_number);
                        return (
                          <button
                            key={seat.id}
                            type="button"
                            id={`seat-btn-${seat.seat_number}`}
                            disabled={seat.isBooked}
                            onClick={() => toggleSeat(seat.seat_number, seat.isBooked)}
                            className={`w-11 h-11 rounded-xl text-xs font-extrabold flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
                              seat.isBooked
                                ? 'bg-slate-300 text-slate-500 border border-slate-400 opacity-50 cursor-not-allowed line-through'
                                : isSelected
                                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 scale-105 ring-2 ring-amber-400'
                                : 'bg-white text-slate-800 border-2 border-emerald-400 hover:border-emerald-600 hover:bg-emerald-50 shadow-2xs'
                            }`}
                            title={`Seat ${seat.seat_number} (${seat.seat_type})`}
                          >
                            <span>{seat.seat_number}</span>
                            <span className="text-[8px] font-normal leading-none opacity-80">
                              {seat.seat_type === 'window' ? 'Win' : 'Aisle'}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Walking Aisle */}
                    <div className="w-8 text-center text-[10px] font-mono text-slate-300 uppercase tracking-widest pointer-events-none">
                      Aisle
                    </div>

                    {/* Right 2 seats */}
                    <div className="flex items-center gap-2">
                      {row.slice(2, 4).map(seat => {
                        const isSelected = selectedSeats.includes(seat.seat_number);
                        return (
                          <button
                            key={seat.id}
                            type="button"
                            id={`seat-btn-${seat.seat_number}`}
                            disabled={seat.isBooked}
                            onClick={() => toggleSeat(seat.seat_number, seat.isBooked)}
                            className={`w-11 h-11 rounded-xl text-xs font-extrabold flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
                              seat.isBooked
                                ? 'bg-slate-300 text-slate-500 border border-slate-400 opacity-50 cursor-not-allowed line-through'
                                : isSelected
                                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 scale-105 ring-2 ring-amber-400'
                                : 'bg-white text-slate-800 border-2 border-emerald-400 hover:border-emerald-600 hover:bg-emerald-50 shadow-2xs'
                            }`}
                            title={`Seat ${seat.seat_number} (${seat.seat_type})`}
                          >
                            <span>{seat.seat_number}</span>
                            <span className="text-[8px] font-normal leading-none opacity-80">
                              {seat.seat_type === 'window' ? 'Win' : 'Aisle'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Rear emergency exit */}
              <div className="mt-4 pt-3 border-t-2 border-dashed border-slate-300 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Emergency Exit / Rear Windshield
              </div>
            </div>
          )}
        </div>

        {/* Bottom Total & Proceed Bar */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-5 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">Selected Seats:</span>
              <span className="text-sm font-black text-slate-900">
                {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Rate: ₹{ticketPricePerSeat} × {selectedSeats.length} passenger{selectedSeats.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Fare</p>
              <p className="text-2xl font-black text-red-600">₹{totalFare}</p>
            </div>

            <button
              id="proceed-to-passengers-btn"
              disabled={selectedSeats.length === 0}
              onClick={() => onProceedToPassengers(selectedSeats, totalFare)}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-red-600/20 hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Passenger Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
