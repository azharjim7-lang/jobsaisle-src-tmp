// App-side currency conversion. Fetches FX rates from /api/fx once, caches in memory.

const COUNTRY_TO_CURRENCY = {
  'India': 'INR',
  'United Arab Emirates': 'AED', 'UAE': 'AED',
  'Saudi Arabia': 'SAR',
  'Qatar': 'QAR',
  'Oman': 'OMR',
  'Bahrain': 'BHD',
  'Kuwait': 'KWD',
};

let _fxCache = null;
let _fxFetchedAt = 0;
let _fxFetchPromise = null;

export async function getFxRates() {
  if (_fxCache && Date.now() - _fxFetchedAt < 3600000) return _fxCache;
  if (_fxFetchPromise) return _fxFetchPromise;
  _fxFetchPromise = (async () => {
    try {
      const r = await fetch('https://www.jobsaisle.com/api/fx');
      if (!r.ok) return null;
      const d = await r.json();
      _fxCache = d;
      _fxFetchedAt = Date.now();
      return d;
    } catch {
      return null;
    } finally {
      _fxFetchPromise = null;
    }
  })();
  return _fxFetchPromise;
}

export function countryCurrency(country) {
  return COUNTRY_TO_CURRENCY[country] || null;
}

function jobCurrency(job) {
  if (job.salaryCurrency) return job.salaryCurrency === '₹' ? 'INR' : job.salaryCurrency;
  return countryCurrency(job.country) || (job.country === 'India' ? 'INR' : null);
}

function inrFormat(n) {
  const s = Math.round(n).toString();
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  return s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
}

function compactFmt(n, currency) {
  if (n >= 10000000) return (n/10000000).toFixed(1) + 'Cr';
  if (n >= 100000 && currency === 'INR') return (n/100000).toFixed(1) + 'L';
  if (n >= 1000) return Math.round(n/1000) + 'K';
  return Math.round(n).toString();
}

// Returns "₹6.4L" style converted string, or null if can't convert
export function convertSalary(job, userCurrency, fx) {
  if (!userCurrency || !fx || !fx.rates) return null;
  const jc = jobCurrency(job);
  if (!jc || jc === userCurrency) return null;
  if (!job.salaryMin && !job.salaryMax) return null;
  if (!fx.rates[jc] || !fx.rates[userCurrency]) return null;
  const amount = job.salaryMax || job.salaryMin;
  const converted = (amount / fx.rates[jc]) * fx.rates[userCurrency];
  const sym = userCurrency === 'INR' ? '₹' : userCurrency + ' ';
  return sym + compactFmt(converted, userCurrency);
}
