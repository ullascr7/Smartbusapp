import React from 'react';
import { Bus, MapPin, Calendar, Users, IndianRupee, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2, Ticket } from 'lucide-react';
import { BusSearchResult, PassengerInput } from '../types/index.js';

interface BookingSummaryStepProps {
  busResult: BusSearchResult;
  passengers: PassengerInput[];
  travelDate: string;
  totalFare: number;
  onBack: () => void;
  onProceedToPayment: () => void;
}

export const BookingSummaryStep: React.FC<BookingSummaryStepProps> = ({
  busResult,
  passengers,
  travelDate,
  totalFare,
  onBack,
  onProceedToPayment
}) => {
  const { bus, sourceLocationName, destinationLocationName, departureTime, arrivalTime, distanceKm, ticketPricePerSeat } = busResult;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Passenger Details
          </button>
          <h2 className="text-xl font-black text-slate-900">Booking Summary & Verification</h2>
          <p className="text-xs text-slate-500">
            Please verify journey timings, boarding details, and passenger manifest before payment.
          </p>
        </div>

        <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
          <Ticket className="w-6 h-6" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Journey & Bus Details */}
        <div className="md:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Journey Specifications
            </h3>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-xs text-slate-500">Leaving From</p>
                <p className="text-base font-black text-slate-900">{sourceLocationName}</p>
                <p className="text-xs font-mono text-emerald-600 font-bold">{departureTime}</p>
              </div>

              <div className="text-center px-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Highway Distance</span>
                <p className="text-xs font-bold text-slate-700">{distanceKm} km</p>
                <div className="w-16 h-0.5 bg-red-400 mx-auto my-1" />
              </div>

              <div className="text-right">
                <p className="text-xs text-slate-500">Going To</p>
                <p className="text-base font-black text-slate-900">{destinationLocationName}</p>
                <p className="text-xs font-mono text-red-600 font-bold">{arrivalTime}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Travel Date: <strong className="text-slate-900">{travelDate}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Bus className="w-4 h-4 text-slate-400" />
                <span>{bus.bus_name} ({bus.bus_number})</span>
              </div>
            </div>
          </div>

          {/* Passenger Manifest */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Passenger Manifest ({passengers.length})
              </h3>
              <span className="text-xs font-bold text-slate-600">
                Seats: {passengers.map(p => p.seat_number).join(', ')}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {passengers.map((p, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{p.name}</span>
                    <span className="text-slate-500 ml-2">({p.age} yrs • {p.gender})</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-black">
                    Seat {p.seat_number}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fare Breakdown & Checkout Box */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Fare Calculation Breakdown
            </h3>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Calculated Road Distance</span>
                <span className="font-semibold text-slate-800">{distanceKm} km</span>
              </div>
              <div className="flex justify-between">
                <span>Admin Rate per km</span>
                <span className="font-semibold text-slate-800">₹1.50 / km</span>
              </div>
              <div className="flex justify-between">
                <span>Base Fare Per Seat</span>
                <span className="font-semibold text-slate-800">₹{ticketPricePerSeat}</span>
              </div>
              <div className="flex justify-between">
                <span>Passengers</span>
                <span className="font-semibold text-slate-800">× {passengers.length}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Toll & Service Charges</span>
                <span>Included (₹0.00)</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <div>
                  <p className="text-xs font-bold text-slate-900">Total Payable Amount</p>
                  <p className="text-[10px] text-slate-400">GST Inclusive (Demo)</p>
                </div>
                <span className="text-2xl font-black text-red-600">₹{totalFare}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                <strong>Demo Booking Notice:</strong> This reservation uses simulated instant payment. Your digital boarding ticket will be generated upon confirmation.
              </span>
            </div>

            <button
              id="proceed-to-payment-btn"
              onClick={onProceedToPayment}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-red-600/20 hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Proceed to Demo Payment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
