import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE = 'https://www.jobsaisle.com';
const CACHE_KEY = 'ja:profile:v1';
const CACHE_TTL = 5 * 60 * 1000; // 5 min

// ============ API ============
export async function fetchProfile(userId) {
  if (!userId) return null;

  // Try cache
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const { profile, ts, uid } = JSON.parse(cached);
      if (uid === userId && Date.now() - ts < CACHE_TTL) return profile;
    }
  } catch {}

  try {
    const res = await fetch(`${BASE}/api/profile`, {
      headers: { 'x-user-id': userId },
    });
    const data = await res.json();
    const profile = data.profile || null;
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ profile, ts: Date.now(), uid: userId })).catch(() => {});
    return profile;
  } catch {
    return null;
  }
}

export async function saveProfile(userId, profile) {
  if (!userId) return { error: 'no_user' };
  try {
    const res = await fetch(`${BASE}/api/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify(profile),
    });
    const data = await res.json();
    // Invalidate cache after save
    AsyncStorage.removeItem(CACHE_KEY).catch(() => {});
    return data;
  } catch (e) {
    return { error: 'network' };
  }
}

export async function clearProfileCache() {
  try { await AsyncStorage.removeItem(CACHE_KEY); } catch {}
}

// ============ Completion calculation ============
// 25% per filled section: currentTitle / skills(3+) / experience / preferredCities(1+)
export function profileCompletion(profile) {
  if (!profile) return 0;
  let pct = 0;
  if (profile.currentTitle && profile.currentTitle.trim()) pct += 25;
  if (Array.isArray(profile.skills) && profile.skills.length >= 3) pct += 25;
  if (profile.experience && profile.experience.trim()) pct += 25;
  if (Array.isArray(profile.preferredCities) && profile.preferredCities.length >= 1) pct += 25;
  return pct;
}

export function isProfileComplete(profile) {
  return profileCompletion(profile) === 100;
}

// What's missing for the user to know
export function profileGaps(profile) {
  const gaps = [];
  if (!profile?.currentTitle?.trim()) gaps.push('Add your current role');
  if (!Array.isArray(profile?.skills) || profile.skills.length < 3) gaps.push('Add at least 3 skills');
  if (!profile?.experience?.trim()) gaps.push('Set your experience level');
  if (!Array.isArray(profile?.preferredCities) || profile.preferredCities.length < 1) gaps.push('Pick preferred cities');
  return gaps;
}
