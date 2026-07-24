import apiClient from '../api/apiClient';

// Cache to prevent duplicate API requests
const cache = {
  data: null,
  timestamp: 0,
};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
const MAX_JOB_AGE_DAYS = 7;

const normalizePostedDate = (value) => {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) {
    if (value.length >= 3) {
      const [year, month, day] = value;
      return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    return '';
  }

  if (typeof value === 'number') {
    const asMs = value > 1e12 ? value : value * 1000;
    return new Date(asMs).toISOString();
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (/^\d+$/.test(trimmed)) {
      const raw = Number(trimmed);
      const asMs = raw > 1e12 ? raw : raw * 1000;
      return new Date(asMs).toISOString();
    }
    return trimmed;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  return String(value);
};

const isWithinLastSevenDays = (value) => {
  const normalized = normalizePostedDate(value);
  if (!normalized) return false;

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return false;

  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - MAX_JOB_AGE_DAYS);
  return parsed >= cutoff && parsed <= now;
};

const isIndiaJob = (job = {}) => {
  const haystack = [
    job.title,
    job.description,
    job.skills,
    job.location,
    job.company,
    job.candidateRequiredLocation
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (!haystack) return false;

  const explicitIndiaIndicators = [
    'india',
    'indian',
    'in ',
    ', in',
    ' in,',
    'remote in india',
    'remote - india',
    'work from india'
  ];

  const explicitForeignCountries = [
    'germany',
    'deutschland',
    'usa',
    'u.s.a',
    'united states',
    'canada',
    'uk',
    'united kingdom',
    'europe',
    'worldwide',
    'global',
    'australia',
    'singapore',
    'dubai',
    'uae'
  ];

  if (explicitIndiaIndicators.some(term => haystack.includes(term))) {
    return true;
  }

  if (explicitForeignCountries.some(term => haystack.includes(term))) {
    return false;
  }

  return true;
};

/**
 * Normalizes, aggregates, and deduplicates jobs from:
 * 1. JSearch (local backend database)
 * 2. Adzuna
 * 3. Remotive
 * 4. Arbeitnow
 */
export const fetchAllJobs = async (searchQuery = '', roleQuery = '', userSkills = []) => {
  // If cache is valid and no query, return cached data
  if (!searchQuery && cache.data && (Date.now() - cache.timestamp < CACHE_DURATION)) {
    return cache.data;
  }

  const adzunaId = import.meta.env.VITE_ADZUNA_APP_ID || '890942e6';
  const adzunaKey = import.meta.env.VITE_ADZUNA_APP_KEY || 'e3a0b0922070228344ee90eb03250288';
  const remotiveUrl = import.meta.env.VITE_REMOTIVE_API_URL || 'https://remotive.com/api/remote-jobs';
  const arbeitnowUrl = import.meta.env.VITE_ARBEITNOW_API_URL || 'https://www.arbeitnow.com/api/job-board-api';

  const skillQuery = Array.isArray(userSkills)
    ? userSkills
        .filter(skill => typeof skill === 'string' && skill.trim())
        .slice(0, 3)
        .join(' ')
    : '';
  const queryStr = searchQuery || roleQuery || skillQuery || 'developer';
  const roleStr = roleQuery || searchQuery || '';
  const roleTerms = roleStr
    .toLowerCase()
    .split(/[\s,/]+/)
    .map(s => s.trim())
    .filter(Boolean);
  const skillTerms = skillQuery
    .toLowerCase()
    .split(/[\s,/]+/)
    .map(s => s.trim())
    .filter(Boolean);
  const matchTerms = [...new Set([...roleTerms, ...skillTerms])];

  const roleMatches = (job) => {
    if (!matchTerms.length) return true;
    const haystack = `${job.title || ''} ${job.description || ''} ${job.skills || ''}`.toLowerCase();
    return matchTerms.some(term => haystack.includes(term));
  };

  // 1. Fetch Local Jobs (which stores and returns JSearch crawled jobs)
  const fetchLocal = async () => {
    try {
      const endpoint = searchQuery || roleQuery ? `/jobs/search?query=${encodeURIComponent(searchQuery || roleQuery)}` : '/jobs';
      const res = await apiClient.get(endpoint);
      return (res.data || [])
        .filter(j => isWithinLastSevenDays(j.postedDate || j.createdAt))
        .filter(j => isIndiaJob({
          title: j.jobTitle || '',
          description: j.description || '',
          skills: j.skillsRequired || '',
          location: j.location || '',
          company: j.companyName || ''
        }))
        .filter(j => roleMatches({
          title: j.jobTitle || '',
          description: j.description || '',
          skills: j.skillsRequired || ''
        }))
        .map(j => ({
        id: j.id,
        jobId: String(j.id || j.jobId),
        title: j.jobTitle || '',
        company: j.companyName || '',
        location: j.location || 'India',
        description: j.description || '',
        employmentType: j.jobType || j.employmentType || 'Full Time',
        salary: j.salary || 'Not Disclosed',
        experience: j.experience || '0 - 3 years',
        skills: j.skillsRequired || '',
        applyUrl: j.jobUrl || '',
        source: j.source || j.jobSource || 'JSearch',
        postedDate: normalizePostedDate(j.postedDate || j.createdAt || ''),
        remote: (j.workMode || '').toLowerCase() === 'remote' || (j.location || '').toLowerCase().includes('remote')
      }));
    } catch (e) {
      console.error("Local JSearch fetch failed:", e);
      return [];
    }
  };

  // 2. Fetch Adzuna Jobs
  const fetchAdzuna = async () => {
    try {
      const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${adzunaId}&app_key=${adzunaKey}&results_per_page=30&what=${encodeURIComponent(queryStr)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Adzuna status ${res.status}`);
      const data = await res.json();
      return (data.results || [])
        .filter(j => isWithinLastSevenDays(j.created || j.created_at || j.job_posted_at_datetime_utc || j.job_posted_at_timestamp))
        .filter(j => isIndiaJob({
          title: j.title || '',
          description: j.description || '',
          location: j.location?.display_name || '',
          company: j.company?.display_name || ''
        }))
        .filter(j => roleMatches({
          title: j.title || '',
          description: j.description || '',
          skills: ''
        }))
        .map(j => ({
        id: `adzuna-${j.id}`,
        jobId: `adzuna-${j.id}`,
        title: j.title || '',
        company: j.company?.display_name || '',
        location: j.location?.display_name || 'India',
        description: j.description || '',
        employmentType: j.contract_time === 'full_time' ? 'Full Time' : (j.contract_time || 'Full Time'),
        salary: j.salary_min && j.salary_max ? `₹${j.salary_min.toLocaleString()} - ₹${j.salary_max.toLocaleString()} / yr` : 'Not Disclosed',
        experience: j.description.toLowerCase().includes('senior') ? '5+ years' : '0 - 3 years',
        skills: '',
        applyUrl: j.redirect_url || '',
        source: 'Adzuna',
        postedDate: normalizePostedDate(j.created || j.created_at || j.job_posted_at_datetime_utc || j.job_posted_at_timestamp || ''),
        remote: j.description.toLowerCase().includes('remote') || j.location?.display_name.toLowerCase().includes('remote')
      }));
    } catch (e) {
      console.error("Adzuna fetch failed:", e);
      return [];
    }
  };

  // 3. Fetch Remotive Jobs
  const fetchRemotive = async () => {
    try {
      const url = `${remotiveUrl}?limit=30&search=${encodeURIComponent(queryStr)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Remotive status ${res.status}`);
      const data = await res.json();
      return (data.jobs || [])
        .filter(j => isWithinLastSevenDays(j.publication_date))
        .filter(j => isIndiaJob({
          title: j.title || '',
          description: j.description || '',
          location: j.candidate_required_location || '',
          company: j.company_name || ''
        }))
        .filter(j => roleMatches({
          title: j.title || '',
          description: j.description || '',
          skills: (j.tags || []).join(', ')
        }))
        .map(j => ({
        id: `remotive-${j.id}`,
        jobId: `remotive-${j.id}`,
        title: j.title || '',
        company: j.company_name || '',
        location: j.candidate_required_location || 'Remote',
        description: j.description || '',
        employmentType: j.job_type === 'full_time' ? 'Full Time' : (j.job_type || 'Full Time'),
        salary: j.salary || 'Not Disclosed',
        experience: j.description.toLowerCase().includes('senior') ? '5+ years' : '0 - 3 years',
        skills: (j.tags || []).join(', '),
        applyUrl: j.url || '',
        source: 'Remotive',
        postedDate: normalizePostedDate(j.publication_date || ''),
        remote: true
      }));
    } catch (e) {
      console.error("Remotive fetch failed:", e);
      return [];
    }
  };

  // 4. Fetch Arbeitnow Jobs
  const fetchArbeitnow = async () => {
    try {
      const res = await fetch(arbeitnowUrl);
      if (!res.ok) throw new Error(`Arbeitnow status ${res.status}`);
      const data = await res.json();
      const rawJobs = data.data || [];
      
      const mapped = rawJobs
        .filter(j => isWithinLastSevenDays(j.created_at || j.date || j.posted_at))
        .filter(j => isIndiaJob({
          title: j.title || '',
          description: j.description || '',
          location: j.location || '',
          company: j.company_name || ''
        }))
        .filter(j => roleMatches({
          title: j.title || '',
          description: j.description || '',
          skills: (j.tags || []).join(', ')
        }))
        .map(j => ({
        id: `arbeitnow-${j.slug}`,
        jobId: `arbeitnow-${j.slug}`,
        title: j.title || '',
        company: j.company_name || '',
        location: j.location || 'Germany',
        description: j.description || '',
        employmentType: (j.job_types || []).includes('full-time') ? 'Full Time' : 'Full Time',
        salary: 'Not Disclosed',
        experience: j.description.toLowerCase().includes('senior') ? '5+ years' : '0 - 3 years',
        skills: (j.tags || []).join(', '),
        applyUrl: j.url || '',
        source: 'Arbeitnow',
        postedDate: normalizePostedDate(j.created_at || j.date || j.posted_at || ''),
        remote: j.remote || j.description.toLowerCase().includes('remote')
      }));

      if (searchQuery || roleQuery) {
        const q = (searchQuery || roleQuery).toLowerCase();
        return mapped.filter(j => 
          j.title.toLowerCase().includes(q) || 
          j.company.toLowerCase().includes(q) || 
          j.description.toLowerCase().includes(q)
        );
      }
      return mapped;
    } catch (e) {
      console.error("Arbeitnow fetch failed:", e);
      return [];
    }
  };

  // Fetch all in parallel using Promise.all
  const results = await Promise.all([
    fetchLocal(),
    fetchAdzuna(),
    fetchRemotive(),
    fetchArbeitnow()
  ]);

  // Combine results
  const allJobs = [...results[0], ...results[1], ...results[2], ...results[3]];

  // Deduplicate jobs using: company + title + location
  const seenKeys = new Set();
  const uniqueJobs = [];

  allJobs.forEach(job => {
    const cleanCompany = (job.company || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const cleanTitle = (job.title || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const cleanLocation = (job.location || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const key = `${cleanCompany}-${cleanTitle}-${cleanLocation}`;

    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueJobs.push(job);
    }
  });

  // Cache only non-search results
  if (!searchQuery) {
    cache.data = uniqueJobs;
    cache.timestamp = Date.now();
  }

  return uniqueJobs;
};

/**
 * Fresher Friendly Detection
 * Keywords: Intern, Internship, Trainee, Graduate, Associate, Junior, Entry Level, Campus, Fresher, Experience <= 1 year
 */
export const isFresherFriendly = (job) => {
  const title = (job.title || '').toLowerCase();
  const desc = (job.description || '').toLowerCase();
  const exp = (job.experience || '').toLowerCase();

  const fresherKeywords = [
    'intern', 'internship', 'trainee', 'graduate', 'associate', 
    'junior', 'entry level', 'campus', 'fresher'
  ];

  const hasKeyword = fresherKeywords.some(kw => 
    title.includes(kw) || desc.includes(` ${kw} `) || desc.includes(` ${kw},`) || desc.includes(` ${kw}.`)
  );

  let isExpFriendly = false;
  if (exp) {
    if (exp.includes('0') || exp.includes('1') || exp.includes('fresher') || exp.includes('no experience')) {
      isExpFriendly = true;
    }
    const match = exp.match(/(\d+)\s*(?:-|to)?\s*(\d+)?\s*year/);
    if (match) {
      const minExp = parseInt(match[1]);
      if (minExp <= 1) {
        isExpFriendly = true;
      }
    }
  }

  return hasKeyword || isExpFriendly;
};

/**
 * Startup Detection
 * Remotive, Arbeitnow, Small companies, Remote-first companies
 */
export const isStartupJob = (job) => {
  const source = (job.source || '').toLowerCase();
  const desc = (job.description || '').toLowerCase();

  if (source === 'remotive' || source === 'arbeitnow') {
    return true;
  }

  if (job.remote && (desc.includes('remote-first') || desc.includes('remote first') || desc.includes('fully remote'))) {
    return true;
  }

  const startupKeywords = [
    'startup', 'early stage', 'early-stage', 'seed stage', 'seed-stage', 
    'series a', 'fast-growing team', 'small team', 'founding engineer'
  ];

  return startupKeywords.some(kw => desc.includes(kw));
};
