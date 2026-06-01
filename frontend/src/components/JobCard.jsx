import React from 'react';
import { isStartupJob, isFresherFriendly } from '../services/jobDiscoveryService';

const JobCard = ({
  job,
  savedJobs = [],
  appliedJobs = [],
  toggleSaveJob,
  handleViewDetails,
  triggerApply,
  getMatchingSkills
}) => {
  // Generate stable id from source + company + title if jobId is missing or invalid
  const isOriginalIdMissing = !job.jobId || String(job.jobId).trim() === '' || String(job.jobId) === 'undefined' || String(job.jobId) === 'null';
  
  const generatedId = `${job.source || 'Unknown'}-${job.company || ''}-${job.title || ''}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  const stableJobId = isOriginalIdMissing ? generatedId : String(job.jobId);
  const detailsUrl = `/jobs/${stableJobId}`;

  // Check if applyUrl is missing or invalid
  const isApplyUrlMissing = !job.applyUrl || String(job.applyUrl).trim() === '' || String(job.applyUrl) === 'undefined' || String(job.applyUrl) === 'null';

  // Log required audit parameters for every job card rendered
  console.log(`[JobCard Audit] jobId: ${stableJobId} | title: ${job.title} | company: ${job.company} | source: ${job.source} | applyUrl: ${isApplyUrlMissing ? 'MISSING' : job.applyUrl} | detailsUrl: ${detailsUrl}`);

  const stableJob = {
    ...job,
    jobId: stableJobId,
    applyUrl: isApplyUrlMissing ? '' : job.applyUrl
  };

  const matchVal = stableJob.matchPercentage || 0;
  const isHighMatch = matchVal >= 70;
  const { matched = [], missing = [] } = getMatchingSkills ? getMatchingSkills(stableJob) : { matched: [], missing: [] };

  // Strict property fallbacks to prevent null/undefined leak in UI
  const jobTitle = stableJob.title && String(stableJob.title).trim() !== '' && String(stableJob.title) !== 'null' && String(stableJob.title) !== 'undefined'
    ? stableJob.title
    : 'Role Not Specified';

  const companyName = stableJob.company && String(stableJob.company).trim() !== '' && String(stableJob.company) !== 'null' && String(stableJob.company) !== 'undefined'
    ? stableJob.company
    : 'Company Not Specified';

  const locationText = stableJob.location && String(stableJob.location).trim() !== '' && String(stableJob.location) !== 'null' && String(stableJob.location) !== 'undefined'
    ? stableJob.location
    : (stableJob.remote ? 'Remote' : 'Location Not Specified');

  const experienceText = stableJob.experience && String(stableJob.experience).trim() !== '' && String(stableJob.experience) !== 'null' && String(stableJob.experience) !== 'undefined'
    ? stableJob.experience
    : 'Experience Not Specified';

  const salaryText = stableJob.salary && String(stableJob.salary).trim() !== '' && String(stableJob.salary) !== 'null' && String(stableJob.salary) !== 'undefined'
    ? stableJob.salary
    : 'Salary Not Disclosed';

  const sourceName = stableJob.source && String(stableJob.source).trim() !== '' && String(stableJob.source) !== 'null' && String(stableJob.source) !== 'undefined'
    ? stableJob.source
    : 'Unknown';

  const isDateValid = stableJob.postedDate && String(stableJob.postedDate).trim() !== '' && String(stableJob.postedDate) !== 'null' && String(stableJob.postedDate) !== 'undefined';
  const postedDateText = isDateValid
    ? new Date(stableJob.postedDate).toLocaleDateString()
    : 'Recently Posted';

  return (
    <div
      className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-md shadow-slate-100/30 hover:border-violet-300 hover:shadow-lg transition duration-200 flex flex-col lg:flex-row justify-between items-stretch gap-6 animate-fadeIn"
    >
      {/* Left Column: Job Info & Skills */}
      <div className="flex-1 min-w-0 flex flex-col justify-between space-y-4">
        <div className="space-y-4">
          {/* Header Info Section */}
          <div className="flex items-start gap-4">
            {/* Company Logo fallback */}
            <div className="relative h-12 w-12 shrink-0 select-none">
              <div className="absolute inset-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white font-black text-lg shadow-md">
                {companyName.substring(0, 1).toUpperCase()}
              </div>
            </div>
            
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h4 className="font-extrabold text-slate-900 text-base truncate" title={jobTitle}>{jobTitle}</h4>
                
                {/* Source Badge */}
                <span className="inline-flex rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wider bg-violet-50 text-violet-700 border border-violet-100 font-mono">
                  {sourceName}
                </span>
                
                {/* Remote Badge */}
                {stableJob.remote && (
                  <span className="inline-flex rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-100 font-mono">
                    Remote
                  </span>
                )}

                {/* Startup Badge */}
                {isStartupJob(stableJob) && (
                  <span className="inline-flex rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wider bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100 font-mono">
                    Startup
                  </span>
                )}

                {/* Fresher Friendly Badge */}
                {isFresherFriendly(stableJob) && (
                  <span className="inline-flex rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 font-mono">
                    Fresher Friendly
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-bold">{companyName}</p>
              
              {/* Metadata Details */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-semibold pt-1">
                <span>📍 {locationText}</span>
                <span>💼 {experienceText}</span>
                <span>💰 {salaryText}</span>
                <span>•</span>
                <span>💼 {stableJob.employmentType || 'Full Time'}</span>
                <span>•</span>
                <span>📅 {postedDateText}</span>
              </div>
            </div>
          </div>

          {/* Matching vs Missing Skills in Container */}
          {(matched.length > 0 || missing.length > 0) && (
            <div className="space-y-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              {matched.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[9px] font-black uppercase text-emerald-600 tracking-wider mr-1">Matching:</span>
                  {matched.map((s, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[9px] border border-emerald-100/50">
                      {s}
                    </span>
                  ))}
                </div>
              )}
              {missing.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[9px] font-black uppercase text-amber-500 tracking-wider mr-1">Missing:</span>
                  {missing.map((s, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 font-bold text-[9px] border border-amber-100/50">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Match Score & Action Buttons (Aligned to Right on Desktop) */}
      <div className="flex flex-row lg:flex-col justify-between items-center lg:items-end gap-4 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 lg:pl-4 lg:w-56 select-none">
        {/* Match Score Badge */}
        <div className="text-right">
          <span className="inline-flex rounded-full px-3 py-1.5 text-[10px] font-black border uppercase tracking-wider select-none shadow-inner leading-none align-middle justify-center items-center gap-1.5 bg-slate-900 text-white border-slate-950 font-mono">
            <span className={`h-2 w-2 rounded-full ${isHighMatch ? 'bg-emerald-400 animate-ping' : 'bg-violet-400'}`}></span>
            {matchVal}% Match
          </span>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center gap-2 justify-end w-auto">
          {/* Bookmark button */}
          <button
            onClick={() => toggleSaveJob(stableJob.jobId)}
            className={`flex h-10 w-10 items-center justify-center rounded-xl border transition cursor-pointer shrink-0 ${
              savedJobs.includes(stableJob.jobId)
                ? 'border-amber-200 bg-amber-50 text-amber-600 shadow-sm'
                : 'border-slate-200 hover:bg-slate-50 text-slate-400'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill={savedJobs.includes(stableJob.jobId) ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
            </svg>
          </button>
          
          {stableJobId ? (
            <button
              onClick={() => handleViewDetails(stableJob)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shrink-0"
            >
              View Details
            </button>
          ) : (
            <button
              disabled={true}
              className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-400 cursor-not-allowed shrink-0"
            >
              Details Unavailable
            </button>
          )}
          
          {!isApplyUrlMissing ? (
            <button
              onClick={() => triggerApply(stableJob)}
              className={`rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md transition cursor-pointer shrink-0 ${
                appliedJobs.includes(stableJob.jobId)
                  ? 'bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700'
                  : 'bg-violet-600 shadow-violet-100 hover:bg-violet-700'
              }`}
            >
              {appliedJobs.includes(stableJob.jobId) ? 'Applied' : 'Apply Now'}
            </button>
          ) : (
            <button
              disabled={true}
              title="Application link is missing from original source data"
              className="rounded-xl px-4 py-2.5 text-xs font-bold bg-slate-200 text-slate-500 cursor-not-allowed shadow-none border border-slate-300 shrink-0"
            >
              Application Link Unavailable
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobCard;
