const BASE = 'https://www.jobsaisle.com';

export async function fetchJobs({ search, company, country, city, category, sector, type, sort, user, exclude, exclude_applied, jobType, posted_within, min_salary, page = 1, limit = 20 } = {}) {
  const p = new URLSearchParams();
  if (search) p.set('search', search);
  if (company) p.set('company', company);
  if (jobType) p.set('jobType', jobType);
  if (posted_within) p.set('posted_within', posted_within);
  if (min_salary) p.set('min_salary', min_salary);
  if (exclude_applied) p.set('exclude_applied', String(exclude_applied));
  if (company) p.set('company', company);
  if (jobType) p.set('jobType', jobType);
  if (posted_within) p.set('posted_within', posted_within);
  if (min_salary) p.set('min_salary', min_salary);
  if (exclude_applied) p.set('exclude_applied', String(exclude_applied));
  if (country) p.set('country', country);
  if (city) p.set('city', city);
  if (category) p.set('category', category);
  if (sort) p.set('sort', sort);
  if (sector) p.set('sector', sector);
  if (type) p.set('type', type);
  // Personalization signals from user profile
  if (user) {
    if (user.currentTitle) p.set('user_title', user.currentTitle);
    if (Array.isArray(user.skills) && user.skills.length) p.set('user_skills', user.skills.slice(0, 5).join(','));
    if (user.city) p.set('user_city', user.city);
    if (user.country) p.set('user_country', user.country);
    if (Array.isArray(user.preferredCities) && user.preferredCities.length) p.set('user_preferred_cities', user.preferredCities.slice(0, 5).join(','));
    if (user.uid) p.set('user_uid', user.uid);
  }
  if (exclude) p.set('exclude', Array.isArray(exclude) ? exclude.join(',') : exclude);
  p.set('page', page);
  p.set('limit', limit);
  const res = await fetch(`${BASE}/api/jobs?${p}`);
  return res.json();
}

export async function fetchJob(slug) {
  const res = await fetch(`${BASE}/api/job/${slug}`);
  return res.json();
}

export async function fetchSuggestions(q, type = 'search') {
  if (!q || q.length < 2) return [];
  const res = await fetch(`${BASE}/api/suggest?q=${encodeURIComponent(q)}&type=${type}`);
  const d = await res.json();
  return d.suggestions || [];
}

export async function fetchHomepage() {
  try {
    const res = await fetch(`${BASE}/homepage-cache.json`);
    return res.json();
  } catch { return { featured: [], latest: [], total: 0, byCountry: [] }; }
}

export async function fetchStats() {
  try {
    const res = await fetch(`${BASE}/api/stats`);
    return res.json();
  } catch { return {}; }
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

// Site has no JSON blog API — scrape /blog. If the listing markup changes, returns [].
export async function fetchBlogPosts(limit = 6) {
  try {
    const res = await fetch(`${BASE}/blog`);
    const html = await res.text();
    const re = /href="\/blog\/([a-z0-9-]+)"[\s\S]*?from-(\w+)-\d+[\s\S]*?>([^<]+?)<\/span>[\s\S]*?<h[23][^>]*>([^<]+?)<\/h[23]>[\s\S]*?line-clamp-2[^>]*>([^<]+?)<\/p>[\s\S]*?<span>([^<]+?)<\/span><span>([^<]+?)<\/span>/g;
    const posts = [];
    const seen = new Set();
    let m;
    while ((m = re.exec(html)) && posts.length < limit) {
      const slug = m[1];
      if (seen.has(slug)) continue;
      seen.add(slug);
      posts.push({
        slug,
        gradient: m[2],
        category: decodeEntities(m[3]).trim(),
        title: decodeEntities(m[4]).trim(),
        excerpt: decodeEntities(m[5]).trim(),
        date: m[6].trim(),
        readTime: m[7].trim(),
      });
    }
    return posts;
  } catch { return []; }
}


// ============ Applications (mirrors website /api/apply) ============
export async function submitApplication({ jobId, userId, coverLetter, idToken }) {
  if (!jobId || !userId) return { error: 'missing_params' };
  if (!idToken) return { error: 'missing_token' };
  try {
    const res = await fetch(`${BASE}/api/apply`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + idToken,
      },
      body: JSON.stringify({ jobId, userId, cover_letter: coverLetter || null }),
    });
    return await res.json();
  } catch (e) {
    return { error: 'network' };
  }
}

export async function getMyApplications(userId) {
  if (!userId) return [];
  try {
    const res = await fetch(`${BASE}/api/apply?userId=${encodeURIComponent(userId)}`);
    const data = await res.json();
    return data.apps || [];
  } catch {
    return [];
  }
}

export async function hasApplied(userId, jobId) {
  if (!userId || !jobId) return false;
  const apps = await getMyApplications(userId);
  return apps.some(a => a.jobId === jobId);
}

export { BASE };
