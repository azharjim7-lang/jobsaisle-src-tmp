import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSelectedCountry } from './countries';

// Extended to include SEA countries — was previously only India + Gulf
const ISO_TO_COUNTRY = {
  IN: 'India',
  AE: 'UAE',
  SA: 'Saudi',
  QA: 'Qatar',
  KW: 'Kuwait',
  BH: 'Bahrain',
  OM: 'Oman',
  SG: 'Singapore',
  MY: 'Malaysia',
  ID: 'Indonesia',
  TH: 'Thailand',
  VN: 'Vietnam',
  PH: 'Philippines',
};

const CACHE_KEY = 'geo:location:v2';
const CACHE_TTL = 6 * 60 * 60 * 1000;
const DEBUG = true;
const log = (...a) => { if (DEBUG) console.log('[geo]', ...a); };

const PROVIDERS = [
  {
    name: 'ipwho.is',
    url: 'https://ipwho.is/',
    parse: (d) => {
      if (d?.success === false) throw new Error(d?.message || 'ipwho failed');
      return { iso: (d?.country_code || '').toUpperCase(), city: d?.city || null };
    },
  },
  {
    name: 'ipapi.co',
    url: 'https://ipapi.co/json/',
    parse: (d) => {
      if (d?.error) throw new Error(d?.reason || 'ipapi error');
      return { iso: (d?.country_code || d?.country || '').toUpperCase(), city: d?.city || null };
    },
  },
];

async function fetchWithTimeout(url, ms = 4000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    try { return JSON.parse(text); }
    catch { throw new Error('non-JSON response: ' + text.slice(0, 80)); }
  } finally {
    clearTimeout(t);
  }
}

export async function detectLocation() {
  // ─── PRIORITY 1: User's explicit country selection (freshest intent) ───
  try {
    const picked = await getSelectedCountry();
    if (picked) {
      log('using picked country', picked.code, picked.dbName);
      return { country: picked.dbName, city: picked.primaryCity };
    }
  } catch (e) { log('country pick check error', e?.message); }

  // ─── PRIORITY 2: Cache ───
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const { country, city, ts } = JSON.parse(cached);
      if ((country || city) && Date.now() - ts < CACHE_TTL) {
        log('cache hit', { country, city });
        return { country, city };
      }
    }
  } catch (e) { log('cache read error', e?.message); }

  // ─── PRIORITY 3: GeoIP providers ───
  for (const p of PROVIDERS) {
    try {
      log('trying', p.name);
      const data = await fetchWithTimeout(p.url, 4000);
      const { iso, city } = p.parse(data);
      const country = ISO_TO_COUNTRY[iso] || null;
      log(p.name, 'returned', { iso, country, city });
      if (country || city) {
        const out = { country, city };
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ ...out, ts: Date.now() })).catch(() => {});
        return out;
      }
    } catch (e) {
      log(p.name, 'failed:', e?.message);
    }
  }
  log('all providers failed');
  return { country: null, city: null };
}

export async function clearGeoCache() {
  try { await AsyncStorage.removeItem(CACHE_KEY); log('cache cleared'); } catch {}
}
