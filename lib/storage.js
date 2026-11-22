import AsyncStorage from '@react-native-async-storage/async-storage';

// Per-user keys: read uid from 'user' AsyncStorage on each call.
// When logged out, reads return [] and writes are no-ops.
async function getUid() {
  try {
    const u = await AsyncStorage.getItem('user');
    if (!u) return null;
    return JSON.parse(u)?.uid || null;
  } catch { return null; }
}

async function getKey(prefix) {
  const uid = await getUid();
  return uid ? prefix + ':' + uid : null;
}

async function readList(prefix) {
  const k = await getKey(prefix);
  if (!k) return [];
  try {
    const v = await AsyncStorage.getItem(k);
    return v ? JSON.parse(v) : [];
  } catch { return []; }
}

async function writeList(prefix, value) {
  const k = await getKey(prefix);
  if (!k) return;
  await AsyncStorage.setItem(k, JSON.stringify(value));
}

// ============ applied jobs ============
export async function getApplied() {
  return readList('ja:applied');
}

export async function addApplied(job) {
  if (!job?.id) return;
  const cur = await getApplied();
  const filtered = cur.filter(j => j.id !== job.id);
  const entry = {
    id: job.id, slug: job.slug || null, title: job.title || '',
    company: job.company || '', city: job.city || '', country: job.country || '',
    salaryDisplay: job.salaryDisplay || '', appliedAt: Date.now(), status: 'applied',
  };
  const next = [entry, ...filtered];
  await writeList('ja:applied', next);
  return next;
}

export async function removeApplied(id) {
  const cur = await getApplied();
  const next = cur.filter(j => j.id !== id);
  await writeList('ja:applied', next);
  return next;
}

export async function toggleAppliedStatus(id) {
  const cur = await getApplied();
  const next = cur.map(j => j.id === id ? { ...j, status: j.status === 'applied' ? 'withdrawn' : 'applied' } : j);
  await writeList('ja:applied', next);
  return next;
}

// ============ saved jobs ============
export async function getSaved() {
  return readList('ja:saved');
}

export async function isSaved(id) {
  const cur = await getSaved();
  return cur.some(j => j.id === id);
}

export async function toggleSaved(job) {
  if (!job?.id) return false;
  const cur = await getSaved();
  const exists = cur.some(j => j.id === job.id);
  let next;
  if (exists) {
    next = cur.filter(j => j.id !== job.id);
  } else {
    const entry = {
      id: job.id, slug: job.slug || null, title: job.title || '',
      company: job.company || '', city: job.city || '', country: job.country || '',
      salaryDisplay: job.salaryDisplay || '', postedDate: job.postedDate || null,
      savedAt: Date.now(),
    };
    next = [entry, ...cur];
  }
  await writeList('ja:saved', next);
  return !exists;
}

// ============ alerts (saved searches) ============
export async function getAlerts() {
  return readList('ja:alerts');
}

export async function addAlert({ query, country, city }) {
  if (!query?.trim()) return;
  const cur = await getAlerts();
  const key = `${query.trim().toLowerCase()}|${country || ''}|${city || ''}`;
  if (cur.some(a => a.key === key)) return cur;
  const entry = {
    key, query: query.trim(), country: country || null, city: city || null,
    enabled: true, createdAt: Date.now(),
  };
  const next = [entry, ...cur];
  await writeList('ja:alerts', next);
  return next;
}

export async function removeAlert(key) {
  const cur = await getAlerts();
  const next = cur.filter(a => a.key !== key);
  await writeList('ja:alerts', next);
  return next;
}

export async function toggleAlert(key) {
  const cur = await getAlerts();
  const next = cur.map(a => a.key === key ? { ...a, enabled: !a.enabled } : a);
  await writeList('ja:alerts', next);
  return next;
}

// ============ Notifications ============
export async function addNotification({ id, title, body, icon, link }) {
  try {
    const raw = await AsyncStorage.getItem('ja:notifications');
    const list = raw ? JSON.parse(raw) : [];
    const entry = { id: id || String(Date.now()), title, body, icon, link, ts: Date.now(), read: false };
    list.unshift(entry);
    // Keep only last 50
    const trimmed = list.slice(0, 50);
    await AsyncStorage.setItem('ja:notifications', JSON.stringify(trimmed));
    return trimmed;
  } catch { return []; }
}

export async function getNotifications() {
  try {
    const raw = await AsyncStorage.getItem('ja:notifications');
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}
