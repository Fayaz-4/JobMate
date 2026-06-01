import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../../services/dashboardService';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [skills, setSkills] = useState([]);
  const [error, setError] = useState('');
  const [userMeta, setUserMeta] = useState({
    fullName: 'Samantha Taylor',
    email: 'samantha.taylor@example.com',
  });

  useEffect(() => {
    // 1. Recover user metadata from localStorage
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

    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getDashboard();
      setDashboardData(data);
      setRecommendedJobs(data.recommendedJobs || []);
      setSkills(data.topExtractedSkills || []);

      if (data.user) {
        setUserMeta({
          fullName: data.user.fullName || 'User Profile',
          email: data.user.email || 'user@example.com',
        });
      }
    } catch (err) {
      setError('Failed to fetch summary telemetry. Please check server connections.');
    } finally {
      setLoading(false);
    }
  };

  // Status Styled Badges helper
  const getStatusBadge = (status) => {
    const base = "inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide border ";
    switch (status) {
      case 'Selected':
        return base + "bg-emerald-50 text-emerald-700 border-emerald-150";
      case 'Rejected':
        return base + "bg-rose-50 text-rose-700 border-rose-150";
      case 'Interview Scheduled':
        return base + "bg-violet-50 text-violet-700 border-violet-150";
      case 'Interview Completed':
        return base + "bg-indigo-50 text-indigo-700 border-indigo-150";
      case 'Offer Received':
        return base + "bg-amber-50 text-amber-700 border-amber-150";
      case 'Applied':
      default:
        return base + "bg-sky-50 text-sky-700 border-sky-150";
    }
  };

  // Format Calendar Date
  const getFormattedDate = () => {
    return new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getGreetingTime = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good Morning';
    if (hrs < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Chart data setup
  const chartData = [
    { label: 'Applied', count: dashboardData?.appliedCount || 0, color: 'from-sky-400 to-sky-600', bg: 'bg-sky-50', hoverBorder: 'hover:border-sky-300' },
    { label: 'Interview Scheduled', count: dashboardData?.interviewScheduledCount || 0, color: 'from-violet-400 to-violet-600', bg: 'bg-violet-50', hoverBorder: 'hover:border-violet-300' },
    { label: 'Interview Completed', count: dashboardData?.interviewCompletedCount || 0, color: 'from-indigo-400 to-indigo-600', bg: 'bg-indigo-50', hoverBorder: 'hover:border-indigo-300' },
    { label: 'Selected', count: dashboardData?.selectedCount || 0, color: 'from-emerald-400 to-emerald-600', bg: 'bg-emerald-50', hoverBorder: 'hover:border-emerald-300' },
    { label: 'Rejected', count: dashboardData?.rejectedCount || 0, color: 'from-rose-400 to-rose-600', bg: 'bg-rose-50', hoverBorder: 'hover:border-rose-300' },
    { label: 'Offer Received', count: dashboardData?.offerReceivedCount || 0, color: 'from-amber-400 to-amber-600', bg: 'bg-amber-50', hoverBorder: 'hover:border-amber-300' },
  ];

  const maxCount = Math.max(...chartData.map(d => d.count), 1);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6 bg-slate-50 min-h-screen">
      
      {/* Header Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 select-none shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Placement Dashboard</h1>
        </div>
      </div>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700 shadow-sm shrink-0">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 w-full">
          <div className="h-10 w-10 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500 font-mono">Querying live metrics...</p>
        </div>
      ) : (
        <div className="space-y-6 animate-fadeIn">
          
          {/* 1. Welcome Banner */}
          <div className="rounded-[2.5rem] bg-gradient-to-tr from-slate-900 via-slate-800 to-violet-950 p-8 md:p-10 text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6 shrink-0">
            <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-bl from-violet-600/10 to-transparent rounded-full pointer-events-none"></div>
            <div className="space-y-2 relative z-10">
              <span className="inline-flex rounded-full bg-violet-500/20 px-3 py-1 text-xs font-bold text-violet-300 uppercase border border-violet-500/30 font-mono">
                {getGreetingTime()}
              </span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight">Welcome, {userMeta.fullName}!</h2>
              <p className="text-sm font-medium text-slate-400 max-w-md">
                Review your active job application statuses, matching metrics, and manage your placement search journey in real-time.
              </p>
            </div>
            <div className="shrink-0 relative z-10 bg-white/5 border border-white/10 backdrop-blur px-5 py-4 rounded-3xl text-right">
              <span className="text-xs font-bold text-slate-400 block tracking-wider uppercase">Date Today</span>
              <span className="text-sm font-black text-violet-300 mt-1 block font-mono">{getFormattedDate()}</span>
            </div>
          </div>

          {/* 2. 9 Statistics Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3 shrink-0">
            {/* TOTAL APPLICATIONS */}
            <a
              href="/applications?tab=all"
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between hover:scale-[1.03] hover:shadow-md transition duration-200 cursor-pointer border-l-4 border-l-slate-500"
            >
              <span className="text-slate-400 text-[9px] font-black uppercase tracking-wider">Total Apps</span>
              <span className="text-2xl font-black text-slate-900 mt-3 font-mono">{dashboardData?.totalApplications || 0}</span>
              <span className="text-[8px] font-bold text-slate-500 mt-1 block">All Tracked →</span>
            </a>

            {/* APPLIED */}
            <a
              href="/applications?tab=applied"
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between hover:scale-[1.03] hover:shadow-md transition duration-200 cursor-pointer border-l-4 border-l-sky-500"
            >
              <span className="text-sky-500 text-[9px] font-black uppercase tracking-wider">Applied</span>
              <span className="text-2xl font-black text-sky-600 mt-3 font-mono">{dashboardData?.appliedCount || 0}</span>
              <span className="text-[8px] font-bold text-sky-500 mt-1 block">Active →</span>
            </a>

            {/* INTERVIEW SCHEDULED */}
            <a
              href="/applications?tab=interview_scheduled"
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between hover:scale-[1.03] hover:shadow-md transition duration-200 cursor-pointer border-l-4 border-l-violet-500"
            >
              <span className="text-violet-500 text-[9px] font-black uppercase tracking-wider">Int Scheduled</span>
              <span className="text-2xl font-black text-violet-600 mt-3 font-mono">{dashboardData?.interviewScheduledCount || 0}</span>
              <span className="text-[8px] font-bold text-violet-500 mt-1 block">Upcoming →</span>
            </a>

            {/* INTERVIEW COMPLETED */}
            <a
              href="/applications?tab=interview_completed"
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between hover:scale-[1.03] hover:shadow-md transition duration-200 cursor-pointer border-l-4 border-l-indigo-500"
            >
              <span className="text-indigo-500 text-[9px] font-black uppercase tracking-wider">Int Completed</span>
              <span className="text-2xl font-black text-indigo-600 mt-3 font-mono">{dashboardData?.interviewCompletedCount || 0}</span>
              <span className="text-[8px] font-bold text-indigo-500 mt-1 block">Rounds Done →</span>
            </a>

            {/* SELECTED */}
            <a
              href="/applications?tab=selected"
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between hover:scale-[1.03] hover:shadow-md transition duration-200 cursor-pointer border-l-4 border-l-emerald-500"
            >
              <span className="text-emerald-500 text-[9px] font-black uppercase tracking-wider">Selected</span>
              <span className="text-2xl font-black text-emerald-600 mt-3 font-mono">{dashboardData?.selectedCount || 0}</span>
              <span className="text-[8px] font-bold text-emerald-500 mt-1 block">Shortlisted →</span>
            </a>

            {/* REJECTED */}
            <a
              href="/applications?tab=rejected"
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between hover:scale-[1.03] hover:shadow-md transition duration-200 cursor-pointer border-l-4 border-l-rose-500"
            >
              <span className="text-rose-500 text-[9px] font-black uppercase tracking-wider">Rejected</span>
              <span className="text-2xl font-black text-rose-600 mt-3 font-mono">{dashboardData?.rejectedCount || 0}</span>
              <span className="text-[8px] font-bold text-rose-500 mt-1 block">Closed →</span>
            </a>

            {/* OFFER RECEIVED */}
            <a
              href="/applications?tab=offer_received"
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between hover:scale-[1.03] hover:shadow-md transition duration-200 cursor-pointer border-l-4 border-l-amber-500"
            >
              <span className="text-amber-500 text-[9px] font-black uppercase tracking-wider">Offers</span>
              <span className="text-2xl font-black text-amber-600 mt-3 font-mono">{dashboardData?.offerReceivedCount || 0}</span>
              <span className="text-[8px] font-bold text-amber-500 mt-1 block">Offer Letters →</span>
            </a>

            {/* SKILLS EXTRACTED */}
            <a
              href="/resume-upload"
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between hover:scale-[1.03] hover:shadow-md transition duration-200 cursor-pointer border-l-4 border-l-fuchsia-500"
            >
              <span className="text-fuchsia-500 text-[9px] font-black uppercase tracking-wider">Skills Extracted</span>
              <span className="text-2xl font-black text-fuchsia-600 mt-3 font-mono">{dashboardData?.skillsExtractedCount || 0}</span>
              <span className="text-[8px] font-bold text-fuchsia-500 mt-1 block">From Resume →</span>
            </a>

            {/* RECOMMENDED JOBS */}
            <a
              href="/jobs"
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between hover:scale-[1.03] hover:shadow-md transition duration-200 cursor-pointer border-l-4 border-l-violet-600"
            >
              <span className="text-violet-600 text-[9px] font-black uppercase tracking-wider">Rec Jobs</span>
              <span className="text-2xl font-black text-violet-700 mt-3 font-mono">{dashboardData?.recommendedJobsCount || 0}</span>
              <span className="text-[8px] font-bold text-violet-600 mt-1 block">Explore Matches →</span>
            </a>
          </div>

          {/* Grid Layout: Charts & Recent Applications (Left) and Skills Summary (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start shrink-0">
            
            {/* Left Column (Span 2) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Application Status Chart */}
              <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 md:p-8 shadow-xl shadow-slate-100 flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Application Status Distribution</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">Visual pipeline breakdown of your logged applications</p>
                </div>

                <div className="space-y-4">
                  {chartData.map((d, index) => {
                    const pct = (d.count / maxCount) * 100;
                    return (
                      <div key={index} className="flex items-center gap-4">
                        <div className="w-32 text-xs font-bold text-slate-600 truncate">{d.label}</div>
                        <div className="flex-1 h-7 bg-slate-50 border border-slate-100 rounded-full overflow-hidden relative shadow-inner">
                          <div 
                            className={`h-full bg-gradient-to-r ${d.color} rounded-full transition-all duration-1000 ease-out`}
                            style={{ width: `${d.count > 0 ? pct : 0}%` }}
                          >
                            {d.count > 0 && (
                              <span className="absolute inset-y-0 left-3.5 flex items-center text-[10px] font-black text-white drop-shadow-sm font-mono">
                                {d.count}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-8 text-right text-xs font-black text-slate-900 font-mono">{d.count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Applications */}
              <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 md:p-8 shadow-xl shadow-slate-100 flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Recent Applications</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">Your 5 most recently registered application submissions</p>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs text-slate-600">
                    <thead className="bg-slate-50 font-black text-slate-800 uppercase tracking-wider select-none">
                      <tr>
                        <th className="px-5 py-3 rounded-tl-2xl">Company</th>
                        <th className="px-5 py-3">Role</th>
                        <th className="px-5 py-3">Applied Date</th>
                        <th className="px-5 py-3 rounded-tr-2xl">Current Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 font-medium">
                      {dashboardData?.recentApplications && dashboardData.recentApplications.length > 0 ? (
                        dashboardData.recentApplications.map((app) => (
                          <tr key={app.id} className="hover:bg-slate-50/50 transition">
                            <td className="px-5 py-3.5 text-slate-900 font-bold truncate max-w-[150px]">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-7.5 w-7.5 items-center justify-center rounded-xl bg-violet-100 text-violet-700 font-black text-xs shrink-0 select-none">
                                  {app.companyName.substring(0, 1).toUpperCase()}
                                </div>
                                <span className="truncate">{app.companyName}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 font-bold text-slate-700 truncate max-w-[150px]">
                              {app.jobTitle}
                            </td>
                            <td className="px-5 py-3.5 font-semibold text-slate-450 font-mono">
                              {new Date(app.appliedDate).toLocaleDateString(undefined, {
                                year: 'numeric', month: 'short', day: 'numeric'
                              })}
                            </td>
                            <td className="px-5 py-3.5">
                              {getStatusBadge(app.status)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center py-10 text-slate-400 font-semibold italic">
                            No applications submitted yet. Browse jobs to get started!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Right Column (Span 1) */}
            <div className="space-y-6">
              
              {/* Skills Summary */}
              <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 md:p-8 shadow-xl shadow-slate-100 flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Skills Summary</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">Total count and parsed tags from active resume analysis</p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-violet-100 bg-violet-50/20 p-4 text-center">
                    <span className="text-[10px] font-black text-violet-400 uppercase tracking-wider">Total Skills Extracted</span>
                    <p className="text-3xl font-black text-violet-700 mt-1 font-mono">{skills.length}</p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Top Extracted Skills</span>
                    {skills.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {skills.slice(0, 15).map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center rounded-xl bg-slate-50 border border-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition duration-150"
                          >
                            {skill}
                          </span>
                        ))}
                        {skills.length > 15 && (
                          <span className="inline-flex items-center rounded-xl bg-violet-50 px-2.5 py-1 text-[10px] font-black text-violet-600">
                            +{skills.length - 15} More
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs font-semibold text-slate-400">
                        No skills parsed. Upload resume to populate tags.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions Shortcuts */}
              <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 md:p-8 shadow-xl shadow-slate-100 flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Quick Actions</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">Shortcuts to manage your profile</p>
                </div>

                <div className="flex flex-col gap-3">
                  <a
                    href="/resume-upload"
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-violet-600 py-3.5 text-xs font-bold text-white shadow-md shadow-violet-100 hover:bg-violet-700 transition"
                  >
                    Upload Resume
                  </a>
                  <a
                    href="/jobs"
                    className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    View Jobs
                  </a>
                  <a
                    href="/profile"
                    className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Update Profile
                  </a>
                </div>
              </div>

            </div>

          </div>

          {/* 3. Recommended Jobs Section (Full Width Bottom) */}
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 md:p-8 shadow-xl shadow-slate-100 flex flex-col gap-6 shrink-0">
            <div>
              <h3 className="text-lg font-black text-slate-900">Recommended Jobs</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">Top 5 matched opportunities based on your extracted resume skills</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {recommendedJobs.length > 0 ? (
                recommendedJobs.map((job) => {
                  const matchVal = job.matchPercentage || 0;
                  const isHighMatch = matchVal >= 70;
                  
                  return (
                    <div
                      key={job.id}
                      className="rounded-[2rem] border border-slate-200 bg-white p-5 flex flex-col justify-between gap-4 hover:border-violet-300 transition duration-200"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          {/* Mini Logo fallback */}
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white font-black text-sm select-none shadow-sm">
                            {job.companyName.substring(0, 1).toUpperCase()}
                          </div>
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider font-mono ${
                            isHighMatch ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-violet-50 text-violet-700 border border-violet-100'
                          }`}>
                            {matchVal}% Match
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h4 className="font-extrabold text-slate-900 text-xs truncate" title={job.jobTitle}>{job.jobTitle}</h4>
                          <p className="text-[10px] text-slate-500 font-bold truncate">{job.companyName}</p>
                          <p className="text-[9px] text-slate-400 font-semibold truncate">📍 {job.location}</p>
                        </div>

                        {/* Comparative skills list */}
                        <div className="space-y-1 text-[8px] font-bold select-none pt-1">
                          {job.matchedSkills && job.matchedSkills.length > 0 && (
                            <div className="truncate text-emerald-600">
                              ✓ {job.matchedSkills.slice(0, 2).join(', ')}
                              {job.matchedSkills.length > 2 && '...'}
                            </div>
                          )}
                          {job.missingSkills && job.missingSkills.length > 0 && (
                            <div className="truncate text-amber-600">
                              + {job.missingSkills.slice(0, 2).join(', ')}
                              {job.missingSkills.length > 2 && '...'}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className="w-full text-center rounded-xl border border-slate-200 bg-white py-2 text-[10px] font-black text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer select-none"
                      >
                        View Details
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs font-semibold text-slate-450 italic">
                  No recommended jobs found. Upload resume skills to generate matches!
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default Dashboard;
