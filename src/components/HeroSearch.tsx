import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Calendar, Search, Calculator, ShieldCheck, Sparkles, Navigation, Route, AlertCircle } from 'lucide-react';
import { Location, DistanceCalculationResult } from '../types/index.js';
import { LocationInput } from './LocationInput.js';
import { api } from '../services/api.js';

interface HeroSearchProps {
  onSearch: (source: Location, destination: Location, date: string, distanceResult?: DistanceCalculationResult) => void;
  loading: boolean;
  activeFareRate: number;
}

export const HeroSearch: React.FC<HeroSearchProps> = ({ onSearch, loading, activeFareRate }) => {
  const [sourceLoc, setSourceLoc] = useState<Location | null>(null);
  const [destLoc, setDestLoc] = useState<Location | null>(null);
  const [travelDate, setTravelDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [distanceInfo, setDistanceInfo] = useState<DistanceCalculationResult | null>(null);
  const [calculatingDist, setCalculatingDist] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Set default search if empty (e.g. Hunsur -> Mysuru demo)
  useEffect(() => {
    api.locations.getAll().then(res => {
      const hunsur = res.locations.find(l => l.name.toLowerCase().includes('hunsur'));
      const mysuru = res.locations.find(l => l.name.toLowerCase().includes('mysuru'));
      if (hunsur && mysuru && !sourceLoc && !destLoc) {
        setSourceLoc(hunsur);
        setDestLoc(mysuru);
      }
    }).catch(() => {});
  }, []);

  // When both source and destination are set, calculate road distance & fare automatically
  useEffect(() => {
    if (sourceLoc && destLoc) {
      if (sourceLoc.name.toLowerCase() === destLoc.name.toLowerCase()) {
        setErrorMsg('Source and Destination cannot be the same place');
        setDistanceInfo(null);
        return;
      }
      setErrorMsg(null);
      setCalculatingDist(true);

      api.distance.calculate(
        { latitude: sourceLoc.latitude, longitude: sourceLoc.longitude, name: sourceLoc.name },
        { latitude: destLoc.latitude, longitude: destLoc.longitude, name: destLoc.name }
      )
        .then(data => {
          setDistanceInfo(data);
        })
        .catch(err => {
          console.warn('Distance calculation error:', err);
        })
        .finally(() => {
          setCalculatingDist(false);
        });
    } else {
      setDistanceInfo(null);
      setErrorMsg(null);
    }
  }, [sourceLoc, destLoc, activeFareRate]);

  const handleSwap = () => {
    const temp = sourceLoc;
    setSourceLoc(destLoc);
    setDestLoc(temp);
  };

  const handleQuickRoute = (srcName: string, dstName: string) => {
    api.locations.getAll().then(res => {
      const s = res.locations.find(l => l.name.toLowerCase().includes(srcName.toLowerCase()));
      const d = res.locations.find(l => l.name.toLowerCase().includes(dstName.toLowerCase()));
      if (s && d) {
        setSourceLoc(s);
        setDestLoc(d);
      }
    });
  };

  const handleDualVoiceLocations = async (srcName: string, dstName: string) => {
    try {
      const [srcRes, dstRes] = await Promise.all([
        api.locations.search(srcName),
        api.locations.search(dstName)
      ]);
      if (srcRes.locations && srcRes.locations.length > 0) {
        setSourceLoc(srcRes.locations[0]);
      }
      if (dstRes.locations && dstRes.locations.length > 0) {
        setDestLoc(dstRes.locations[0]);
      }
    } catch (err) {
      console.warn('Error applying dual voice locations:', err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceLoc) {
      setErrorMsg('Please select a valid source location or village');
      return;
    }
    if (!destLoc) {
      setErrorMsg('Please select a valid destination location or city');
      return;
    }
    if (sourceLoc.name.toLowerCase() === destLoc.name.toLowerCase()) {
      setErrorMsg('Source and Destination cannot be the same location');
      return;
    }
    setErrorMsg(null);
    onSearch(sourceLoc, destLoc, travelDate, distanceInfo || undefined);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="relative overflow-hidden bg-linear-to-b from-red-700 via-red-800 to-slate-900 text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8">
      {/* Background Decorative patterns */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -left-24 w-96 h-96 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10 text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-amber-300 mb-4 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Village & Town Intelligent Geocoding • Real-time Road Distance • Auto Fare</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight font-sans">
          Travel Smart. <span className="text-amber-400">Book Faster.</span>
        </h1>

        <p className="mt-3 text-sm sm:text-base text-red-100/90 max-w-2xl mx-auto leading-relaxed">
          Find buses from your village to your destination with intelligent location search and automatic fare calculation.
        </p>
      </div>

      {/* Main Search Card */}
      <div className="max-w-4xl mx-auto relative z-20">
        <form
          onSubmit={handleSubmit}
          className="bg-white text-slate-900 rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-200/80 backdrop-blur-lg"
        >
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
            {/* Source Input */}
            <div className="lg:col-span-4">
              <LocationInput
                id="search-source-input"
                label="Leaving From"
                placeholder="Village, Town, or Bus Stand (e.g. Hunsur)"
                value={sourceLoc?.name || ''}
                selectedLocation={sourceLoc}
                onSelect={loc => setSourceLoc(loc)}
                onClear={() => setSourceLoc(null)}
                iconColor="text-emerald-500"
                onDualLocationsFound={handleDualVoiceLocations}
              />
            </div>

            {/* Swap Button */}
            <div className="hidden lg:flex lg:col-span-1 justify-center pb-2">
              <button
                type="button"
                id="swap-locations-btn"
                onClick={handleSwap}
                className="w-10 h-10 rounded-full border border-slate-300 bg-slate-50 hover:bg-red-50 hover:border-red-300 hover:text-red-600 flex items-center justify-center text-slate-600 transition-all shadow-xs active:scale-95"
                title="Swap source and destination"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Destination Input */}
            <div className="lg:col-span-4">
              <LocationInput
                id="search-dest-input"
                label="Going To"
                placeholder="City, Town, or Village (e.g. Mysuru)"
                value={destLoc?.name || ''}
                selectedLocation={destLoc}
                onSelect={loc => setDestLoc(loc)}
                onClear={() => setDestLoc(null)}
                iconColor="text-red-500"
                onDualLocationsFound={handleDualVoiceLocations}
              />
            </div>

            {/* Travel Date */}
            <div className="lg:col-span-3">
              <label htmlFor="search-date-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Travel Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                <input
                  id="search-date-input"
                  type="date"
                  min={todayStr}
                  value={travelDate}
                  onChange={e => setTravelDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-xl shadow-xs focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-hidden transition-all"
                />
              </div>
            </div>
          </div>

          {/* Automatic Fare & Distance Calculation Bar */}
          {sourceLoc && destLoc && (
            <div className="mt-4 p-3.5 rounded-2xl bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200/80 flex flex-wrap items-center justify-between gap-3 text-slate-800 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-amber-950 uppercase tracking-wider">
                      Auto Distance & Fare Estimation
                    </span>
                    <span className="text-[10px] bg-amber-200/60 text-amber-900 px-1.5 py-0.2 rounded-md font-semibold">
                      OSRM Highway Route
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Formula: <span className="font-mono font-bold text-slate-800">Distance (km) × ₹{activeFareRate.toFixed(2)}/km</span>
                  </p>
                </div>
              </div>

              {calculatingDist ? (
                <div className="text-xs font-semibold text-amber-700 animate-pulse flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 animate-spin" />
                  Calculating road distance...
                </div>
              ) : distanceInfo ? (
                <div className="flex items-center gap-4 text-right">
                  <div className="border-r border-amber-200 pr-4">
                    <p className="text-[11px] text-slate-500 font-medium">Road Distance</p>
                    <p className="text-sm font-black text-slate-900">{distanceInfo.roadDistanceKm} km</p>
                  </div>
                  <div className="border-r border-amber-200 pr-4">
                    <p className="text-[11px] text-slate-500 font-medium">Fare Rate</p>
                    <p className="text-sm font-black text-slate-900">₹{distanceInfo.defaultRatePerKm.toFixed(2)}/km</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 font-medium">Approx. Fare</p>
                    <p className="text-base font-black text-red-600">₹{distanceInfo.estimatedFare}</p>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Action Row */}
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
            {/* Quick routes */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-500">
              <span className="font-bold text-slate-700">Popular:</span>
              <button
                type="button"
                onClick={() => handleQuickRoute('Hunsur', 'Mysuru')}
                className="px-2 py-1 rounded-md bg-slate-100 hover:bg-red-50 hover:text-red-700 transition-colors font-medium cursor-pointer"
              >
                Hunsur → Mysuru
              </button>
              <button
                type="button"
                onClick={() => handleQuickRoute('Bilikere', 'Bengaluru')}
                className="px-2 py-1 rounded-md bg-slate-100 hover:bg-red-50 hover:text-red-700 transition-colors font-medium cursor-pointer"
              >
                Bilikere → Bengaluru
              </button>
              <button
                type="button"
                onClick={() => handleQuickRoute('Madikeri', 'Mysuru')}
                className="px-2 py-1 rounded-md bg-slate-100 hover:bg-red-50 hover:text-red-700 transition-colors font-medium cursor-pointer"
              >
                Madikeri → Mysuru
              </button>
              <button
                type="button"
                onClick={() => handleQuickRoute('Shivamogga', 'Tumakuru')}
                className="px-2 py-1 rounded-md bg-slate-100 hover:bg-red-50 hover:text-red-700 transition-colors font-medium cursor-pointer"
              >
                Shivamogga → Tumakuru
              </button>
            </div>

            {/* Submit Button */}
            <button
              id="search-bus-btn"
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-red-600/30 hover:shadow-xl hover:shadow-red-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Searching Buses...</span>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Search Bus</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
