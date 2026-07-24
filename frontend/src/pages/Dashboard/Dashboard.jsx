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

  const bestMatch = recommendedJobs.length > 0 ? Math.max(...recommendedJobs.map((j) => j.matchPercentage || 0)) : 0;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6 bg-slate-50 min-h-screen">
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
            <a
              href="/applications"
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between hover:scale-[1.03] hover:shadow-md transition duration-200 cursor-pointer border-l-4 border-l-slate-500"
            >
              <span className="text-slate-400 text-[9px] font-black uppercase tracking-wider">Applications Submitted</span>
              <span className="text-2xl font-black text-slate-900 mt-3 font-mono">{dashboardData?.totalApplications || 0}</span>
              <span className="text-[8px] font-bold text-slate-500 mt-1 block">All Applications →</span>
            </a>

            <a
              href="/resume-upload"
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between hover:scale-[1.03] hover:shadow-md transition duration-200 cursor-pointer border-l-4 border-l-fuchsia-500"
            >
              <span className="text-fuchsia-500 text-[9px] font-black uppercase tracking-wider">Skills Extracted</span>
              <span className="text-2xl font-black text-fuchsia-600 mt-3 font-mono">{dashboardData?.skillsExtractedCount || 0}</span>
              <span className="text-[8px] font-bold text-fuchsia-500 mt-1 block">From Resume →</span>
            </a>

            <a
              href="/jobs"
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between hover:scale-[1.03] hover:shadow-md transition duration-200 cursor-pointer border-l-4 border-l-violet-600"
            >
              <span className="text-violet-600 text-[9px] font-black uppercase tracking-wider">Matching Jobs</span>
              <span className="text-2xl font-black text-violet-700 mt-3 font-mono">{dashboardData?.recommendedJobsCount || 0}</span>
              <span className="text-[8px] font-bold text-violet-600 mt-1 block">Explore Matches →</span>
            </a>

            <a
              href="/today-digest"
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between hover:scale-[1.03] hover:shadow-md transition duration-200 cursor-pointer border-l-4 border-l-amber-500"
            >
              <span className="text-amber-500 text-[9px] font-black uppercase tracking-wider">New Matches Today</span>
              <span className="text-2xl font-black text-amber-600 mt-3 font-mono">{dashboardData?.todayJobs?.length || 0}</span>
              <span className="text-[8px] font-bold text-amber-500 mt-1 block">View Digest →</span>
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start shrink-0">
            <div className="lg:col-span-2 space-y-6">
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
                        <th className="px-5 py-3 rounded-tr-2xl">Source</th>
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
                            <td className="px-5 py-3.5 font-semibold text-slate-600">
                              {app.applicationSource || 'Unknown'}
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

            <div className="space-y-6">
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

          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 md:p-8 shadow-xl shadow-slate-100 flex flex-col gap-6 shrink-0">
            <div>
              <h3 className="text-lg font-black text-slate-900">Recommended Jobs</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Top 5 matched opportunities based on your extracted resume skills
                {bestMatch > 0 && (
                  <span className="ml-2 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700 border border-amber-100">
                    Top match: {bestMatch}%
                  </span>
                )}
              </p>
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
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white font-black text-sm select-none shadow-sm">
                            {job.companyName.substring(0, 1).toUpperCase()}
                          </div>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider font-mono ${
                              isHighMatch ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-violet-50 text-violet-700 border border-violet-100'
                            }`}
                          >
                            {matchVal}% Match
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h4 className="font-extrabold text-slate-900 text-xs truncate" title={job.jobTitle}>{job.jobTitle}</h4>
                          <p className="text-[10px] text-slate-500 font-bold truncate">{job.companyName}</p>
                          <p className="text-[9px] text-slate-400 font-semibold truncate">📍 {job.location}</p>
                        </div>

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
