import apiClient from '../api/apiClient';

// Cache to prevent duplicate API requests
const cache = {
  data: null,
  timestamp: 0,
};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

/**
 * Normalizes, aggregates, and deduplicates jobs from:
 * 1. JSearch (local backend database)
 * 2. Adzuna
 * 3. Remotive
 * 4. Arbeitnow
 */
export const fetchAllJobs = async (searchQuery = '') => {
  // If cache is valid and no query, return cached data
  if (!searchQuery && cache.data && (Date.now() - cache.timestamp < CACHE_DURATION)) {
    return cache.data;
  }

  const adzunaId = import.meta.env.VITE_ADZUNA_APP_ID || '890942e6';
  const adzunaKey = import.meta.env.VITE_ADZUNA_APP_KEY || 'e3a0b0922070228344ee90eb03250288';
  const remotiveUrl = import.meta.env.VITE_REMOTIVE_API_URL || 'https://remotive.com/api/remote-jobs';
  const arbeitnowUrl = import.meta.env.VITE_ARBEITNOW_API_URL || 'https://www.arbeitnow.com/api/job-board-api';

  const queryStr = searchQuery || 'developer';

  // 1. Fetch Local Jobs (which stores and returns JSearch crawled jobs)
  const fetchLocal = async () => {
    try {
      const res = await apiClient.get(searchQuery ? `/jobs/search?query=${encodeURIComponent(searchQuery)}` : '/jobs');
      return (res.data || []).map(j => ({
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
        postedDate: j.postedDate || j.createdAt || '',
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
      return (data.results || []).map(j => ({
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
        postedDate: j.created || '',
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
      return (data.jobs || []).map(j => ({
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
        postedDate: j.publication_date || '',
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
      
      const mapped = rawJobs.map(j => ({
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
        postedDate: j.created_at || '',
        remote: j.remote || j.description.toLowerCase().includes('remote')
      }));

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
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
