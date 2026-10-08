import React, { useState } from 'react';
import { User, Phone, Calendar, ArrowLeft, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { PassengerInput, BusSearchResult } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';

interface PassengerDetailsStepProps {
  busResult: BusSearchResult;
  selectedSeats: string[];
  totalFare: number;
  onBack: () => void;
  onProceedToSummary: (passengers: PassengerInput[]) => void;
}

export const PassengerDetailsStep: React.FC<PassengerDetailsStepProps> = ({
  busResult,
  selectedSeats,
  totalFare,
  onBack,
  onProceedToSummary
}) => {
  const { user } = useAuth();

  // Initialize passenger list based on selected seats
  const [passengers, setPassengers] = useState<PassengerInput[]>(() => {
    return selectedSeats.map((seat, index) => ({
      seat_number: seat,
      name: index === 0 && user?.name ? user.name : '',
      age: '',
      gender: 'Male',
      phone: index === 0 && user?.phone ? user.phone : ''
    }));
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const updatePassenger = (index: number, field: keyof PassengerInput, val: any) => {
    setPassengers(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate all passengers
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.name || p.name.trim().length < 2) {
        setErrorMsg(`Please enter a valid name for passenger in Seat ${p.seat_number}`);
        return;
      }
      const ageNum = Number(p.age);
      if (!p.age || isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
        setErrorMsg(`Please enter a valid age (1-120) for passenger in Seat ${p.seat_number}`);
        return;
      }
      if (!p.gender) {
        setErrorMsg(`Please select gender for passenger in Seat ${p.seat_number}`);
        return;
      }
    }

    onProceedToSummary(passengers);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Seat Selection
          </button>
          <h2 className="text-xl font-black text-slate-900">Passenger Information</h2>
          <p className="text-xs text-slate-500">
            Booking {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} on {busResult.bus.bus_name} ({selectedSeats.join(', ')})
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] uppercase font-bold text-slate-400">Total Ticket Fare</p>
          <p className="text-2xl font-black text-red-600">₹{totalFare}</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Passenger Forms List */}
      <form onSubmit={handleContinue} className="space-y-4">
        {passengers.map((p, idx) => (
          <div
            key={p.seat_number}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-red-100 text-red-700 font-extrabold text-xs flex items-center justify-center">
                  #{idx + 1}
                </span>
                <span className="font-extrabold text-sm text-slate-900">
                  Passenger {idx + 1}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-xs font-black">
                Seat {p.seat_number}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id={`passenger-name-${idx}`}
                    type="text"
                    required
                    placeholder="e.g. Ramesh Gowda"
                    value={p.name}
                    onChange={e => updatePassenger(idx, 'name', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-hidden transition-all"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Age <span className="text-red-500">*</span>
                </label>
                <input
                  id={`passenger-age-${idx}`}
                  type="number"
                  min="1"
                  max="120"
                  required
                  placeholder="35"
                  value={p.age}
                  onChange={e => updatePassenger(idx, 'age', e.target.value)}
                  className="w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-hidden transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  id={`passenger-gender-${idx}`}
                  value={p.gender}
                  onChange={e => updatePassenger(idx, 'gender', e.target.value as any)}
                  className="w-full px-2.5 py-2 text-sm font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-hidden transition-all bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile (For SMS Ticket)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id={`passenger-phone-${idx}`}
                    type="tel"
                    placeholder="98450 12345"
                    value={p.phone || ''}
                    onChange={e => updatePassenger(idx, 'phone', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-hidden transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 border border-slate-300 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors"
          >
            Back to Seat Layout
          </button>

          <button
            id="proceed-to-summary-btn"
            type="submit"
            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-red-600/20 hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Proceed to Booking Summary</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
