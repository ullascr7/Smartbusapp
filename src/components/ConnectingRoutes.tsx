import React from 'react';
import { GitCommit, ArrowRight, Clock, MapPin, IndianRupee, Sparkles } from 'lucide-react';
import { ConnectingRouteOption, BusSearchResult } from '../types/index.js';

interface ConnectingRoutesProps {
  connectingRoutes: ConnectingRouteOption[];
  sourceName: string;
  destName: string;
  onSelectLeg: (busResult: BusSearchResult) => void;
}

export const ConnectingRoutes: React.FC<ConnectingRoutesProps> = ({
  connectingRoutes,
  sourceName,
  destName,
  onSelectLeg
}) => {
  if (!connectingRoutes || connectingRoutes.length === 0) return null;

  return (
    <div className="bg-linear-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              Direct bus not available. Connecting Route Recommendations:
            </h3>
            <span className="text-[10px] font-extrabold uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
              AI Transit Routing
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            We discovered intelligent 2-leg transit options via Karnataka transportation hubs so you can easily reach your destination:
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {connectingRoutes.map((option, idx) => {
          return (
            <div key={idx} className="bg-white rounded-xl border border-amber-200/80 p-4 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <span>Transit via Hub:</span>
                  <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-extrabold">
                    {option.hubLocation.name}
                  </span>
                  <span className="text-slate-400 font-normal">({option.layoverDuration})</span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-500">Total Distance: <strong>{option.totalDistance} km</strong></span>
                  <span className="text-slate-500">•</span>
                  <span className="text-red-600 font-black text-sm">Combined Fare: ₹{option.totalFare}</span>
                </div>
              </div>

              {/* Legs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                {/* Leg 1 */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-500 mb-1">
                      <span>LEG 1: Rural Boarding</span>
                      <span className="text-slate-700 font-mono">{option.leg1.departureTime}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{sourceName} → {option.hubLocation.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{option.leg1.bus.bus_name} ({option.leg1.bus.bus_number})</p>
                    <p className="text-xs font-semibold text-slate-700 mt-1">
                      {option.leg1.distanceKm} km • Fare: ₹{option.leg1.ticketPricePerSeat}
                    </p>
                  </div>

                  <button
                    onClick={() => onSelectLeg(option.leg1)}
                    className="mt-3 w-full py-1.5 px-3 bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Select Leg 1 Bus
                  </button>
                </div>

                {/* Leg 2 */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-500 mb-1">
                      <span>LEG 2: Express Connection</span>
                      <span className="text-slate-700 font-mono">{option.leg2.departureTime}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{option.hubLocation.name} → {destName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{option.leg2.bus.bus_name} ({option.leg2.bus.bus_number})</p>
                    <p className="text-xs font-semibold text-slate-700 mt-1">
                      {option.leg2.distanceKm} km • Fare: ₹{option.leg2.ticketPricePerSeat}
                    </p>
                  </div>

                  <button
                    onClick={() => onSelectLeg(option.leg2)}
                    className="mt-3 w-full py-1.5 px-3 bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Select Leg 2 Bus
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
