import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTodayJobs } from '../../services/jobService';

const TodayDigest = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [error, setError] = useState('');
  
  // Filter Fields
  const [locationFilter, setLocationFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [workModeFilter, setWorkModeFilter] = useState('All');

  const [userMeta, setUserMeta] = useState({
    fullName: 'Samantha Taylor',
    email: 'samantha.taylor@example.com',
  });

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

    loadTodayJobs();
  }, []);

  const loadTodayJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getTodayJobs();
      setJobs(data);
      setFilteredJobs(data);
    } catch (err) {
      setError('Failed to fetch today\'s digest data.');
    } finally {
      setLoading(false);
    }
  };

  // Perform Client-side Dynamic Filtering on Today's Jobs List
  useEffect(() => {
    let result = jobs;

    if (locationFilter.trim()) {
      result = result.filter(j => j.location && j.location.toLowerCase().includes(locationFilter.toLowerCase().trim()));
    }

    if (roleFilter.trim()) {
      result = result.filter(j => j.jobTitle && j.jobTitle.toLowerCase().includes(roleFilter.toLowerCase().trim()));
    }

    if (workModeFilter !== 'All') {
      result = result.filter(j => j.workMode && j.workMode.toLowerCase() === workModeFilter.toLowerCase());
    }

    setFilteredJobs(result);
  }, [locationFilter, roleFilter, workModeFilter, jobs]);

  // Helper to determine if a job was posted today or yesterday
  const getPostedBadge = (postedDateStr) => {
    if (!postedDateStr) return "Posted Today";
    try {
      // In case it's an array from Jackson serialized LocalDates
      if (Array.isArray(postedDateStr)) {
        const [year, month, day] = postedDateStr;
        const pad = (num) => String(num).padStart(2, '0');
        postedDateStr = `${year}-${pad(month)}-${pad(day)}`;
      }
      
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const checkDateStr = typeof postedDateStr === 'string' ? postedDateStr.substring(0, 10) : '';
      
      if (checkDateStr === todayStr) {
        return "Posted Today";
      } else if (checkDateStr === yesterdayStr) {
        return "Posted Yesterday";
      }
    } catch (e) {
      console.warn('Error parsing postedDate:', e);
    }
    return "Recently Posted";
  };

  // Helper to dynamically style the badges
  const getBadgeStyle = (badgeText) => {
    if (badgeText === "Posted Today") {
      return "bg-emerald-50 text-emerald-700 border-emerald-100 animate-pulse";
    } else if (badgeText === "Posted Yesterday") {
      return "bg-blue-50 text-blue-700 border-blue-100";
    }
    return "bg-slate-50 text-slate-700 border-slate-100";
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto w-full space-y-8">
      
      {/* Sub Header for Page Context with Back Button */}
      <div className="border-b border-slate-200 bg-white pb-5 flex items-center justify-between shadow-xs select-none">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/jobs')} 
            className="rounded-full border border-slate-200 bg-white p-2 text-slate-400 hover:text-slate-800 transition cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900">Daily Job Digest</h1>
          </div>
        </div>
      </div>
          
      {/* Header Description */}
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Daily Job Digest</h2>
        <p className="text-sm font-medium text-slate-500">
          Fresh jobs posted today and yesterday from integrated live sources, automatically matched against your skills.
        </p>
      </div>

      {/* Quick Filters Area */}
      <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100 flex flex-col md:flex-row gap-4 items-center shrink-0">
        <div className="w-full md:w-1/3 space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Location</label>
          <input
            type="text"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            placeholder="Filter by location..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold focus:border-violet-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="w-full md:w-1/3 space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Role / Keyword</label>
          <input
            type="text"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            placeholder="Filter by job title..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold focus:border-violet-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="w-full md:w-1/3 space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Work Mode</label>
          <select
            value={workModeFilter}
            onChange={(e) => setWorkModeFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold focus:border-violet-500 focus:bg-white focus:outline-none"
          >
            <option value="All">All Modes</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Onsite">Onsite</option>
          </select>
        </div>
      </div>

      {/* Job Digest Cards Grid */}
      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700 shadow-sm">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="min-h-[30vh] flex flex-col items-center justify-center gap-4 w-full">
          <div className="h-10 w-10 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Querying Daily Digest...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="rounded-[2.5rem] border border-slate-200 bg-white p-12 text-center shadow-lg shadow-slate-100/50 flex flex-col items-center justify-center gap-4 w-full">
          <div className="h-16 w-16 rounded-full bg-fuchsia-50 flex items-center justify-center text-fuchsia-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h4 className="text-xl font-black text-slate-900">No Fresh Postings Yet</h4>
            <p className="text-xs font-semibold text-slate-400 leading-relaxed max-w-sm mx-auto">
              We couldn't locate any jobs posted today or yesterday matching your filter selections. Check back later or explore the main Jobs tab!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full pb-8">
          {filteredJobs.map((job) => {
            const matchVal = job.matchPercentage || 0;
            const badgeText = getPostedBadge(job.postedDate);
            return (
              <div
                key={job.id}
                className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-md shadow-slate-100/30 flex flex-col justify-between gap-6 hover:scale-[1.01] hover:border-violet-200 transition"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider border ${getBadgeStyle(badgeText)}`}>
                      {badgeText}
                    </span>
                    <span className="inline-flex rounded-full bg-violet-50 px-2.5 py-0.5 text-[9px] font-black text-violet-700 uppercase tracking-wider border border-violet-100">
                      {job.source || job.jobSource || 'JSearch'}
                    </span>
                  </div>

                  <div className="flex items-start gap-4">
                    {/* Render Company Logo with Letter Fallback */}
                    <div className="relative h-12 w-12 shrink-0 select-none">
                      {job.companyLogo ? (
                        <img
                          src={job.companyLogo}
                          alt={`${job.companyName} Logo`}
                          className="h-12 w-12 object-contain rounded-2xl bg-slate-50 border border-slate-100 p-1 shrink-0 shadow-sm"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="absolute inset-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white font-black text-lg shadow-md"
                        style={{ display: job.companyLogo ? 'none' : 'flex' }}
                      >
                        {job.companyName.substring(0, 1)}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-slate-950 text-base leading-snug">{job.jobTitle}</h3>
                      <p className="text-xs text-slate-500 font-bold">{job.companyName}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400 font-semibold pt-2 border-t border-slate-100">
                    <span>📍 {job.location}</span>
                    <span>•</span>
                    <span>💼 {job.workMode}</span>
                    <span>•</span>
                    <span>💰 {job.salary}</span>
                    {matchVal > 0 && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-violet-600 font-bold">{matchVal}% Match</span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  className="w-full rounded-2xl border border-violet-200 bg-violet-50/50 py-3.5 text-xs font-bold text-violet-600 hover:bg-violet-100/70 transition cursor-pointer"
                >
                  View Details
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TodayDigest;
