import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllJobs, isFresherFriendly, isStartupJob } from '../../services/jobDiscoveryService';
import { getExtractedSkills } from '../../services/skillExtractionService';
import { saveJob } from '../../services/jobDetailsService';
import JobCard from '../../components/JobCard';

const JobList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [selectedJobDetails, setSelectedJobDetails] = useState(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [savedJobs, setSavedJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [error, setError] = useState('');
  const [userSkills, setUserSkills] = useState([]);
  
  const [userMeta, setUserMeta] = useState({
    fullName: 'Samantha Taylor',
    email: 'samantha.taylor@example.com',
  });

  // Filters State
  const [filters, setFilters] = useState({
    location: '',
    company: '',
    jobType: '',
    workMode: '',
    companyType: '',
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 4;

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserMeta({
          fullName: parsed.fullName || 'User Profile',
          email: parsed.email || 'user@example.com',
        });
      } catch (e) {
        console.warn('Could not parse user metadata from localStorage');
      }
    }

    loadJobsAndSkills();
  }, []);

  const loadJobsAndSkills = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch user resume skills for dynamic matching
      let skills = [];
      try {
        const skillsData = await getExtractedSkills();
        skills = skillsData.skills || [];
        setUserSkills(skills);
      } catch (sErr) {
        console.warn('Could not fetch extracted profile skills for ATS matching');
      }

      // 2. Fetch jobs from all sources (local database/JSearch, Adzuna, Remotive, Arbeitnow) in parallel
      const data = await fetchAllJobs();

      // 3. Calculate dynamic match score for every job based on actual skills
      const processed = data.map(job => {
        const score = calculateMatchScore(skills, job.description, job.skills);
        return {
          ...job,
          matchPercentage: score
        };
      });

      setJobs(processed);
    } catch (err) {
      setError('Failed to fetch job opportunities from discovery engines.');
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    await loadJobsAndSkills();
  };

  // Helper for dynamic skill matching
  const calculateMatchScore = (userSkillsList, jobDesc, jobSkills) => {
    if (!userSkillsList || userSkillsList.length === 0) return 0;
    
    const descText = (jobDesc || '').toLowerCase();
    const skillsText = (jobSkills || '').toLowerCase();
    
    const matched = [];
    const requiredList = skillsText ? skillsText.split(',').map(s => s.trim().toLowerCase()) : [];
    
    userSkillsList.forEach(skill => {
      const sLower = skill.toLowerCase();
      const isRequired = requiredList.some(req => req === sLower || req.includes(sLower));
      const inDesc = descText.includes(` ${sLower} `) || descText.includes(` ${sLower},`) || descText.includes(` ${sLower}.`) || descText.includes(sLower);
      
      if (isRequired || inDesc) {
        matched.push(skill);
      }
    });

    if (requiredList.length > 0) {
      const matchedRequired = requiredList.filter(req => 
        userSkillsList.some(us => us.toLowerCase() === req || req.includes(us.toLowerCase()))
      );
      const requiredMatchPct = (matchedRequired.length / requiredList.length) * 100;
      const otherMatches = matched.length - matchedRequired.length;
      return Math.min(100, Math.round(requiredMatchPct + (otherMatches * 5)));
    } else {
      return Math.min(100, Math.round((matched.length / 5) * 100));
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setCurrentPage(1);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const resetAllFilters = () => {
    setFilters({
      location: '',
      company: '',
      jobType: '',
      workMode: '',
      companyType: '',
    });
    setCurrentPage(1);
  };

  const handleViewDetails = (job) => {
    const mappedJob = {
      jobId: String(job.jobId),
      jobTitle: job.title || '',
      companyName: job.company || '',
      location: job.location || 'India',
      description: job.description || '',
      employmentType: job.employmentType || 'Full Time',
      jobType: job.employmentType || 'Full Time',
      salary: job.salary || 'Not Disclosed',
      experience: job.experience || '0 - 3 years',
      skillsRequired: job.skills || '',
      jobUrl: job.applyUrl || '',
      source: job.source || 'Unknown',
      jobSource: job.source || 'Unknown',
      postedDate: job.postedDate ? job.postedDate.split('T')[0] : new Date().toISOString().split('T')[0],
      workMode: job.remote ? 'Remote' : 'Onsite',
      companyLogo: job.companyLogo || ''
    };

    saveJob(mappedJob).catch(err => {
      console.warn("Background external job save failed:", err);
    });

    navigate(`/jobs/${job.jobId}`, { state: { job } });
  };

  const toggleSaveJob = (id) => {
    if (savedJobs.includes(id)) {
      setSavedJobs(savedJobs.filter(item => item !== id));
    } else {
      setSavedJobs([...savedJobs, id]);
    }
  };

  const triggerApply = (job) => {
    if (appliedJobs.includes(job.jobId)) return;
    setAppliedJobs([...appliedJobs, job.jobId]);
    alert(`Applying for ${job.title} at ${job.company}. You will be redirected to the job application page.`);
    if (job.applyUrl) {
      window.open(job.applyUrl, '_blank');
    }
  };

  const parseSalaryAmount = (salaryStr) => {
    if (!salaryStr) return 0;
    const clean = salaryStr.replace(/[^0-9]/g, '');
    const num = parseInt(clean, 10);
    return isNaN(num) ? 0 : num;
  };

  const getMatchingSkills = (job) => {
    if (!userSkills || userSkills.length === 0) return { matched: [], missing: [] };
    const descText = (job.description || '').toLowerCase();
    const skillsText = (job.skills || '').toLowerCase();
    
    const matched = [];
    const missing = [];
    
    userSkills.forEach(skill => {
      const sLower = skill.toLowerCase();
      const inDesc = descText.includes(` ${sLower} `) || descText.includes(` ${sLower},`) || descText.includes(` ${sLower}.`) || descText.includes(sLower);
      const inSkills = skillsText.includes(sLower);
      
      if (inDesc || inSkills) {
        matched.push(skill);
      }
    });

    if (skillsText) {
      const reqList = skillsText.split(',').map(s => s.trim());
      reqList.forEach(req => {
        const isMatched = userSkills.some(us => us.toLowerCase() === req.toLowerCase() || req.toLowerCase().includes(us.toLowerCase()));
        if (!isMatched && req) {
          missing.push(req);
        }
      });
    }

    return { matched, missing };
  };

  const getJobWorkMode = (job) => {
    const mode = (job.workMode || '').toLowerCase();
    const loc = (job.location || '').toLowerCase();
    if (mode === 'remote' || job.remote === true || loc.includes('remote')) {
      return 'Remote';
    }
    if (mode === 'hybrid' || loc.includes('hybrid')) {
      return 'Hybrid';
    }
    return 'On-site';
  };

  const getJobCompanyType = (job) => {
    return isStartupJob(job) ? 'Startup' : 'MNC';
  };

  const getUniqueJobTypes = () => {
    return [...new Set(jobs.map(j => j.employmentType || j.jobType).filter(Boolean))].sort();
  };

  const getUniqueWorkModes = () => {
    return [...new Set(jobs.map(getJobWorkMode))].sort();
  };

  const getUniqueCompanyTypes = () => {
    return [...new Set(jobs.map(getJobCompanyType))].sort();
  };

  // Dynamic filter and sorting pipeline
  const getFilteredAndSortedJobs = () => {
    let result = [...jobs];

    // 1. Filter by Location (Substring check, case-insensitive)
    if (filters.location.trim()) {
      const q = filters.location.toLowerCase().trim();
      result = result.filter(j => j.location && j.location.toLowerCase().includes(q));
    }

    // 2. Filter by Company (Substring check, case-insensitive)
    if (filters.company.trim()) {
      const q = filters.company.toLowerCase().trim();
      result = result.filter(j => j.company && j.company.toLowerCase().includes(q));
    }

    // 3. Filter by Job Type (Internship, Full Time, etc.)
    if (filters.jobType) {
      result = result.filter(j => (j.employmentType || j.jobType) === filters.jobType);
    }

    // 4. Filter by Work Mode
    if (filters.workMode) {
      result = result.filter(j => getJobWorkMode(j) === filters.workMode);
    }

    // 5. Filter by Company Type
    if (filters.companyType) {
      result = result.filter(j => getJobCompanyType(j) === filters.companyType);
    }

    // Default sorting (by postedDate descending, fallback match percentage)
    result.sort((a, b) => {
      const dateA = new Date(a.postedDate || 0);
      const dateB = new Date(b.postedDate || 0);
      if (dateB - dateA !== 0) return dateB - dateA;
      return (b.matchPercentage || 0) - (a.matchPercentage || 0);
    });

    return result;
  };

  const filteredJobs = getFilteredAndSortedJobs();

  // Pagination Logic
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

  return (
    <div className="flex flex-col w-full max-w-full min-h-screen bg-slate-50">
      
      {/* Sub Header for Page Context */}
      <div className="border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between shadow-sm select-none shrink-0">
        <div>
          <h1 className="text-xl font-black text-slate-900">Explore Jobs</h1>
        </div>
      </div>

      {/* Sleek Horizontal Filter Bar */}
      <div className="bg-white border-b border-slate-200 p-6 shadow-sm select-none shrink-0">
        <form onSubmit={handleSearchSubmit} className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            
            {/* Location Input */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">📍</span>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                placeholder="Location"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8.5 pr-3.5 py-2.5 text-xs font-bold focus:border-violet-500 focus:bg-white focus:outline-none transition text-slate-700 placeholder-slate-400"
              />
            </div>

            {/* Company Input */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🏢</span>
              <input
                type="text"
                value={filters.company}
                onChange={(e) => handleFilterChange('company', e.target.value)}
                placeholder="Company"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8.5 pr-3.5 py-2.5 text-xs font-bold focus:border-violet-500 focus:bg-white focus:outline-none transition text-slate-700 placeholder-slate-400"
              />
            </div>

            {/* Job Type Selector */}
            <div className="relative">
              <select
                value={filters.jobType}
                onChange={(e) => handleFilterChange('jobType', e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:border-violet-500 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="">Job Type ▼</option>
                {getUniqueJobTypes().map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Work Mode Selector */}
            <div className="relative">
              <select
                value={filters.workMode}
                onChange={(e) => handleFilterChange('workMode', e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:border-violet-500 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="">Work Mode ▼</option>
                {getUniqueWorkModes().map(mode => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </div>

            {/* Company Type Selector */}
            <div className="relative">
              <select
                value={filters.companyType}
                onChange={(e) => handleFilterChange('companyType', e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:border-violet-500 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="">Company Type ▼</option>
                {getUniqueCompanyTypes().map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-100 transition cursor-pointer text-center"
            >
              Search
            </button>

            {/* Clear All Button */}
            <button
              type="button"
              onClick={resetAllFilters}
              className="w-full rounded-xl border border-slate-250 bg-white hover:bg-slate-50 text-slate-600 px-4 py-2.5 text-xs font-bold transition cursor-pointer text-center"
            >
              Clear All
            </button>

          </div>
        </form>
      </div>

      {/* Main Content Layout */}
      <div className="p-6 md:p-8 max-w-[1350px] mx-auto w-full space-y-6 flex-1 flex flex-col gap-6 items-stretch">
        
        {/* Jobs List Area */}
        <div className="w-full space-y-6 flex flex-col justify-between">

          {error && (
            <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700 shadow-sm shrink-0">
              ⚠️ {error}
            </div>
          )}

          {loading ? (
            <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 w-full">
              <div className="h-10 w-10 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin"></div>
              <p className="text-sm font-semibold text-slate-500">Querying matched opportunities...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-12 text-center shadow-lg shadow-slate-100/50 flex flex-col items-center justify-center gap-4 w-full my-6">
              <div className="h-16 w-16 rounded-full bg-violet-50 flex items-center justify-center text-violet-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
                </svg>
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-xl font-black text-slate-900">No Jobs Match Filters</h4>
                <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                  We couldn't find any job openings matching your search criteria. Try modifying your filters or search keywords.
                </p>
              </div>
              <button
                onClick={resetAllFilters}
                className="rounded-full bg-violet-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-100 hover:bg-violet-700 cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4 w-full">
              {currentJobs.map((job) => (
                <JobCard
                  key={job.jobId}
                  job={job}
                  savedJobs={savedJobs}
                  appliedJobs={appliedJobs}
                  toggleSaveJob={toggleSaveJob}
                  handleViewDetails={handleViewDetails}
                  triggerApply={triggerApply}
                  getMatchingSkills={getMatchingSkills}
                />
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6 shrink-0">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 disabled:opacity-40 cursor-pointer"
                  >
                    ←
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold text-xs transition cursor-pointer ${
                        currentPage === i + 1
                          ? 'bg-violet-600 text-white shadow-md'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 disabled:opacity-40 cursor-pointer"
                  >
                    →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* DETAILED VIEW MODAL DRAWER */}
      {viewDetailsOpen && selectedJobDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col justify-between animate-slideLeft">
            
            {/* Drawer Header */}
            <div className="border-b border-slate-200 p-6 flex items-start justify-between bg-slate-50">
              <div className="flex items-start gap-4">
                <div className="relative h-14 w-14 shrink-0 select-none">
                  <div className="absolute inset-0 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white font-black text-xl shadow-md">
                    {(selectedJobDetails.company || 'J').substring(0, 1).toUpperCase()}
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-950 leading-tight">{selectedJobDetails.title}</h3>
                  <p className="text-sm font-bold text-slate-600">{selectedJobDetails.company}</p>
                  <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-black text-violet-700 uppercase tracking-wider font-mono">
                    {selectedJobDetails.source} Source
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewDetailsOpen(false)}
                className="rounded-full hover:bg-slate-200 p-1.5 transition text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer Body Scroll */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              
              {/* Job Metadata Grids */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-slate-150 p-4 text-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Location</span>
                  <p className="text-xs font-bold text-slate-800 mt-1 truncate">{selectedJobDetails.location}</p>
                </div>
                <div className="rounded-2xl border border-slate-150 p-4 text-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Experience</span>
                  <p className="text-xs font-bold text-slate-800 mt-1 truncate">{selectedJobDetails.experience || 'Not Available'}</p>
                </div>
                <div className="rounded-2xl border border-slate-150 p-4 text-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Work Mode</span>
                  <p className="text-xs font-bold text-slate-800 mt-1 truncate">{selectedJobDetails.remote ? 'Remote' : 'Onsite/Hybrid'}</p>
                </div>
                <div className="rounded-2xl border border-slate-150 p-4 text-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Job Type</span>
                  <p className="text-xs font-bold text-slate-800 mt-1 truncate">{selectedJobDetails.employmentType || 'Full Time'}</p>
                </div>
              </div>

              {/* Salary details */}
              <div className="rounded-3xl border border-violet-100 bg-violet-50/20 p-5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-violet-400 uppercase tracking-wider">Compensation Range</span>
                  <p className="text-lg font-black text-violet-700 mt-0.5">{selectedJobDetails.salary}</p>
                </div>
                <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700 uppercase font-mono">
                  {selectedJobDetails.source}
                </span>
              </div>

              {/* Match Score & Skills Match Breakdown */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Profile Match Metrics</h4>
                <div className="flex items-center gap-4">
                  <span className="inline-flex rounded-full px-3.5 py-1.5 text-xs font-black border uppercase tracking-wider bg-slate-900 text-white border-slate-950 font-mono">
                    {selectedJobDetails.matchPercentage || 0}% Match Score
                  </span>
                </div>
                <div className="space-y-3 pt-2">
                  {getMatchingSkills(selectedJobDetails).matched.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase text-emerald-600 tracking-wider">Matching Skills in your resume:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {getMatchingSkills(selectedJobDetails).matched.map((s, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-100/50">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {getMatchingSkills(selectedJobDetails).missing.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase text-amber-500 tracking-wider">Missing Skills to acquire:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {getMatchingSkills(selectedJobDetails).missing.map((s, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-600 font-bold text-[10px] border border-amber-100/50">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills list */}
              {selectedJobDetails.skills && (
                <div className="space-y-2.5">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Skills Required</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedJobDetails.skills.split(',').map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center rounded-2xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600"
                      >
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="space-y-2.5">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Role Description</h4>
                <p className="text-sm font-medium leading-relaxed text-slate-600 whitespace-pre-line">
                  {selectedJobDetails.description}
                </p>
              </div>

            </div>

            {/* Drawer Actions Footer */}
            <div className="border-t border-slate-200 p-6 flex items-center justify-between bg-slate-50 shrink-0">
              <button
                onClick={() => toggleSaveJob(selectedJobDetails.jobId)}
                className={`flex h-12 rounded-2xl border px-6 items-center justify-center gap-2 font-bold text-sm transition cursor-pointer ${
                  savedJobs.includes(selectedJobDetails.jobId)
                    ? 'border-amber-200 bg-amber-50 text-amber-600 shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill={savedJobs.includes(selectedJobDetails.jobId) ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                </svg>
                {savedJobs.includes(selectedJobDetails.jobId) ? 'Saved' : 'Save Opportunity'}
              </button>

              <button
                onClick={() => triggerApply(selectedJobDetails)}
                className={`rounded-2xl px-8 py-3.5 text-sm font-bold text-white shadow-md transition cursor-pointer ${
                  appliedJobs.includes(selectedJobDetails.jobId)
                    ? 'bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700'
                    : 'bg-violet-600 shadow-violet-100 hover:bg-violet-700'
                }`}
              >
                {appliedJobs.includes(selectedJobDetails.jobId) ? 'Applied' : 'Apply Opportunity'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default JobList;
