import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getJobDetails, getSimilarJobs } from '../../services/jobDetailsService';
import { createApplication } from '../../services/applicationService';
import { getResume } from '../../services/resumeService';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const mapFrontendJobToDetails = (fJob) => {
    if (!fJob) return null;
    return {
      id: fJob.id || fJob.jobId,
      jobId: fJob.jobId,
      jobTitle: fJob.jobTitle || fJob.title || '',
      companyName: fJob.companyName || fJob.company || '',
      location: fJob.location || 'India',
      description: fJob.description || '',
      employmentType: fJob.employmentType || 'Full Time',
      jobType: fJob.jobType || fJob.employmentType || 'Full Time',
      salary: fJob.salary || 'Not Disclosed',
      experience: fJob.experience || '0 - 3 years',
      skillsRequired: fJob.skillsRequired || fJob.skills || '',
      jobUrl: fJob.jobUrl || fJob.applyUrl || '',
      source: fJob.source || fJob.jobSource || 'Unknown',
      jobSource: fJob.jobSource || fJob.source || 'Unknown',
      postedDate: fJob.postedDate || '',
      workMode: fJob.workMode || (fJob.remote ? 'Remote' : 'Onsite'),
      companyLogo: fJob.companyLogo || '',
      applicantsCount: fJob.applicantsCount,
      deadline: fJob.deadline,
      matchPercentage: fJob.matchPercentage
    };
  };
  
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [similarJobs, setSimilarJobs] = useState([]);
  const [error, setError] = useState('');
  const [hasResume, setHasResume] = useState(false);
  
  // Interaction States
  const [isSaved, setIsSaved] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);
  const [userMeta, setUserMeta] = useState({
    fullName: 'Samantha Taylor',
    email: 'samantha.taylor@example.com',
  });

  useEffect(() => {
    // Recover user meta
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserMeta({
          fullName: parsed.fullName || 'User Profile',
          email: parsed.email || 'user@example.com',
        });
      } catch (e) {
        console.warn('Could not parse user metadata');
      }

      // Check if resume exists
      getResume()
        .then(() => setHasResume(true))
        .catch(() => setHasResume(false));
    }
  }, []);

  useEffect(() => {
    if (id) {
      if (location.state?.job) {
        const mapped = mapFrontendJobToDetails(location.state.job);
        setJob(mapped);
        setLoading(false);
        getSimilarJobs(id)
          .then(similar => setSimilarJobs(similar))
          .catch(() => {});
      } else {
        loadJobDetailsData(id);
      }
    }
  }, [id, location.state]);

  useEffect(() => {
    if (job) {
      console.log("=== JOB DETAILS DATA SOURCE AUDIT ===");
      console.log(`posted_date -> ${job.postedDate ? `job.postedDate (${job.postedDate})` : 'null'}`);
      console.log(`deadline -> ${job.deadline ? `job.deadline (${job.deadline})` : 'null'}`);
      console.log(`applicants_count -> ${job.applicantsCount ? `job.applicantsCount (${job.applicantsCount})` : 'null'}`);
      console.log(`salary -> ${job.salary ? `job.salary (${job.salary})` : 'null'}`);
      console.log(`company_rating -> ${job.companyRating ? `job.companyRating (${job.companyRating})` : 'null'}`);
      console.log(`match_score -> ${hasResume ? `job.matchPercentage (${job.matchPercentage}%)` : 'null'}`);
      console.log("=====================================");
    }
  }, [job, hasResume]);

  const loadJobDetailsData = async (jobId) => {
    setLoading(true);
    setError('');
    setIsApplied(false);
    try {
      const [details, similar] = await Promise.all([
        getJobDetails(jobId),
        getSimilarJobs(jobId)
      ]);
      setJob(details);
      setSimilarJobs(similar);
      
      // Seed random saved state based on ID for high-fidelity state management
      setIsSaved((parseInt(jobId) % 3) === 0);
    } catch (err) {
      setError('Failed to fetch job details. Please check server connections.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = () => {
    setIsSaved(!isSaved);
  };

  const triggerApply = async () => {
    if (isApplied) {
      if (job.jobUrl) {
        window.open(job.jobUrl, '_blank');
      }
      return;
    }
    
    try {
      // 1. Save application record in database with "Applied" status (automatically set by backend)
      await createApplication({
        jobId: job.id,
        companyName: job.companyName,
        jobTitle: job.jobTitle,
        applicationSource: job.source || job.jobSource || 'JSearch',
        applicationUrl: job.jobUrl,
        appliedDate: new Date().toISOString().split('T')[0],
        currentRound: 'None',
        notes: 'Applied dynamically via JobMate Daily Job Digest.'
      });
      
      setIsApplied(true);
      
      // 2. Redirect user to the original company job URL
      alert(`Application successfully recorded! Redirecting to original company posting page at ${job.companyName}.`);
      if (job.jobUrl) {
        window.open(job.jobUrl, '_blank');
      }
    } catch (err) {
      console.error('Failed to register application record:', err);
      // Fallback redirect even if database save fails to ensure user experience isn't blocked
      if (job.jobUrl) {
        window.open(job.jobUrl, '_blank');
      }
    }
  };

  const handleShare = () => {
    const fullUrl = window.location.href;
    navigator.clipboard.writeText(fullUrl);
    setShareFeedback(true);
    setTimeout(() => setShareFeedback(false), 2000);
  };



  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto w-full space-y-6">
      
      {/* Sub Header for Page Context with Back Button */}
      <div className="border-b border-slate-200 bg-white pb-5 flex items-center justify-between shadow-xs select-none">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="rounded-full border border-slate-200 bg-white p-2 text-slate-400 hover:text-slate-800 transition cursor-pointer"
            title="Go Back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900">Job Opportunity Details</h1>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700 shadow-sm">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 w-full">
          <div className="h-10 w-10 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Retrieving Careers Record...</p>
        </div>
      ) : !job ? (
        <div className="rounded-[2.5rem] border border-slate-200 bg-white p-12 text-center shadow-lg flex flex-col items-center justify-center gap-4 w-full my-6">
          <h4 className="text-xl font-black text-slate-900">Job Record Not Found</h4>
          <p className="text-xs font-semibold text-slate-400">The career opportunity record could not be loaded or has been archived.</p>
          <button onClick={() => navigate('/jobs')} className="rounded-full bg-violet-600 px-6 py-2.5 text-xs font-bold text-white cursor-pointer">Back to Jobs</button>
        </div>
      ) : (
        <div className="space-y-8 animate-fadeIn">
          
          {/* SECTION 1: Job Header Card */}
          <div className="rounded-[2.5rem] bg-gradient-to-tr from-slate-900 via-slate-800 to-violet-950 p-6 md:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-bl from-violet-600/15 to-transparent rounded-full pointer-events-none"></div>
            
            <div className="flex items-start md:items-center gap-5 relative z-10">
              {/* Company Logo Image or Fallback */}
              <div className="relative h-16 w-16 shrink-0 select-none">
                {job.companyLogo ? (
                  <img
                    src={job.companyLogo}
                    alt={`${job.companyName} Logo`}
                    className="h-16 w-16 object-contain rounded-3xl bg-white border border-slate-800 p-1.5 shrink-0 shadow-md"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="absolute inset-0 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-violet-500 to-fuchsia-500 text-white font-black text-2xl shadow-lg"
                  style={{ display: job.companyLogo ? 'none' : 'flex' }}
                >
                  {job.companyName.substring(0, 1)}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex rounded-full bg-violet-500/20 px-3 py-1 text-[10px] font-black text-violet-300 uppercase border border-violet-500/30 tracking-wider">
                    {job.source || job.jobSource || 'JSearch'} Verified
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">{job.jobTitle}</h2>
                <p className="text-sm font-semibold text-slate-400">{job.companyName}</p>
                
                {/* Location, WorkMode, salary tags */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="inline-flex rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-bold text-slate-300">
                    📍 {job.location || 'Not Available'}
                  </span>
                  <span className="inline-flex rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-bold text-slate-300">
                    💼 {job.experience || 'Not Available'}
                  </span>
                  <span className="inline-flex rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-bold text-slate-300">
                    💰 {job.salary || 'Not Available'}
                  </span>
                </div>
              </div>
            </div>

            {/* Badges Column */}
            <div className="shrink-0 flex flex-wrap md:flex-col gap-2.5 relative z-10 self-start md:self-center">
              <span className="inline-flex rounded-full bg-violet-600/60 px-4.5 py-1.5 text-xs font-black uppercase tracking-wider text-violet-100 border border-violet-500/20">
                {job.workMode || 'Hybrid'}
              </span>
              <span className="inline-flex rounded-full bg-fuchsia-600/60 px-4.5 py-1.5 text-xs font-black uppercase tracking-wider text-fuchsia-100 border border-fuchsia-500/20">
                {job.jobType || job.employmentType || 'Full Time'}
              </span>
            </div>
          </div>

          {/* SECTION 2: Job Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-flow-col auto-cols-fr gap-4">
            {hasResume && (
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Match Score</span>
                <span className="text-2xl font-black text-violet-700 mt-2">
                  {job.matchPercentage !== undefined && job.matchPercentage !== null ? `${job.matchPercentage}% Match` : 'Not Available'}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 mt-1 block">Based on resume analysis</span>
              </div>
            )}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Posted Date</span>
              <span className="text-2xl font-black text-slate-900 mt-2">
                {job.postedDate ? new Date(job.postedDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date not available'}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 mt-1 block">Active on board</span>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Applicants Count</span>
              <span className="text-2xl font-black text-slate-900 mt-2">
                {job.applicantsCount !== undefined && job.applicantsCount !== null ? `${job.applicantsCount} Applied` : 'Applicants data unavailable'}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 mt-1 block">Via {job.source || job.jobSource || 'JSearch'}</span>
            </div>
            {job.deadline && (
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Deadline</span>
                <span className="text-2xl font-black text-rose-600 mt-2">
                  {new Date(job.deadline).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 mt-1 block">Apply before expired</span>
              </div>
            )}
          </div>

          {/* Main Content Layout - Two Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Column - Detailed specifications */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* SECTION 3: Job Description */}
              <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 md:p-8 shadow-xl shadow-slate-100 flex flex-col gap-4">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">Role Description</h3>
                <p className="text-sm font-medium leading-relaxed text-slate-600 whitespace-pre-line">
                  {job.description || "No description provided for this job opportunity."}
                </p>
              </div>

              {/* SECTION 4: Required Skills Tags */}
              <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 md:p-8 shadow-xl shadow-slate-100 flex flex-col gap-4">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">Required Technical Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skillsRequired ? (
                    job.skillsRequired.split(',').map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center rounded-2xl bg-violet-50 px-4 py-2 text-xs font-bold text-violet-700 border border-violet-100"
                      >
                        {skill.trim()}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">No specific skills listed.</p>
                  )}
                </div>
              </div>



              {/* SECTION 8: Similar Jobs Feed */}
              <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 md:p-8 shadow-xl shadow-slate-100 flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">Similar Active Roles</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Recommendations based on technical and location parameters</p>
                </div>

                <div className="space-y-4">
                  {similarJobs.length > 0 ? (
                    similarJobs.map((simJob) => (
                      <div
                        key={simJob.id}
                        className="rounded-3xl border border-slate-100 bg-slate-50/50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-violet-100 transition cursor-pointer"
                        onClick={() => navigate(`/jobs/${simJob.id}`)}
                      >
                        <div className="flex items-start gap-4">
                          <div className="relative h-11 w-11 shrink-0 select-none">
                            {simJob.companyLogo ? (
                              <img
                                src={simJob.companyLogo}
                                alt={`${simJob.companyName} Logo`}
                                className="h-11 w-11 object-contain rounded-2xl bg-white border border-slate-200 p-1 shrink-0 shadow-sm"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div
                              className="absolute inset-0 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white font-black text-base shadow"
                              style={{ display: simJob.companyLogo ? 'none' : 'flex' }}
                            >
                              {simJob.companyName.substring(0, 1)}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-extrabold text-slate-900 text-sm">{simJob.jobTitle}</h4>
                            <p className="text-xs text-slate-500 font-bold">{simJob.companyName}</p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 font-semibold pt-1">
                              <span>📍 {simJob.location}</span>
                              <span>•</span>
                              <span>💼 {simJob.experience || '0 - 3 years'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-4 self-end sm:self-center">
                          {hasResume && (
                            <div className="text-right">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Match Score</span>
                              <span className="text-sm font-black text-violet-700 block mt-0.5">
                                {simJob.matchPercentage !== undefined && simJob.matchPercentage !== null ? `${simJob.matchPercentage}% Match` : 'Not Available'}
                              </span>
                            </div>
                          )}
                          <span className="rounded-full bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 text-xs font-bold shadow-sm transition">
                            Details →
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs font-semibold text-slate-400">No similar role listings active at the moment.</p>
                  )}
                </div>
              </div>

            </div>

            {/* Right Column - Actions & Metadata */}
            <div className="space-y-6">
              
              {/* SECTION 9: Actions Panel */}
              <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100 flex flex-col gap-4">
                <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider block border-b border-slate-100 pb-2">Opportunity Actions</h3>
                
                {job.jobUrl ? (
                  <button
                    onClick={triggerApply}
                    className={`w-full rounded-2xl py-3.5 text-xs font-bold text-white shadow-md transition cursor-pointer ${
                      isApplied 
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
                        : 'bg-violet-600 hover:bg-violet-700 shadow-violet-100'
                    }`}
                  >
                    {isApplied ? '✓ Applied' : 'Apply Now'}
                  </button>
                ) : (
                  <button
                    disabled={true}
                    className="w-full rounded-2xl py-3.5 text-xs font-bold bg-slate-200 text-slate-500 cursor-not-allowed shadow-none border border-slate-350"
                  >
                    Application Link Unavailable
                  </button>
                )}

                <button
                  onClick={toggleSave}
                  className={`w-full rounded-2xl py-3.5 text-xs font-bold transition flex items-center justify-center gap-2 border cursor-pointer ${
                    isSaved
                      ? 'border-amber-300 bg-amber-50 text-amber-600 shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                  </svg>
                  {isSaved ? 'Saved Opportunity' : 'Save Job'}
                </button>

                <button
                  onClick={handleShare}
                  className="w-full h-11 rounded-2xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center gap-2 font-bold text-xs transition cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186.002-.006a2.25 2.25 0 1 0-.003.006m0 2.186-.002.006a2.25 2.25 0 1 0 .003-.006M11.25 7.5a2.25 2.25 0 1 0 4.5 0 2.25 2.25 0 0 0-4.5 0ZM11.25 16.5a2.25 2.25 0 1 0 4.5 0 2.25 2.25 0 0 0-4.5 0Z" />
                  </svg>
                  {shareFeedback ? 'Copied Link!' : 'Share Opportunity'}
                </button>
              </div>

              {/* SECTION 10: Additional Employment Information */}
              {(job.bondPeriod || job.probationPeriod || job.noticePeriod || job.companyWebsite) && (
                <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100 flex flex-col gap-4">
                  <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider block border-b border-slate-100 pb-2">Employment Information</h3>
                  
                  <div className="space-y-4">
                    {job.bondPeriod && job.bondPeriod !== "None" && (
                      <div className="flex justify-between items-center text-xs font-semibold border-b border-slate-50 pb-2.5">
                        <span className="text-slate-400">Employment Bond</span>
                        <span className="text-slate-800">{job.bondPeriod}</span>
                      </div>
                    )}
                    {job.probationPeriod && (
                      <div className="flex justify-between items-center text-xs font-semibold border-b border-slate-50 pb-2.5">
                        <span className="text-slate-400">Probation Period</span>
                        <span className="text-slate-800">{job.probationPeriod}</span>
                      </div>
                    )}
                    {job.noticePeriod && (
                      <div className="flex justify-between items-center text-xs font-semibold pb-1">
                        <span className="text-slate-400">Notice Period</span>
                        <span className="text-slate-800">{job.noticePeriod}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION 11: Company Overview */}
              <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100 flex flex-col gap-4">
                <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider block border-b border-slate-100 pb-2">Company Information</h3>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Headquarters</span>
                    <p className="text-xs font-bold text-slate-800">{job.location || 'Not Available'}</p>
                  </div>
                  {job.companyWebsite && (
                    <div className="space-y-1 pt-1.5">
                      <a
                        href={job.companyWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center rounded-xl border border-violet-200 bg-violet-50/20 py-2 text-xs font-bold text-violet-700 hover:bg-violet-50 transition"
                      >
                        Visit Corporate Website ↗
                      </a>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}
    </div>
  );
};

export default JobDetails;
