import React, { useState } from 'react';
import { X, Printer, Download, Copy, Check, Bus, Calendar, MapPin, Users, IndianRupee, ShieldCheck, QrCode } from 'lucide-react';
import { Booking, Bus as BusType, Passenger } from '../types/index.js';

interface TicketModalProps {
  isOpen: boolean;
  booking: (Booking & { bus?: BusType; passengers?: Passenger[] }) | null;
  onClose: () => void;
  onViewMyBookings?: () => void;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  isOpen,
  booking,
  onClose,
  onViewMyBookings
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !booking) return null;

  const {
    pnr_number,
    bus,
    source_location,
    destination_location,
    travel_date,
    distance,
    fare_per_km,
    total_amount,
    booking_status,
    passengers = []
  } = booking;

  const handleCopyPnr = () => {
    navigator.clipboard.writeText(pnr_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col">
        {/* Modal Toolbar (hidden in print) */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">Confirmed E-Ticket</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="print-ticket-btn"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Ticket Area */}
        <div id="smartbus-printable-ticket" className="p-6 sm:p-8 bg-white text-slate-900">
          {/* Ticket Header Banner */}
          <div className="border-b-2 border-red-600 pb-4 mb-5 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-red-600 to-amber-600 text-white flex items-center justify-center shadow-md">
                <Bus className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-black tracking-tight text-slate-900">SmartBus</span>
                  <span className="px-1.5 py-0.2 bg-amber-500 text-white font-extrabold text-xs rounded">AI</span>
                </div>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Karnataka State Road Transport Inspired E-Ticket
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className={`px-2.5 py-1 rounded-md text-xs font-black uppercase ${
                booking_status === 'CONFIRMED'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-red-100 text-red-800'
              }`}>
                {booking_status}
              </span>
              <p className="text-[10px] text-slate-400 font-mono mt-1">E-Ticket # {booking.id.slice(0, 8)}</p>
            </div>
          </div>

          {/* PNR Code Box */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                Reservation PNR Code
              </p>
              <p className="text-xl sm:text-2xl font-black font-mono tracking-wider text-red-700">
                {pnr_number}
              </p>
            </div>

            <button
              onClick={handleCopyPnr}
              className="print:hidden px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1 shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy PNR'}</span>
            </button>
          </div>

          {/* Route Section */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-linear-to-r from-red-50 to-amber-50 border border-red-100 mb-5">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Boarding Point</p>
              <p className="text-lg font-black text-slate-900">{source_location}</p>
              <p className="text-xs text-slate-600 mt-0.5">Date: <strong className="text-slate-900">{travel_date}</strong></p>
            </div>

            <div className="text-right">
              <p className="text-[11px] font-bold text-slate-500 uppercase">Destination</p>
              <p className="text-lg font-black text-slate-900">{destination_location}</p>
              <p className="text-xs text-slate-600 mt-0.5">Bus: <strong className="text-slate-900">{bus?.bus_name || 'KSRTC Express'}</strong></p>
            </div>
          </div>

          {/* Bus Info Grid */}
          <div className="grid grid-cols-3 gap-3 text-xs mb-5 p-3 border border-slate-200 rounded-xl bg-slate-50/50">
            <div>
              <span className="text-slate-400 font-bold block">Registration</span>
              <span className="font-mono font-extrabold text-slate-900">{bus?.bus_number || 'KA-09-F-2026'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block">Service Class</span>
              <span className="font-bold text-slate-900">{bus?.bus_type || 'Karnataka Sarige'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block">Distance</span>
              <span className="font-bold text-slate-900">{distance} km</span>
            </div>
          </div>

          {/* Passenger & Seats Manifest */}
          <div className="mb-5">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">
              Passenger Manifest
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
              {passengers.map((p, i) => (
                <div key={i} className="p-2.5 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                      {i + 1}
                    </span>
                    <span className="font-bold text-slate-900">{p.name}</span>
                    <span className="text-slate-500 text-[11px]">({p.age} yrs • {p.gender})</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-black font-mono">
                    Seat {p.seat_number}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* QR Code & Conductor Verification Footer */}
          <div className="pt-4 border-t-2 border-dashed border-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Verification QR SVG */}
              <div className="w-16 h-16 p-1 bg-white border border-slate-300 rounded-xl flex items-center justify-center">
                <svg viewBox="0 0 50 50" className="w-14 h-14">
                  <rect x="2" y="2" width="16" height="16" fill="#1e293b" />
                  <rect x="5" y="5" width="10" height="10" fill="white" />
                  <rect x="8" y="8" width="4" height="4" fill="#dc2626" />

                  <rect x="32" y="2" width="16" height="16" fill="#1e293b" />
                  <rect x="35" y="5" width="10" height="10" fill="white" />
                  <rect x="38" y="8" width="4" height="4" fill="#dc2626" />

                  <rect x="2" y="32" width="16" height="16" fill="#1e293b" />
                  <rect x="5" y="35" width="10" height="10" fill="white" />
                  <rect x="8" y="38" width="4" height="4" fill="#dc2626" />

                  <rect x="22" y="10" width="6" height="6" fill="#1e293b" />
                  <rect x="22" y="22" width="8" height="8" fill="#d97706" />
                  <rect x="34" y="26" width="6" height="10" fill="#1e293b" />
                  <rect x="22" y="36" width="6" height="6" fill="#1e293b" />
                </svg>
              </div>
              <div className="text-[10px] text-slate-500 leading-tight">
                <p className="font-bold text-slate-800">Conductor QR Verification</p>
                <p>Scan on bus ETM machine</p>
                <p className="font-mono text-slate-400 mt-0.5">ID: {pnr_number.slice(0, 10)}</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Total Fare Paid</p>
              <p className="text-2xl font-black text-red-600">₹{total_amount}</p>
              <p className="text-[10px] text-slate-500 font-medium">({distance} km × ₹{fare_per_km}/km)</p>
            </div>
          </div>
        </div>

        {/* Modal Actions (hidden in print) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          {onViewMyBookings && (
            <button
              onClick={() => {
                onClose();
                onViewMyBookings();
              }}
              className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
            >
              View in My Bookings →
            </button>
          )}

          <button
            onClick={onClose}
            className="ml-auto px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
