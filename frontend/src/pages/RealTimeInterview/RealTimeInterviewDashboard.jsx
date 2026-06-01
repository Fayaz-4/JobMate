import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAppliedCompanies } from '../../services/readinessService';
import { 
  getDashboardStats, 
  getHistory, 
  startSession, 
  getSessionReport,
  startResumeMockSession,
  getConnectivityStatus
} from '../../services/realTimeInterviewService';
import { 
  getPrepStatus, 
  getLeetCodeRoadmap, 
  getMockInterviewPrep 
} from '../../services/practicePrepService';

const RealTimeInterviewDashboard = () => {
  const navigate = useNavigate();

  // State Variables
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState({
    totalInterviews: 0,
    averageScore: 0,
    communicationScore: 0,
    confidenceScore: 0,
    technicalScore: 0,
    problemSolvingScore: 0,
    trends: []
  });
  const [history, setHistory] = useState([]);

  // API Connectivity Status
  const [connectivity, setConnectivity] = useState({
    openai: "Checking...",
    vapi: "Checking...",
    jsearch: "Checking..."
  });

  // Selection States
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [interviewType, setInterviewType] = useState('Mixed');
  const [sessionLoading, setSessionLoading] = useState(false);

  // Selected Report Modal State
  const [selectedReport, setSelectedReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Practice Prep Card States
  const [hasResume, setHasResume] = useState(false);
  const [leetcodeRoadmap, setLeetcodeRoadmap] = useState(null);
  const [mockPrep, setMockPrep] = useState(null);
  const [loadingPrep, setLoadingPrep] = useState(false);
  const [prepError, setPrepError] = useState(null);
  const [selectedMockType, setSelectedMockType] = useState('Mixed');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    
    // 1. Fetch connectivity status in parallel/background (non-blocking)
    getConnectivityStatus()
      .then(connectivityData => {
        setConnectivity(connectivityData || {
          openai: "Failed: Unknown status",
          vapi: "Failed: Unknown status",
          jsearch: "Failed: Unknown status"
        });
      })
      .catch(cErr => {
        console.error("Failed to load connectivity status", cErr);
        setConnectivity({
          openai: "Failed to connect",
          vapi: "Failed to connect",
          jsearch: "Failed to connect"
        });
      });

    // 2. Fetch core dashboard details concurrently
    try {
      await Promise.all([
        getAppliedCompanies()
          .then(data => setCompanies(data || []))
          .catch(cErr => console.error("Failed to load applied companies", cErr)),
        getDashboardStats()
          .then(data => setStats(data || {
            totalInterviews: 0,
            averageScore: 0,
            communicationScore: 0,
            confidenceScore: 0,
            technicalScore: 0,
            problemSolvingScore: 0,
            trends: []
          }))
          .catch(sErr => console.error("Failed to load dashboard stats", sErr)),
        getHistory()
          .then(data => setHistory(data || []))
          .catch(hErr => console.error("Failed to load interview history", hErr))
      ]);
    } catch (err) {
      console.error("Failed to load core dashboard data", err);
    } finally {
      // Core loading finishes so dashboard is interactive instantly!
      setLoading(false);
    }

    // 3. Load practice preparation status and details asynchronously in the background
    try {
      const prepStatus = await getPrepStatus();
      setHasResume(prepStatus.hasResume);
      if (prepStatus.hasResume) {
        setLoadingPrep(true);
        const [leetcodeData, mockData] = await Promise.all([
          getLeetCodeRoadmap(),
          getMockInterviewPrep()
        ]);
        setLeetcodeRoadmap(leetcodeData);
        setMockPrep(mockData);
      }
    } catch (pErr) {
      console.error("Failed to load practice preparation details", pErr);
      setPrepError("Could not load dynamic resume recommendations.");
    } finally {
      setLoadingPrep(false);
    }
  };

  const handleStartRoom = async () => {
    if (!selectedAppId) {
      alert("Please select a target job opportunity first.");
      return;
    }
    setSessionLoading(true);
    try {
      const response = await startSession(selectedAppId, interviewType);
      if (response && response.sessionId) {
        // Navigate to the live virtual meet room!
        navigate(`/realtime-interview/room/${response.sessionId}`);
      } else {
        throw new Error("Invalid session metadata received.");
      }
    } catch (err) {
      console.error("Failed to start voice session", err);
      alert("Failed to initialize the virtual AI Coach room. Please verify your Gemini API key in backend.");
    } finally {
      setSessionLoading(false);
    }
  };

  const handleStartResumeMock = async () => {
    setSessionLoading(true);
    try {
      const response = await startResumeMockSession(selectedMockType);
      if (response && response.sessionId) {
        navigate(`/realtime-interview/room/${response.sessionId}`);
      } else {
        throw new Error("Invalid session metadata received.");
      }
    } catch (err) {
      console.error("Failed to start resume mock session", err);
      alert("Failed to initialize the virtual AI Coach room. Please verify your resume is uploaded and your Gemini API key is configured.");
    } finally {
      setSessionLoading(false);
    }
  };

  const handleOpenReport = async (sessionId) => {
    setLoadingReport(true);
    try {
      const report = await getSessionReport(sessionId);
      setSelectedReport(report);
    } catch (err) {
      console.error("Failed to load detailed session report", err);
      alert("Unable to retrieve final evaluation summary.");
    } finally {
      setLoadingReport(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-rose-600";
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans antialiased text-[#0F172A]">
      <div className="p-6 md:p-8 max-w-5xl mx-auto w-full space-y-6">

        {/* 1. BRAND HEADER */}
        <div className="border-b border-[#E5E7EB] bg-white pb-5 select-none rounded-b-[20px] p-6 shadow-sm border-x border-t">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#2563EB]"></span>
            </span>
            <span className="text-[10px] font-black text-[#2563EB] uppercase tracking-wider">FLAGSHIP AI FEATURE</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A] mt-1.5">Real-Time AI Interview Coach</h1>
          <p className="text-sm text-[#64748B] mt-1 font-semibold leading-relaxed max-w-2xl">
            Simulate realistic, voice-interactive virtual job interviews. Practice target company questions, speak your answers out loud, and receive real-time granular evaluation of filler words, speaking pace, and confidence.
          </p>
        </div>

        {/* API CONNECTIVITY STATUS BADGES */}
        <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-5 shadow-sm select-none grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { key: "openai", name: "OpenAI GPT-4o", status: connectivity.openai },
            { key: "vapi", name: "Vapi Voice AI", status: connectivity.vapi },
            { key: "jsearch", name: "JSearch Crawler", status: connectivity.jsearch }
          ].map((service) => {
            const isConnected = service.status === "Connected";
            return (
              <div key={service.key} className="flex items-center gap-3 border border-slate-100 bg-slate-50/50 p-3.5 rounded-xl">
                {isConnected ? (
                  <div className="h-6 w-6 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-extrabold shrink-0 text-xs shadow-xs">
                    ✓
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 font-extrabold shrink-0 text-xs shadow-xs">
                    ✗
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black text-slate-800 block leading-tight">{service.name}</span>
                  <span className={`text-[9px] font-semibold block mt-0.5 truncate leading-none ${isConnected ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isConnected ? '✓ Connected' : service.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {loading ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4">
            <div className="h-8 w-8 rounded-full border-2 border-[#E5E7EB] border-t-[#2563EB] animate-spin"></div>
            <p className="text-xs font-bold text-[#64748B]">Synthesizing AI Coach Statistics...</p>
          </div>
        ) : (
          <>
            {/* 2. STATS & ANALYTICS WIDGETS */}
            {stats.totalInterviews === 0 && (
              <div className="animate-fadeIn p-8 bg-white border border-[#E5E7EB] rounded-[20px] shadow-sm text-center font-extrabold text-[#64748B] text-sm select-none">
                No interview data available.
              </div>
            )}

            {stats.totalInterviews > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-fadeIn">
                {[
                  { label: "Total Sessions", val: stats.totalInterviews, unit: "", desc: "Simulations completed" },
                  { label: "Average Score", val: stats.averageScore, unit: "%", desc: "Overall performance" },
                  { label: "Technical Competence", val: stats.technicalScore, unit: "%", desc: "Architecture & logic" },
                  { label: "Communication Flow", val: stats.communicationScore, unit: "%", desc: "Filler words penalty" },
                  { label: "Vocal Confidence", val: stats.confidenceScore, unit: "%", desc: "Speaking pace & clarity" }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white border border-[#E5E7EB] rounded-[18px] p-5 shadow-xs select-none">
                    <span className="text-[9px] font-black text-[#64748B] uppercase tracking-wider block">{item.label}</span>
                    <h3 className="text-2xl font-black text-[#0F172A] mt-1.5">
                      {item.val}{item.unit}
                    </h3>
                    <p className="text-[9px] font-semibold text-[#64748B] mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {/* 3. CORE PANELS SPLIT */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 items-start">
              
              {/* Left Column: SETUP PRACTICE SESSION */}
              <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-extrabold text-[#0F172A]">Initialize Virtual Room</h3>
                  <p className="text-xs text-[#64748B] font-semibold mt-0.5">Configure target company criteria and permissions</p>
                </div>

                {/* Job Dropdown Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider block">Target Job Opportunity:</label>
                  <select
                    value={selectedAppId || ''}
                    onChange={(e) => setSelectedAppId(Number(e.target.value) || null)}
                    className="bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 text-xs font-bold text-[#0F172A] focus:outline-none focus:border-[#2563EB] w-full cursor-pointer transition"
                  >
                    <option value="">Select an Applied Job...</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.readinessCompanyId}>
                        {c.companyName} — {c.role} ({c.location})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Interview Types Pill Selection */}
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider block">Practice Session Focus:</label>
                  <div className="flex flex-wrap gap-2 select-none">
                    {['Technical', 'HR', 'Behavioral', 'Coding', 'Mixed', 'Company Specific'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setInterviewType(type)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          interviewType === type
                            ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                            : 'bg-white text-[#64748B] border-[#E5E7EB] hover:text-[#0F172A] hover:border-slate-350'
                        }`}
                      >
                        {type} Interview
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Launch Button */}
                <button
                  onClick={handleStartRoom}
                  disabled={sessionLoading}
                  className="w-full rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white py-3.5 text-xs font-black shadow-sm transition select-none flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-400"
                >
                  {sessionLoading ? (
                    <>
                      <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-300 border-t-white animate-spin"></div>
                      <span>Synthesizing Adaptive Gemini Prompt...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                      </svg>
                      <span>Enter AI Interview Room</span>
                    </>
                  )}
                </button>
              </div>

              {/* Right Column: CHRONOLOGICAL PROGRESS TRENDS */}
              <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-extrabold text-[#0F172A]">Improvement Trends</h3>
                  <p className="text-xs text-[#64748B] font-semibold mt-0.5">Chronological score progressions across attempts</p>
                </div>

                {stats.trends.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-[#E5E7EB] rounded-2xl p-4 select-none">
                    <span className="text-[10px] font-bold text-[#64748B] block">No interview data available.</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Visual Custom SVG Bar Graph */}
                    <div className="h-[120px] flex items-end gap-3 justify-around pt-4 border-b border-[#E5E7EB] px-2 select-none">
                      {stats.trends.slice(-5).map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-1 group relative w-full">
                          {/* Tooltip on hover */}
                          <span className="absolute -top-7 scale-0 group-hover:scale-100 transition-all bg-[#0F172A] text-white text-[9px] font-bold py-1 px-2 rounded-md shadow-sm z-10 whitespace-nowrap">
                            {item.companyName}: {item.overallScore}%
                          </span>
                          
                          <div 
                            className="bg-[#2563EB] hover:bg-blue-700 w-full rounded-t-md transition-all duration-500 shadow-xs flex items-end justify-center"
                            style={{ height: `${item.overallScore}%` }}
                          >
                            <span className="text-[8px] font-black text-white mb-1">{item.overallScore}%</span>
                          </div>
                          
                          <span className="text-[9px] font-black text-[#64748B] uppercase tracking-wider">{item.interviewLabel}</span>
                        </div>
                      ))}
                    </div>

                    <div className="text-[9px] text-[#64748B] font-semibold flex items-center justify-between select-none px-1">
                      <span>← Oldest Attempt</span>
                      <span>Most Recent →</span>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* 4. MOCK TIMELINE HISTORY LIST */}
            <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6 shadow-sm space-y-5 animate-fadeIn">
              <div>
                <h3 className="text-base font-extrabold text-[#0F172A]">Candidate Mock History</h3>
                <p className="text-xs text-[#64748B] font-semibold mt-0.5">Chronological dialog transcript logs and AI feedback plans</p>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-10 border border-[#E5E7EB] rounded-2xl select-none">
                  <span className="text-xs font-bold text-[#64748B] block">No interview data available.</span>
                </div>
              ) : (
                <div className="divide-y divide-[#E5E7EB]">
                  {history.map((session, sidx) => (
                    <div 
                      key={session.id} 
                      className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-black text-[#2563EB] uppercase tracking-wider">{session.companyName}</span>
                          <span className="text-[9px] font-bold text-[#64748B] border border-[#E5E7EB] bg-slate-50 px-1.5 py-0.5 rounded-md">{session.interviewType} Interview</span>
                          <span className="text-[9px] font-bold text-[#64748B]">{new Date(session.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h4 className="text-xs font-extrabold text-[#0F172A] leading-tight">
                          Session: {session.jobTitle} ({session.duration} Minutes Duration)
                        </h4>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 select-none">
                        <div className="text-right">
                          <span className={`text-sm font-black block ${getScoreColor(session.overallScore)}`}>
                            {session.overallScore}%
                          </span>
                          <span className="text-[9px] text-[#64748B] font-bold block uppercase tracking-wider">Overall score</span>
                        </div>
                        <button
                          onClick={() => handleOpenReport(session.id)}
                          className="rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2 text-xs font-bold text-[#0F172A] hover:bg-[#F8F9FB] hover:border-slate-350 transition cursor-pointer shadow-xs"
                        >
                          View Report
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5. PERSONALIZED PRACTICE PREPARATION ENGINE */}
            <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6 shadow-sm space-y-5 animate-fadeIn">
              <div>
                <h3 className="text-base font-extrabold text-[#0F172A]">Resume-Aware Practice Center</h3>
                <p className="text-xs text-[#64748B] font-semibold mt-0.5">
                  Dynamic preparation resources generated directly from your uploaded resume skills, projects, and experiences.
                </p>
              </div>

              {loadingPrep ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="border border-[#E5E7EB] rounded-[16px] p-5 space-y-4 animate-pulse">
                      <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-slate-200 rounded"></div>
                        <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-6 bg-slate-200 rounded w-16"></div>
                        <div className="h-6 bg-slate-200 rounded w-20"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !hasResume ? (
                <div className="border border-dashed border-[#E5E7EB] rounded-[16px] p-8 text-center bg-[#F8F9FB] space-y-3 select-none">
                  <span className="text-[28px] block">📄</span>
                  <h4 className="text-sm font-extrabold text-[#0F172A]">Dynamic Practice recommendations Locked</h4>
                  <p className="text-xs text-[#64748B] font-semibold max-w-md mx-auto leading-relaxed">
                    Please upload your active resume PDF in the Resume section. Our AI will extract your tech stack to generate personalized LeetCode roadmaps and custom mock interviews.
                  </p>
                  <button 
                    onClick={() => navigate('/resume-upload')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-black shadow-xs transition cursor-pointer"
                  >
                    Upload Resume &rarr;
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* DYNAMIC LEETCODE ROADMAP CARD */}
                  <div className="border border-[#E5E7EB] rounded-[16px] p-5 bg-white flex flex-col justify-between gap-5 transition hover:border-[#2563EB]/40 hover:shadow-xs">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                        <div>
                          <span className="text-[10px] font-black text-[#2563EB] uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md">
                            LeetCode Personalization
                          </span>
                          <h4 className="text-sm font-extrabold text-[#0F172A] mt-1">Stack-Aware Coding Roadmap</h4>
                        </div>
                        <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-md">
                          Priority: {leetcodeRoadmap?.difficultyLevel || "Medium"}
                        </span>
                      </div>

                      {/* Detected skills */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-[#64748B] uppercase tracking-wider block">Detected Tech Stack:</span>
                        <div className="flex flex-wrap gap-1">
                          {leetcodeRoadmap?.detectedSkills?.map((skill, sidx) => (
                            <span key={sidx} className="bg-slate-100 text-[#0F172A] px-2 py-0.5 rounded-md text-[10px] font-bold">
                              {skill}
                            </span>
                          )) || <span className="text-[10px] text-slate-400">Determining...</span>}
                        </div>
                      </div>

                      {/* Recommended topics */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-[#2563EB] uppercase tracking-wider block">Recommended Coding Topics:</span>
                        <div className="flex flex-wrap gap-1">
                          {leetcodeRoadmap?.recommendedTopics?.map((topic, tidx) => (
                            <span key={tidx} className="bg-blue-50 text-[#2563EB] px-2 py-0.5 rounded-md text-[10px] font-bold">
                              {topic}
                            </span>
                          )) || <span className="text-[10px] text-slate-400">Synthesizing...</span>}
                        </div>
                      </div>

                      {/* Practice Problems checklist */}
                      <div className="space-y-2 border-t border-[#F1F5F9] pt-3">
                        <span className="text-[9px] font-black text-[#64748B] uppercase tracking-wider block">Practice Problems Roadmap:</span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="bg-emerald-50/50 border border-emerald-100/60 p-2 rounded-xl text-center">
                            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest block">🟢 Easy</span>
                            <div className="text-[9px] font-bold text-slate-700 mt-1 select-none space-y-0.5">
                              {leetcodeRoadmap?.easyProblems?.slice(0, 2).map((p, idx) => (
                                <div key={idx} className="truncate">{p}</div>
                              )) || "Two Sum"}
                            </div>
                          </div>
                          <div className="bg-amber-50/50 border border-amber-100/60 p-2 rounded-xl text-center">
                            <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest block">🟡 Medium</span>
                            <div className="text-[9px] font-bold text-slate-700 mt-1 select-none space-y-0.5">
                              {leetcodeRoadmap?.mediumProblems?.slice(0, 2).map((p, idx) => (
                                <div key={idx} className="truncate">{p}</div>
                              )) || "Top K Frequent"}
                            </div>
                          </div>
                          <div className="bg-rose-50/50 border border-rose-100/60 p-2 rounded-xl text-center">
                            <span className="text-[8px] font-black text-rose-600 uppercase tracking-widest block">🔴 Hard</span>
                            <div className="text-[9px] font-bold text-slate-700 mt-1 select-none space-y-0.5">
                              {leetcodeRoadmap?.hardProblems?.slice(0, 1).map((p, idx) => (
                                <div key={idx} className="truncate">{p}</div>
                              )) || "Merge K Lists"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Strategic roadmap */}
                      <div className="space-y-1 bg-slate-50 border border-[#E5E7EB] p-3 rounded-xl">
                        <div className="text-[9px] font-semibold text-slate-700">
                          <strong className="text-slate-900 font-extrabold block mb-0.5">Practice Roadmap:</strong>
                          {leetcodeRoadmap?.roadmap || "Focus on algorithmic problem patterns."}
                        </div>
                        <div className="text-[9px] font-semibold text-slate-700 mt-1.5">
                          <strong className="text-slate-900 font-extrabold">Practice Order: </strong> 
                          {leetcodeRoadmap?.practiceOrder}
                        </div>
                        <div className="text-[9px] font-semibold text-slate-700 mt-1">
                          <strong className="text-slate-900 font-extrabold">Learning Priority: </strong> 
                          {leetcodeRoadmap?.learningPriority}
                        </div>
                      </div>

                    </div>

                    <a
                      href="https://leetcode.com/problemset/all/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-center rounded-xl border border-[#E5E7EB] hover:border-[#2563EB] hover:bg-slate-50 text-[#0F172A] hover:text-[#2563EB] py-3 text-xs font-black shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                      Open LeetCode
                    </a>
                  </div>

                  {/* DYNAMIC GOOGLE AI STUDIO CARD */}
                  <div className="border border-[#E5E7EB] rounded-[16px] p-5 bg-white flex flex-col justify-between gap-5 transition hover:border-[#2563EB]/40 hover:shadow-xs">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                        <div>
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-md">
                            Google AI Studio
                          </span>
                          <h4 className="text-sm font-extrabold text-[#0F172A] mt-1">Resume-Based Mock Room</h4>
                        </div>
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                          AI Room Active
                        </span>
                      </div>

                      {/* Skills focus */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-wider block">Generated Skills Focus:</span>
                        <div className="flex flex-wrap gap-1">
                          {mockPrep?.skillsFocus?.slice(0, 4).map((focus, fidx) => (
                            <span key={fidx} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-[10px] font-bold">
                              {focus}
                            </span>
                          )) || <span className="text-[10px] text-slate-400">Synthesizing...</span>}
                        </div>
                      </div>

                      {/* Strategic focus points */}
                      <div className="space-y-2">
                        <div className="text-[9px] font-semibold text-slate-700">
                          <strong className="text-indigo-950 font-extrabold block">Technical Focus:</strong>
                          {mockPrep?.technicalFocus || "Technical foundations review."}
                        </div>
                        <div className="text-[9px] font-semibold text-slate-700">
                          <strong className="text-indigo-950 font-extrabold block">Project Focus:</strong>
                          {mockPrep?.projectFocus || "Project architecture bottlenecks."}
                        </div>
                        <div className="text-[9px] font-semibold text-slate-700">
                          <strong className="text-indigo-950 font-extrabold block">Behavioral Focus:</strong>
                          {mockPrep?.behavioralFocus || "STAR teamwork & leadership challenges."}
                        </div>
                      </div>

                      {/* AI Strategic preparation advice */}
                      <div className="bg-indigo-50/40 border border-indigo-100/50 p-3.5 rounded-xl space-y-1">
                        <span className="text-[9px] font-black text-indigo-700 uppercase tracking-wider block">⭐ AI Prep Tip:</span>
                        <p className="text-[9px] font-semibold text-slate-700 leading-relaxed">
                          {mockPrep?.prepTips || "Practice explaining project optimization out loud using clean diagrams."}
                        </p>
                      </div>

                      {/* Dropdown Focus Selector */}
                      <div className="space-y-1.5 pt-1">
                        <label className="text-[9px] font-black text-[#64748B] uppercase tracking-wider block">Select Mock Category:</label>
                        <select
                          value={selectedMockType}
                          onChange={(e) => setSelectedMockType(e.target.value)}
                          className="bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-bold text-[#0F172A] focus:outline-none focus:border-[#2563EB] w-full cursor-pointer transition"
                        >
                          <option value="Technical">Technical Mock Interview</option>
                          <option value="Coding">Coding / DSA Mock Interview</option>
                          <option value="Behavioral">Behavioral Mock (STAR)</option>
                          <option value="HR">HR & Career Goals Interview</option>
                          <option value="Mixed">Mixed Interview (Balanced Round)</option>
                        </select>
                      </div>

                    </div>

                    <button
                      onClick={handleStartResumeMock}
                      disabled={sessionLoading}
                      className="w-full text-center rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white py-3 text-xs font-black shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer select-none"
                    >
                      {sessionLoading ? (
                        <>
                          <div className="h-3.5 w-3.5 rounded-full border-2 border-indigo-200 border-t-white animate-spin"></div>
                          <span>Starting Room...</span>
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                          </svg>
                          Start AI Interview
                        </>
                      )}
                    </button>
                  </div>

                </div>
              )}
            </div>
          </>
        )}

      </div>

      {/* 5. DETAILED ANALYTICS REPORT MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn select-none">
          <div className="bg-white border border-[#E5E7EB] rounded-[24px] shadow-lg max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-scaleUp">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-black text-[#2563EB] uppercase tracking-wider">{selectedReport.companyName} — {selectedReport.interviewType}</span>
                <h3 className="text-base font-extrabold text-[#0F172A] mt-0.5">{selectedReport.jobTitle} Evaluation report</h3>
              </div>
              <button 
                onClick={() => setSelectedReport(null)}
                className="h-8 w-8 rounded-full border border-[#E5E7EB] hover:bg-slate-50 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Scroll Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              
              {/* Overall metric blocks */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {[
                  { label: "Overall", val: selectedReport.overallScore },
                  { label: "Technical", val: selectedReport.technicalScore },
                  { label: "Communication", val: selectedReport.communicationScore },
                  { label: "Confidence", val: selectedReport.confidenceScore },
                  { label: "Behavioral", val: selectedReport.behavioralScore },
                  { label: "Problem Solving", val: selectedReport.problemSolvingScore }
                ].map((m, idx) => (
                  <div key={idx} className="bg-[#F8F9FB] border border-[#E5E7EB] p-3 rounded-xl text-center">
                    <span className="text-[8px] font-black text-[#64748B] uppercase tracking-widest block">{m.label}</span>
                    <span className={`text-base font-black block mt-1 ${getScoreColor(m.val)}`}>{m.val}%</span>
                  </div>
                ))}
              </div>

              {/* Strengths & Weaknesses lists */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block">⭐ Core Strengths:</span>
                  <ul className="space-y-1.5">
                    {selectedReport.strengths?.map((str, sidx) => (
                      <li key={sidx} className="bg-emerald-50 text-emerald-800 p-2.5 rounded-lg font-semibold border border-emerald-100 flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest block">⚠️ Areas for Improvement:</span>
                  <ul className="space-y-1.5">
                    {selectedReport.weaknesses?.map((weak, widx) => (
                      <li key={widx} className="bg-rose-50 text-rose-800 p-2.5 rounded-lg font-semibold border border-rose-100 flex items-start gap-2">
                        <span className="text-rose-500 font-bold">•</span>
                        <span>{weak}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Plan improvement timeline */}
              {selectedReport.improvementPlan && (
                <div className="rounded-[16px] border border-blue-100 bg-blue-50/50 p-4 space-y-3">
                  <span className="text-[9px] font-black text-[#2563EB] uppercase tracking-widest block">💡 Strategic AI Revise Plan:</span>
                  
                  <div className="space-y-2 font-semibold">
                    <div>
                      <span className="text-[9px] text-[#64748B] uppercase block">Topics to Revise:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {selectedReport.improvementPlan.topicsToRevise?.map((topic, tidx) => (
                          <span key={tidx} className="bg-white border border-[#E5E7EB] text-[#0F172A] px-2.5 py-0.5 rounded-full text-[9px] font-bold">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] text-[#64748B] uppercase block">Practice recommendations:</span>
                      <p className="text-[#0F172A] leading-relaxed mt-1 text-[11px] font-bold whitespace-pre-line">
                        {selectedReport.improvementPlan.learningRecommendations}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Dialog Transcript QA Feed */}
              {selectedReport.dialogs && selectedReport.dialogs.length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className="text-[9px] font-black text-[#64748B] uppercase tracking-widest block">Dialogue Session Transcript:</span>
                  
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {selectedReport.dialogs.map((d, didx) => {
                      return (
                        <div key={didx} className="border border-[#E5E7EB] rounded-xl p-3.5 bg-[#F8F9FB] space-y-2 font-semibold">
                          <div className="flex items-center justify-between text-[9px] border-b border-slate-200 pb-1.5">
                            <span className="text-[#2563EB] font-black uppercase">Dialogue Question #{didx+1} ({d.difficulty})</span>
                            <span className={`font-black ${getScoreColor(d.score)}`}>Score: {d.score}%</span>
                          </div>
                          
                          <p className="text-[#0F172A] font-bold">Q: "{d.question}"</p>
                          <p className="text-[#64748B] bg-white p-2.5 rounded-lg border border-[#E5E7EB] text-[11px] leading-relaxed italic">
                            A: "{d.userAnswer}"
                          </p>

                          {d.feedback && (
                            <div className="text-[10px] space-y-1 mt-1 text-slate-700 bg-white/70 p-2.5 rounded-lg border border-slate-200/50">
                              {d.feedback.fillerWordsUsed && d.feedback.fillerWordsUsed.length > 0 && (
                                <p className="text-rose-600">
                                  ⚠️ <span className="font-bold">Filler Words Logged:</span> {d.feedback.fillerWordsUsed.join(', ')}
                                </p>
                              )}
                              <p><span className="font-bold">Strength:</span> {d.feedback.strengths}</p>
                              <p><span className="font-bold">Critique:</span> {d.feedback.weaknesses}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E5E7EB] bg-slate-50 flex justify-end shrink-0">
              <button 
                onClick={() => setSelectedReport(null)}
                className="rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white px-5 py-2 text-xs font-black shadow-xs cursor-pointer"
              >
                Close Report
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default RealTimeInterviewDashboard;
