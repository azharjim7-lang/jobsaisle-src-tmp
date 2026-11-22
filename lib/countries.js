// Single source of truth for all 13 countries — mirrors web codebase
// Uses flagcdn.com PNGs (React Native can't render emoji flags on all devices)

import AsyncStorage from '@react-native-async-storage/async-storage';

export const COUNTRIES = [
  { code: 'IN', iso: 'in', name: 'India',        dbName: 'India',       slug: 'india',        currency: 'INR', jobs: 2424925, primaryCity: 'Delhi' },
  { code: 'MY', iso: 'my', name: 'Malaysia',     dbName: 'Malaysia',    slug: 'malaysia',     currency: 'MYR', jobs: 57089,   primaryCity: 'Kuala Lumpur' },
  { code: 'AE', iso: 'ae', name: 'UAE',          dbName: 'UAE',         slug: 'uae',          currency: 'AED', jobs: 47984,   primaryCity: 'Dubai' },
  { code: 'PH', iso: 'ph', name: 'Philippines',  dbName: 'Philippines', slug: 'philippines',  currency: 'PHP', jobs: 43046,   primaryCity: 'Manila' },
  { code: 'SA', iso: 'sa', name: 'Saudi Arabia', dbName: 'Saudi',       slug: 'saudi-arabia', currency: 'SAR', jobs: 40006,   primaryCity: 'Riyadh' },
  { code: 'ID', iso: 'id', name: 'Indonesia',    dbName: 'Indonesia',   slug: 'indonesia',    currency: 'IDR', jobs: 36253,   primaryCity: 'Jakarta' },
  { code: 'VN', iso: 'vn', name: 'Vietnam',      dbName: 'Vietnam',     slug: 'vietnam',      currency: 'VND', jobs: 29547,   primaryCity: 'Ho Chi Minh City' },
  { code: 'SG', iso: 'sg', name: 'Singapore',    dbName: 'Singapore',   slug: 'singapore',    currency: 'SGD', jobs: 29049,   primaryCity: 'Singapore' },
  { code: 'TH', iso: 'th', name: 'Thailand',     dbName: 'Thailand',    slug: 'thailand',     currency: 'THB', jobs: 22726,   primaryCity: 'Bangkok' },
  { code: 'QA', iso: 'qa', name: 'Qatar',        dbName: 'Qatar',       slug: 'qatar',        currency: 'QAR', jobs: 19468,   primaryCity: 'Doha' },
  { code: 'KW', iso: 'kw', name: 'Kuwait',       dbName: 'Kuwait',      slug: 'kuwait',       currency: 'KWD', jobs: 7969,    primaryCity: 'Kuwait City' },
  { code: 'BH', iso: 'bh', name: 'Bahrain',      dbName: 'Bahrain',     slug: 'bahrain',      currency: 'BHD', jobs: 6680,    primaryCity: 'Manama' },
  { code: 'OM', iso: 'om', name: 'Oman',         dbName: 'Oman',        slug: 'oman',         currency: 'OMR', jobs: 5593,    primaryCity: 'Muscat' },
];

export const CODE_TO_COUNTRY = Object.fromEntries(COUNTRIES.map(c => [c.code, c]));
export const DBNAME_TO_COUNTRY = Object.fromEntries(COUNTRIES.map(c => [c.dbName, c]));
export const DEFAULT_COUNTRY = CODE_TO_COUNTRY.IN;
const STORAGE_KEY = 'ja:selectedCountry';

// Returns flagcdn.com PNG URL — use as {uri: flagUrl('in')} in <Image>
export function flagUrl(iso, size = 48) {
  const heights = { 48: 36, 24: 18, 60: 45, 80: 60, 120: 90 };
  const h = heights[size] || Math.round(size * 0.75);
  return `https://flagcdn.com/${size}x${h}/${iso}.png`;
}

export function formatJobCount(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return Math.round(n / 1000) + 'K';
  return String(n);
}

// AsyncStorage helpers
export async function getSelectedCountry() {
  try {
    const code = await AsyncStorage.getItem(STORAGE_KEY);
    if (code && CODE_TO_COUNTRY[code]) return CODE_TO_COUNTRY[code];
  } catch {}
  return null;
}

export async function setSelectedCountry(code) {
  if (!CODE_TO_COUNTRY[code]) return false;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, code);
    return true;
  } catch {
    return false;
  }
}

export async function clearSelectedCountry() {
  try { await AsyncStorage.removeItem(STORAGE_KEY); } catch {}
}
