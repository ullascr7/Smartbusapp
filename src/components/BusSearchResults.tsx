import React, { useState } from 'react';
import { Bus as BusIcon, Clock, MapPin, Users, IndianRupee, ArrowRight, ShieldCheck, Zap, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { BusSearchResult } from '../types/index.js';

interface BusSearchResultsProps {
  results: BusSearchResult[];
  sourceName: string;
  destName: string;
  travelDate: string;
  fareRatePerKm: number;
  onSelectSeats: (busResult: BusSearchResult) => void;
  onTrackBus: (busId: string) => void;
}

export const BusSearchResults: React.FC<BusSearchResultsProps> = ({
  results,
  sourceName,
  destName,
  travelDate,
  fareRatePerKm,
  onSelectSeats,
  onTrackBus
}) => {
  const [expandedTimelineBusId, setExpandedTimelineBusId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const toggleTimeline = (busId: string) => {
    setExpandedTimelineBusId(prev => (prev === busId ? null : busId));
  };

  const filteredResults = results.filter(r => {
    if (filterType === 'all') return true;
    return r.bus.bus_type.toLowerCase().includes(filterType.toLowerCase());
  });

  return (
    <div className="space-y-4">
      {/* Search Header Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">
              {sourceName} <span className="text-red-600">→</span> {destName}
            </h2>
            <span className="px-2 py-0.5 text-xs font-extrabold bg-red-100 text-red-800 rounded-full">
              {results.length} Buses Found
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Travel Date: <span className="font-semibold text-slate-700">{travelDate}</span> • Official Rate: <span className="font-semibold text-slate-700">₹{fareRatePerKm.toFixed(2)}/km</span>
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-slate-400 font-bold mr-1">Filter:</span>
          {['all', 'Sarige', 'Rajahamsa', 'Club Class', 'EV'].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                filterType === t
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t === 'all' ? 'All Classes' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Bus Cards List */}
      <div className="space-y-3.5">
        {filteredResults.map((result) => {
          const { bus, departureTime, arrivalTime, estimatedDuration, distanceKm, ticketPricePerSeat, availableSeatsCount, stopsList } = result;
          const isTimelineOpen = expandedTimelineBusId === bus.id;

          const isFast = bus.bus_type.includes('Club Class') || bus.bus_type.includes('EV');
          const isElectric = bus.bus_type.includes('EV');

          return (
            <div
              key={bus.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-red-300 transition-all shadow-xs hover:shadow-md overflow-hidden"
            >
              <div className="p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Bus Identity & Schedule */}
                  <div className="space-y-2.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-extrabold px-2 py-0.5 bg-slate-100 text-slate-800 rounded border border-slate-300">
                        {bus.bus_number}
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-slate-900">
                        {bus.bus_name}
                      </h3>
                      <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                        isElectric
                          ? 'bg-emerald-100 text-emerald-800'
                          : isFast
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {bus.bus_type}
                      </span>
                    </div>

                    {/* Route Timings Bar */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-2 pt-1 max-w-md">
                      <div>
                        <p className="text-xs font-medium text-slate-500">Departure</p>
                        <p className="text-base sm:text-lg font-black text-slate-900">{departureTime}</p>
                        <p className="text-[11px] text-slate-600 truncate font-semibold">{sourceName}</p>
                      </div>

                      <div className="text-center flex flex-col items-center justify-center">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {estimatedDuration}
                        </span>
                        <div className="w-full flex items-center gap-1 my-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <div className="h-0.5 flex-1 bg-slate-300 relative">
                            <ArrowRight className="w-3 h-3 text-slate-400 absolute -top-1.25 right-1" />
                          </div>
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">{distanceKm} km</span>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-slate-500">Arrival</p>
                        <p className="text-base sm:text-lg font-black text-slate-900">{arrivalTime}</p>
                        <p className="text-[11px] text-slate-600 truncate font-semibold">{destName}</p>
                      </div>

                      <div className="hidden sm:block text-right">
                        <p className="text-xs font-medium text-slate-500">Seats Left</p>
                        <p className={`text-base font-black ${
                          availableSeatsCount < 8 ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {availableSeatsCount} seats
                        </p>
                      </div>
                    </div>

                    {/* Bus Amenities */}
                    {bus.amenities && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {bus.amenities.map(amenity => (
                          <span key={amenity} className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                            {amenity}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pricing & CTA Column */}
                  <div className="flex sm:flex-row lg:flex-col items-center sm:items-end justify-between lg:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 lg:border-l lg:border-slate-100 lg:pl-6 min-w-44">
                    <div className="text-left sm:text-right">
                      <p className="text-[11px] text-slate-500 font-medium">
                        {distanceKm} km × ₹{fareRatePerKm.toFixed(2)}/km
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900">₹{ticketPricePerSeat}</span>
                        <span className="text-xs font-medium text-slate-500">/ seat</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2 w-full sm:w-auto">
                      <button
                        id={`track-bus-${bus.id}`}
                        onClick={() => onTrackBus(bus.id)}
                        className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                        title="Live GPS Tracking"
                      >
                        <MapPin className="w-4 h-4" />
                      </button>

                      <button
                        id={`select-seats-btn-${bus.id}`}
                        onClick={() => onSelectSeats(result)}
                        disabled={availableSeatsCount === 0}
                        className="flex-1 sm:flex-initial px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm rounded-xl shadow-md shadow-red-600/20 hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {availableSeatsCount === 0 ? 'Sold Out' : 'Select Seats'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Timeline toggle button */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <button
                    type="button"
                    onClick={() => toggleTimeline(bus.id)}
                    className="flex items-center gap-1 font-bold text-slate-700 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <span>View All {stopsList.length} Route Stops & Boarding Handposts</span>
                    {isTimelineOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <span className="text-[11px] text-slate-400 font-medium">
                    Conductor GPS & Live E-Ticket Enabled
                  </span>
                </div>
              </div>

              {/* Collapsible Stops Timeline */}
              {isTimelineOpen && (
                <div className="bg-slate-50 p-4 border-t border-slate-200 text-xs text-slate-700 animate-in fade-in">
                  <p className="font-extrabold text-slate-900 mb-2 uppercase tracking-wider text-[10px]">
                    Complete Route Schedule & Intermediate Village Stops:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {stopsList.map((stop, idx) => {
                      const isSource = stop.locationName.toLowerCase().includes(sourceName.toLowerCase());
                      const isDest = stop.locationName.toLowerCase().includes(destName.toLowerCase());
                      return (
                        <div
                          key={idx}
                          className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                            isSource
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                              : isDest
                              ? 'bg-red-50 border-red-300 text-red-950 font-bold'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-[10px] text-slate-400">#{stop.stopOrder}</span>
                              <span>{stop.locationName}</span>
                            </div>
                            <span className="text-[10px] text-slate-500">{stop.distanceKm} km from start</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-slate-800 font-semibold">{stop.departureTime}</span>
                            {isSource && <span className="block text-[9px] text-emerald-700 uppercase">Boarding</span>}
                            {isDest && <span className="block text-[9px] text-red-700 uppercase">Drop</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
