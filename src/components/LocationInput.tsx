import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Check, Sparkles, X, Loader2 } from 'lucide-react';
import { Location } from '../types/index.js';
import { api } from '../services/api.js';
import { VoiceSearchButton } from './VoiceSearchButton.js';

interface LocationInputProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  selectedLocation: Location | null;
  onSelect: (location: Location) => void;
  onClear: () => void;
  iconColor?: string;
  onDualLocationsFound?: (source: string, destination: string) => void;
}

export const LocationInput: React.FC<LocationInputProps> = ({
  id,
  label,
  placeholder,
  value,
  selectedLocation,
  onSelect,
  onClear,
  iconColor = 'text-red-500',
  onDualLocationsFound
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 1 || (selectedLocation && selectedLocation.name === query)) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.locations.search(query);
        setSuggestions(res.locations || []);
        setIsOpen(true);
      } catch (err) {
        console.warn('Location search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, selectedLocation]);

  const handleSelect = (loc: Location) => {
    setQuery(loc.name);
    onSelect(loc);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleVoiceLocationFound = async (locName: string) => {
    setQuery(locName);
    setLoading(true);
    try {
      const res = await api.locations.search(locName);
      if (res.locations && res.locations.length > 0) {
        handleSelect(res.locations[0]);
      }
    } catch (err) {
      console.warn('Error resolving voice location:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'village':
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">Village</span>;
      case 'town':
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">Town</span>;
      case 'hub':
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">Transit Hub</span>;
      default:
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">City</span>;
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <label htmlFor={id} className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
        <span>{label}</span>
        {selectedLocation && (
          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 normal-case">
            <Check className="w-3 h-3" /> Geocoded
          </span>
        )}
      </label>

      <div className="relative flex items-center">
        <MapPin className={`w-5 h-5 ${iconColor} absolute left-3 pointer-events-none`} />

        <input
          id={id}
          type="text"
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onChange={e => {
            setQuery(e.target.value);
            if (!isOpen && e.target.value.length >= 1) setIsOpen(true);
          }}
          onKeyDown={e => {
            if (!isOpen || suggestions.length === 0) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlightIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlightIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
            } else if (e.key === 'Enter' && highlightIndex >= 0) {
              e.preventDefault();
              handleSelect(suggestions[highlightIndex]);
            } else if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
          className="w-full pl-10 pr-18 py-3 text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-xl shadow-xs focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-hidden transition-all"
        />

        <div className="absolute right-2 flex items-center gap-1">
          {loading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
          {!loading && query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                onClear();
                setSuggestions([]);
              }}
              className="text-slate-400 hover:text-slate-600 p-1"
              title="Clear input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Multilingual Voice Search Button with clearly visible mic icon */}
          <VoiceSearchButton
            id={`${id}-voice-mic-btn`}
            fieldLabel={label}
            onLocationFound={handleVoiceLocationFound}
            onDualLocationsFound={onDualLocationsFound}
          />
        </div>
      </div>

      {/* Suggestion Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 max-h-64 overflow-y-auto divide-y divide-slate-100">
          <div className="px-3 py-1.5 bg-slate-50 text-[11px] font-semibold text-slate-500 flex items-center justify-between">
            <span>Locations & Villages matching "{query}"</span>
            <span className="flex items-center gap-1 text-red-600">
              <Sparkles className="w-3 h-3" /> Karnataka Transit Geocoder
            </span>
          </div>

          {suggestions.map((loc, index) => {
            const isHighlighted = index === highlightIndex;
            const note = (loc as any).matchNote;
            const kannadaName = (loc as any).kannadaName;

            return (
              <div
                key={loc.id}
                onClick={() => handleSelect(loc)}
                onMouseEnter={() => setHighlightIndex(index)}
                className={`px-3.5 py-2.5 cursor-pointer flex items-center justify-between transition-colors ${
                  isHighlighted ? 'bg-red-50/80' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 p-1 rounded-md bg-slate-100 text-slate-600">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{loc.name}</span>
                      {kannadaName && (
                        <span className="text-xs font-semibold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                          {kannadaName}
                        </span>
                      )}
                      {getTypeBadge(loc.type)}
                    </div>
                    <p className="text-xs text-slate-500">
                      {loc.district ? `${loc.district} Dist, ` : ''}{loc.state || 'Karnataka'}
                    </p>
                    {note && (
                      <p className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded inline-block mt-0.5 border border-amber-100">
                        💡 {note}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right text-[10px] text-slate-400 font-mono">
                  {loc.latitude.toFixed(2)}°N, {loc.longitude.toFixed(2)}°E
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
