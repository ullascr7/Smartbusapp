import React, { useState } from 'react';
import { X, QrCode, CreditCard, Landmark, CheckCircle2, ShieldAlert, Loader2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { BusSearchResult, PassengerInput, Booking, Bus, Passenger } from '../types/index.js';
import { api } from '../services/api.js';

interface PaymentModalProps {
  isOpen: boolean;
  busResult: BusSearchResult;
  passengers: PassengerInput[];
  travelDate: string;
  totalFare: number;
  onClose: () => void;
  onPaymentSuccess: (confirmedBooking: Booking & { bus?: Bus; passengers: Passenger[] }) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  busResult,
  passengers,
  travelDate,
  totalFare,
  onClose,
  onPaymentSuccess
}) => {
  const [method, setMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePay = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const res = await api.bookings.create({
        bus_id: busResult.bus.id,
        source_location: busResult.sourceLocationName,
        destination_location: busResult.destinationLocationName,
        travel_date: travelDate,
        distance: busResult.distanceKm,
        fare_per_km: busResult.fareRatePerKm,
        total_amount: totalFare,
        passengers,
        payment_method: method === 'upi' ? 'UPI Demo (KSRTC Pay)' : method === 'card' ? 'Credit/Debit Card Demo' : 'Net Banking Demo'
      });

      // Fire celebratory confetti!
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Safe if canvas is restricted
      }

      onPaymentSuccess(res.booking);
    } catch (err: any) {
      setError(err.message || 'Payment simulation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-linear-to-r from-red-600 via-red-700 to-amber-600 p-5 text-white flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
              Secure Demo Checkout
            </span>
            <h2 className="text-xl font-black mt-1">Simulated Ticket Payment</h2>
            <p className="text-xs text-red-100">Amount Due: ₹{totalFare} ({passengers.length} seat{passengers.length > 1 ? 's' : ''})</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Notice Banner */}
        <div className="bg-amber-50 px-5 py-2.5 border-b border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
          <span>This is an educational simulation. No real credit card or bank money is charged.</span>
        </div>

        {/* Payment Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5 shrink-0">
          <button
            onClick={() => setMethod('upi')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              method === 'upi' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4" /> UPI & QR
          </button>

          <button
            onClick={() => setMethod('card')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              method === 'card' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" /> Cards
          </button>

          <button
            onClick={() => setMethod('netbanking')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              method === 'netbanking' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Landmark className="w-4 h-4" /> Net Banking
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {method === 'upi' && (
            <div className="text-center space-y-3">
              <p className="text-xs text-slate-600">
                Scan with any UPI app (GPay, PhonePe, Paytm) to simulate instant payment:
              </p>

              {/* Simulated QR Code SVG */}
              <div className="w-44 h-44 mx-auto p-2 bg-white border-2 border-slate-200 rounded-2xl shadow-inner flex flex-col items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-36 h-36">
                  {/* Outer corner squares */}
                  <rect x="5" y="5" width="30" height="30" fill="#1e293b" rx="2" />
                  <rect x="10" y="10" width="20" height="20" fill="white" />
                  <rect x="15" y="15" width="10" height="10" fill="#dc2626" />

                  <rect x="65" y="5" width="30" height="30" fill="#1e293b" rx="2" />
                  <rect x="70" y="10" width="20" height="20" fill="white" />
                  <rect x="75" y="15" width="10" height="10" fill="#dc2626" />

                  <rect x="5" y="65" width="30" height="30" fill="#1e293b" rx="2" />
                  <rect x="10" y="70" width="20" height="20" fill="white" />
                  <rect x="15" y="75" width="10" height="10" fill="#dc2626" />

                  {/* QR random data dots pattern */}
                  <rect x="42" y="10" width="6" height="6" fill="#1e293b" />
                  <rect x="52" y="10" width="6" height="6" fill="#1e293b" />
                  <rect x="42" y="24" width="14" height="6" fill="#1e293b" />
                  <rect x="10" y="44" width="24" height="6" fill="#1e293b" />
                  <rect x="42" y="42" width="16" height="16" fill="#d97706" rx="2" />
                  <rect x="68" y="44" width="22" height="6" fill="#1e293b" />
                  <rect x="68" y="54" width="12" height="6" fill="#1e293b" />
                  <rect x="44" y="68" width="6" height="22" fill="#1e293b" />
                  <rect x="58" y="72" width="14" height="18" fill="#1e293b" />
                  <rect x="78" y="80" width="12" height="10" fill="#1e293b" />
                </svg>
                <span className="text-[10px] font-mono text-slate-500 mt-1">smartbus@oksbi</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                UPI ID: <span className="font-mono font-bold text-slate-900">smartbus-ksrtc@upi</span>
              </div>
            </div>
          )}

          {method === 'card' && (
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Card Number (Demo)</label>
                <input
                  type="text"
                  readOnly
                  value="4111 •••• •••• 1234 (Demo Visa)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expiry</label>
                  <input
                    type="text"
                    readOnly
                    value="12 / 28"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">CVV</label>
                  <input
                    type="text"
                    readOnly
                    value="•••"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          {method === 'netbanking' && (
            <div className="space-y-2 text-xs">
              <p className="font-bold text-slate-700">Select Bank (Demo):</p>
              {['State Bank of India', 'Canara Bank', 'HDFC Bank', 'Karnataka Bank'].map(b => (
                <div key={b} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between font-semibold text-slate-800">
                  <span>{b}</span>
                  <span className="text-[10px] text-emerald-600 font-bold">Connected</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Checkout Button */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 shrink-0">
          <button
            id="confirm-pay-demo-btn"
            disabled={loading}
            onClick={handlePay}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-600/30 hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Simulating Payment Authorization...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Pay ₹{totalFare} & Generate E-Ticket</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
