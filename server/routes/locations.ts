import { Router } from 'express';
import { dbStore } from '../db.js';
import { Location } from '../../src/types/index.js';

const router = Router();

// In-memory cache for Nominatim external geocoding requests
const nominatimCache = new Map<string, Location[]>();

// Comprehensive dictionary for Kannada scripts and English phonetics to canonical Karnataka locations
const KANNADA_CANONICAL_MAP: Record<string, string> = {
  // Kannada script words
  'ಮೈಸೂರು': 'Mysuru (Suburban BS)',
  'ಬೆಂಗಳೂರು': 'Bengaluru (Majestic)',
  'ಹುನ್ಸೂರು': 'Hunsur',
  'ಹುಣಸೂರು': 'Hunsur',
  'ಮಂಡ್ಯ': 'Mandya',
  'ಶ್ರೀರಂಗಪಟ್ಟಣ': 'Srirangapatna',
  'ಮದ್ದೂರು': 'Maddur',
  'ರಾಮನಗರ': 'Ramanagara',
  'ಚನ್ನಪಟ್ಟಣ': 'Channapatna',
  'ಬಿಳಿಕೆರೆ': 'Bilikere',
  'ಯಲವಾಲ': 'Yelwala',
  'ಪಿರಿಯಾಪಟ್ಟಣ': 'Periyapatna',
  'ಕುಶಾಲನಗರ': 'Kushalnagar',
  'ಮಡಿಕೇರಿ': 'Madikeri',
  'ತುಮಕೂರು': 'Tumakuru',
  'ಶಿವಮೊಗ್ಗ': 'Shivamogga',
  'ಹಾಸನ': 'Hassan',
  'ಚನ್ನರಾಯಪಟ್ಟಣ': 'Channarayapatna',
  'ಮಂಗಳೂರು': 'Mangaluru',
  'ಉಡುಪಿ': 'Udupi',
  'ಹುಬ್ಬಳ್ಳಿ': 'Hubballi',
  'ಬೆಳಗಾವಿ': 'Belagavi',
  'ನಂಜನಗೂಡು': 'Nanjangud',
  'ಗುಂಡ್ಲುಪೇಟೆ': 'Gundlupet',
  'ಕೆ ಆರ್ ನಗರ': 'KR Nagara',
  'ಕೆ.ಆರ್.ನಗರ': 'KR Nagara',
  'ಕೆಆರ್ ನಗರ': 'KR Nagara',

  // Common English and phonetics
  'mysore': 'Mysuru (Suburban BS)',
  'mysuru': 'Mysuru (Suburban BS)',
  'bangalore': 'Bengaluru (Majestic)',
  'bengaluru': 'Bengaluru (Majestic)',
  'bengalooru': 'Bengaluru (Majestic)',
  'majestic': 'Bengaluru (Majestic)',
  'hoonsoor': 'Hunsur',
  'hunasuru': 'Hunsur',
  'hunsoor': 'Hunsur',
  'hunsur': 'Hunsur',
  'mercara': 'Madikeri',
  'coorg': 'Madikeri',
  'shimoga': 'Shivamogga',
  'tumkur': 'Tumakuru',
  'hubli': 'Hubballi',
  'belgaum': 'Belagavi',
  'mangalore': 'Mangaluru',
  'udipi': 'Udupi',
  'piriyapatna': 'Periyapatna',
  'kushalnagara': 'Kushalnagar',
  'bylakuppe': 'Kushalnagar',
  'ramnagaram': 'Ramanagara',
  'ramnagar': 'Ramanagara',
  'channapatnam': 'Channapatna',
  'kr nagar': 'KR Nagara',
  'krishnarajanagara': 'KR Nagara',
  'bilekere': 'Bilikere',
  'nanjangudu': 'Nanjangud',
  'gundlupete': 'Gundlupet'
};

// Clean Kannada grammatical suffixes (Ablative "from" and Dative "to")
function stripKannadaGrammar(term: string): { cleaned: string; role?: 'source' | 'destination' } {
  let text = term.trim();
  let role: 'source' | 'destination' | undefined = undefined;

  // "From" suffixes: ನಿಂದ (ninda), ದಿಂದ (dinda), ಇಂದ (inda), ಯಿಂದ (yinda)
  const fromSuffixes = ['ನಿಂದ', 'ದಿಂದ', 'ಇಂದ', 'ಯಿಂದ'];
  for (const s of fromSuffixes) {
    if (text.endsWith(s) && text.length > s.length + 1) {
      text = text.slice(0, -s.length).trim();
      role = 'source';
      return { cleaned: text, role };
    }
  }

  // "To" suffixes: ರಿಗೆ (rige), ಲಿಗೆ (lige), ಕ್ಕೆ (kke), ಗೆ (ge)
  const toSuffixes = ['ರಿಗೆ', 'ಲಿಗೆ', 'ಕ್ಕೆ', 'ಗೆ'];
  for (const s of toSuffixes) {
    if (text.endsWith(s) && text.length > s.length + 1) {
      text = text.slice(0, -s.length).trim();
      role = 'destination';
      return { cleaned: text, role };
    }
  }

  return { cleaned: text, role };
}

// Levenshtein distance for fuzzy matching
function levenshtein(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = Array.from({ length: bn + 1 }, () => new Array(an + 1).fill(0));
  for (let i = 0; i <= an; i++) matrix[0][i] = i;
  for (let j = 0; j <= bn; j++) matrix[j][0] = j;

  for (let j = 1; j <= bn; j++) {
    for (let i = 1; i <= an; i++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i - 1] + 1,
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1
        );
      }
    }
  }
  return matrix[bn][an];
}

// GET /api/locations - list all configured locations
router.get('/', (req, res) => {
  const locations = dbStore.getLocations();
  return res.json({ locations });
});

// GET /api/locations/search?q=...
router.get('/search', async (req, res) => {
  try {
    const rawQuery = (req.query.q as string || '').trim();
    if (!rawQuery || rawQuery.length < 1) {
      return res.json({ locations: [] });
    }

    const { cleaned: cleanedGrammarQuery } = stripKannadaGrammar(rawQuery);
    const q = cleanedGrammarQuery.toLowerCase();
    const rawLower = rawQuery.toLowerCase();
    const dbLocations = dbStore.getLocations();
    const aliases = dbStore.getLocationAliases();

    // 1. Check local database direct matches, Kannada dictionary, and aliases
    const directMatches: Array<Location & { matchScore: number; matchNote?: string; kannadaName?: string }> = [];

    // Check alias dictionary
    const aliasTarget = KANNADA_CANONICAL_MAP[cleanedGrammarQuery] || KANNADA_CANONICAL_MAP[rawQuery] || KANNADA_CANONICAL_MAP[q];

    for (const loc of dbLocations) {
      const nameLower = loc.name.toLowerCase();
      const districtLower = (loc.district || '').toLowerCase();
      let score = 0;
      let note: string | undefined;

      // Find Kannada alias for display
      const knAlias = aliases.find(a => a.location_id === loc.id && a.language === 'kn');
      const kannadaName = knAlias?.alias_name;

      if (nameLower.startsWith(q) || nameLower.startsWith(rawLower)) {
        score = 100;
        if (kannadaName) note = `ಕನ್ನಡ: ${kannadaName}`;
      } else if (nameLower.includes(q) || nameLower.includes(rawLower)) {
        score = 85;
      } else if (aliasTarget && loc.name.toLowerCase().includes(aliasTarget.toLowerCase())) {
        score = 95;
        note = `Recognized Voice Term: "${rawQuery}" → ${loc.name}`;
      } else {
        // Check dynamic aliases in database
        const locAliases = aliases.filter(a => a.location_id === loc.id);
        const matchAlias = locAliases.find(a => {
          const aText = a.alias_name.toLowerCase();
          return aText === q || aText === rawLower || aText.includes(q) || q.includes(aText);
        });

        if (matchAlias) {
          score = 90;
          note = matchAlias.language === 'kn' ? `ಕನ್ನಡ: ${matchAlias.alias_name}` : `Alias: ${matchAlias.alias_name}`;
        } else if (loc.aliases && loc.aliases.some(a => a.toLowerCase().includes(q))) {
          score = 75;
          const matchedA = loc.aliases.find(a => a.toLowerCase().includes(q));
          note = `Known as ${matchedA}`;
        } else if (districtLower.includes(q)) {
          score = 60;
          note = `In ${loc.district} District`;
        } else {
          // Fuzzy distance check
          const cleanName = nameLower.replace(/\s*\(.*?\)\s*/g, '');
          const dist = levenshtein(q, cleanName);
          if (dist <= 2 && cleanName.length > 3) {
            score = 55 - dist * 10;
            note = `Did you mean ${loc.name}?`;
          }
        }
      }

      if (score > 0) {
        directMatches.push({ ...loc, matchScore: score, matchNote: note, kannadaName });
      }
    }

    directMatches.sort((a, b) => b.matchScore - a.matchScore);

    // If we have local database matches, return top results
    if (directMatches.length >= 2) {
      return res.json({ locations: directMatches.slice(0, 8) });
    }

    // 2. Query OpenStreetMap Nominatim for small Karnataka villages/towns
    if (nominatimCache.has(q)) {
      const cached = nominatimCache.get(q)!;
      const combined = [...directMatches, ...cached.filter(c => !directMatches.some(d => d.name.toLowerCase() === c.name.toLowerCase()))];
      return res.json({ locations: combined.slice(0, 8) });
    }

    try {
      const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanedGrammarQuery)}&countrycodes=in&format=json&addressdetails=1&limit=5`;
      const response = await fetch(osmUrl, {
        headers: {
          'User-Agent': 'SmartBus-AI-Booking-System/1.0 (educational demo app)'
        }
      });

      if (response.ok) {
        const data = await response.json() as any[];
        const osmLocations: Location[] = data.map((item, idx) => {
          const addr = item.address || {};
          const locName = addr.village || addr.hamlet || addr.town || addr.city || addr.suburb || item.display_name.split(',')[0].trim();
          const district = addr.county || addr.state_district || addr.district || 'Karnataka';
          const state = addr.state || 'India';
          const type = addr.village || addr.hamlet ? 'village' : (addr.town ? 'town' : 'city');

          return {
            id: `osm-${item.place_id || Date.now() + idx}`,
            name: `${locName}${addr.village ? ' (Village)' : ''}`,
            type,
            district,
            state,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon)
          };
        });

        nominatimCache.set(q, osmLocations);

        const combined = [...directMatches, ...osmLocations.filter(c => !directMatches.some(d => d.name.toLowerCase() === c.name.toLowerCase()))];
        return res.json({ locations: combined.slice(0, 8) });
      }
    } catch (osmErr) {
      console.warn('Nominatim geocoding fetch error (falling back):', osmErr);
    }

    return res.json({ locations: directMatches.slice(0, 8) });
  } catch (error: any) {
    console.error('Location search error:', error);
    return res.status(500).json({ error: 'Failed to search locations' });
  }
});

// POST /api/locations/parse-voice - Intelligent Multilingual Voice Parser
router.post('/parse-voice', (req, res) => {
  try {
    const { speechText, fieldTarget } = req.body;
    if (!speechText || typeof speechText !== 'string') {
      return res.status(400).json({ error: 'Speech text is required' });
    }

    const raw = speechText.trim();
    const dbLocations = dbStore.getLocations();
    const aliases = dbStore.getLocationAliases();

    // Helper to find best matching location for a candidate word/phrase
    const resolveLocation = (phrase: string): Location | null => {
      const { cleaned } = stripKannadaGrammar(phrase);
      const cleanLower = cleaned.toLowerCase().trim();

      // Check canonical map
      const mapped = KANNADA_CANONICAL_MAP[cleaned] || KANNADA_CANONICAL_MAP[cleanLower];
      if (mapped) {
        const found = dbLocations.find(l => l.name.toLowerCase().includes(mapped.toLowerCase()));
        if (found) return found;
      }

      // Check DB aliases
      const matchAlias = aliases.find(a => {
        const aLow = a.alias_name.toLowerCase();
        return aLow === cleanLower || cleanLower.includes(aLow) || aLow.includes(cleanLower);
      });
      if (matchAlias) {
        const found = dbLocations.find(l => l.id === matchAlias.location_id);
        if (found) return found;
      }

      // Check location names
      const exact = dbLocations.find(l => {
        const nLow = l.name.toLowerCase();
        return nLow.includes(cleanLower) || cleanLower.includes(nLow.replace(/\s*\(.*?\)\s*/g, ''));
      });
      if (exact) return exact;

      // Fuzzy check
      for (const loc of dbLocations) {
        const base = loc.name.toLowerCase().replace(/\s*\(.*?\)\s*/g, '');
        if (levenshtein(cleanLower, base) <= 2 && base.length > 3) {
          return loc;
        }
      }

      return null;
    };

    // Check if speech contains both source and destination
    // Pattern 1: Kannada "X ಇಂದ Y ಗೆ" or "X ನಿಂದ Y ಗೆ" or "X ದಿಂದ Y ಕ್ಕೆ"
    // Pattern 2: English "from X to Y" or "X to Y"
    let sourceLoc: Location | null = null;
    let destLoc: Location | null = null;

    // Check English patterns
    const fromToMatch = raw.match(/(?:from\s+)?(.+?)\s+(?:to|towards|going to)\s+(.+)/i);
    if (fromToMatch) {
      sourceLoc = resolveLocation(fromToMatch[1]);
      destLoc = resolveLocation(fromToMatch[2]);
    }

    // Check Kannada compound speech: "...ಇಂದ...ಗೆ"
    if (!sourceLoc || !destLoc) {
      const kannadaSplit = raw.split(/(?:\s+ಇಂದ\s+|\s+ನಿಂದ\s+|\s+ದಿಂದ\s+)/);
      if (kannadaSplit.length >= 2) {
        sourceLoc = resolveLocation(kannadaSplit[0]);
        // Remove trailing "ಗೆ" or "ಹೋಗಬೇಕು"
        const cleanDest = kannadaSplit[1].replace(/(?:\s+ಗೆ|\s+ಕ್ಕೆ|\s+ಹೋಗಬೇಕು|\s+ಹೋಗಿ)+$/g, '');
        destLoc = resolveLocation(cleanDest);
      }
    }

    // Single term voice input
    const singleLoc = resolveLocation(raw);

    return res.json({
      originalSpeech: raw,
      detectedIntent: (sourceLoc && destLoc) ? 'two_locations' : 'single_location',
      sourceLocation: sourceLoc ? { name: sourceLoc.name, id: sourceLoc.id } : null,
      destinationLocation: destLoc ? { name: destLoc.name, id: destLoc.id } : null,
      singleLocation: singleLoc ? { name: singleLoc.name, id: singleLoc.id } : null,
      suggestedQuery: singleLoc ? singleLoc.name : (sourceLoc?.name || raw)
    });
  } catch (error: any) {
    console.error('Voice parsing error:', error);
    return res.status(500).json({ error: 'Failed to process voice input' });
  }
});

export default router;
