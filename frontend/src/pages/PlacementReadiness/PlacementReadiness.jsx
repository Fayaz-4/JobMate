import React, { useState, useEffect } from 'react';
import { 
  getAppliedCompanies, 
  getCompanyGuide, 
  getHiringProcess, 
  getQuestions, 
  getResources, 
  getRoadmap,
  refreshReadinessPlan
} from '../../services/readinessService';

const PlacementReadiness = () => {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  
  // Selected Company prep details state
  const [guideLoading, setGuideLoading] = useState(false);
  const [guide, setGuide] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [resources, setResources] = useState([]);
  const [roadmap, setRoadmap] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters & Action Controls states
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Recent');

  // Prep Page Tab/Accordion/Filter states
  const [activeRoadmapWeek, setActiveRoadmapWeek] = useState(0);
  const [questionFilter, setQuestionFilter] = useState('All'); // 'All' | 'Technical' | 'Coding' | 'HR' | 'Behavioral'

  // Dynamic Progress Checklist state
  const [completedTopics, setCompletedTopics] = useState([]);

  useEffect(() => {
    loadAppliedCompanies();
  }, []);

  const loadAppliedCompanies = async () => {
    setLoading(true);
    try {
      const data = await getAppliedCompanies();
      setCompanies(data);
    } catch (err) {
      console.error('Failed to load applied companies', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrepareNow = async (readinessCompanyId) => {
    if (!readinessCompanyId) {
      alert("No preparation guide pre-seeded for this company yet. We will seed default resources soon!");
      return;
    }
    
    setError(null);
    setSelectedCompanyId(readinessCompanyId);
    setGuideLoading(true);
    setCompletedTopics([]); // reset progress on company toggle

    try {
      const [guideData, roundsData, questionsData, resourcesData, roadmapData] = await Promise.all([
        getCompanyGuide(readinessCompanyId),
        getHiringProcess(readinessCompanyId),
        getQuestions(readinessCompanyId),
        getResources(readinessCompanyId),
        getRoadmap(readinessCompanyId)
      ]);

      if (!guideData || !guideData.companyName) {
        throw new Error("Unable to generate readiness plan. Please try again.");
      }

      setGuide(guideData);
      setRounds(roundsData);
      setQuestions(questionsData);
      setResources(resourcesData);
      setRoadmap(roadmapData);
      setActiveRoadmapWeek(0);
      setQuestionFilter('All');
    } catch (err) {
      console.error("Failed to load company preparation metrics", err);
      setError("Unable to generate readiness plan. Please try again.");
    } finally {
      setGuideLoading(false);
    }
  };

  const handleBackToLanding = () => {
    setSelectedCompanyId(null);
    setGuide(null);
    setRounds([]);
    setQuestions([]);
    setResources([]);
    setRoadmap([]);
    setError(null);
  };

  const handleRefreshReadiness = async () => {
    if (!selectedCompanyId) return;
    setRefreshing(true);
    setError(null);
    try {
      await refreshReadinessPlan(selectedCompanyId);
      
      const [guideData, roundsData, questionsData, resourcesData, roadmapData] = await Promise.all([
        getCompanyGuide(selectedCompanyId),
        getHiringProcess(selectedCompanyId),
        getQuestions(selectedCompanyId),
        getResources(selectedCompanyId),
        getRoadmap(selectedCompanyId)
      ]);

      if (!guideData || !guideData.companyName) {
        throw new Error("Unable to generate readiness plan. Please try again.");
      }

      setGuide(guideData);
      setRounds(roundsData);
      setQuestions(questionsData);
      setResources(resourcesData);
      setRoadmap(roadmapData);
    } catch (err) {
      console.error("Failed to refresh placement readiness guide", err);
      setError("Unable to generate readiness plan. Please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  // Readiness Status calculator
  const getReadinessStatus = (status) => {
    if (status === 'Selected' || status === 'Interview') return 'Ready';
    if (status === 'In Progress' || status === 'Assessment') return 'In Progress';
    return 'Needs Preparation';
  };

  const getReadinessBadgeClass = (readiness) => {
    const base = "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide border ";
    if (readiness === 'Ready') return base + "bg-emerald-50 text-emerald-700 border-emerald-250";
    if (readiness === 'In Progress') return base + "bg-amber-50 text-amber-700 border-amber-250";
    return base + "bg-rose-50 text-rose-700 border-rose-250";
  };

  // Filter & Sort Logic for applied companies grid
  const filteredCompanies = companies
    .filter((card) => {
      const matchQuery = 
        card.companyName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        card.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchCompany = companyFilter === 'All' || card.companyName === companyFilter;
      
      return matchQuery && matchCompany;
    })
    .sort((a, b) => {
      if (sortBy === 'Recent') {
        return new Date(b.appliedDate) - new Date(a.appliedDate);
      }
      return a.companyName.localeCompare(b.companyName);
    });

  // Unique list of companies for controls filter dropdown
  const uniqueCompanyNames = Array.from(new Set(companies.map(c => c.companyName)));

  // Interview Questions filtering logic
  const filteredQuestionsList = questions.filter(q => {
    if (questionFilter === 'All') return true;
    if (questionFilter === 'Behavioral') return q.roundType?.toLowerCase() === 'hr' || q.roundType?.toLowerCase() === 'behavioral';
    return q.roundType?.toLowerCase() === questionFilter.toLowerCase();
  });

  // Right Column Dynamic study checklist topics mapping
  const checklistItems = roadmap.map((week, idx) => ({
    id: idx,
    label: `${week.week}: ${week.topics}`
  }));

  const totalTopicsCount = checklistItems.length;
  const completedTopicsCount = completedTopics.length;
  const overallPrepPct = totalTopicsCount > 0 ? Math.round((completedTopicsCount / totalTopicsCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans antialiased text-[#0F172A]">
      <div className="p-6 md:p-8 max-w-6xl mx-auto w-full space-y-6">
        
        {/* Landing page or dynamic Prep workspace */}
        {!selectedCompanyId ? (
          /* SAAS LANDING PAGE */
          <div className="space-y-6 animate-fadeIn">
            {/* Header Segment */}
            <div className="border-b border-[#E5E7EB] bg-white pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A]">Placement Readiness</h1>
                <p className="text-sm text-[#64748B] mt-1 font-semibold">Track interview preparation progress for all applied jobs.</p>
              </div>

              {/* Action Controls Bar */}
              <div className="flex flex-wrap items-center gap-3">
                <input 
                  type="text" 
                  placeholder="Search Applications..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white border border-[#E5E7EB] rounded-xl px-4 py-2 text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#2563EB] w-[180px] transition shadow-xs"
                />

                <select 
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#2563EB] cursor-pointer transition shadow-xs"
                >
                  <option value="All">All Companies</option>
                  {uniqueCompanyNames.map((name, idx) => (
                    <option key={idx} value={name}>{name}</option>
                  ))}
                </select>

                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#2563EB] cursor-pointer transition shadow-xs"
                >
                  <option value="Recent">Sort By Recent</option>
                  <option value="Alpha">Sort By Name</option>
                </select>
              </div>
            </div>

            {/* Grid Section: Applied Companies (Gap 24px) */}
            <div className="space-y-4">
              {loading ? (
                <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4">
                  <div className="h-8 w-8 rounded-full border-2 border-[#E5E7EB] border-t-[#2563EB] animate-spin"></div>
                  <p className="text-xs font-bold text-[#64748B]">Retrieving Application History...</p>
                </div>
              ) : filteredCompanies.length === 0 ? (
                <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-12 text-center shadow-xs flex flex-col items-center justify-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-extrabold text-[#0F172A]">No Job Applications Found</h4>
                  <p className="text-xs font-bold text-[#64748B] max-w-sm">
                    Apply for dynamic career roles on the Jobs Explorer page or modify filters to trigger placement readiness workspaces.
                  </p>
                </div>
              ) : (
                <div className="grid gap-[24px] sm:grid-cols-2 lg:grid-cols-3">
                  {filteredCompanies.map((card) => {
                    const readiness = getReadinessStatus(card.status);
                    return (
                      <div 
                        key={card.id}
                        className="rounded-[20px] border border-[#E5E7EB] bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition duration-200 flex flex-col justify-between h-[310px]"
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between gap-3">
                            {/* Modern Square Logo Badge (64x64, bg #EFF6FF, text #2563EB, radius 16px) */}
                            <div className="flex h-[64px] w-[64px] items-center justify-center rounded-[16px] bg-[#EFF6FF] text-[#2563EB] font-black text-xl select-none shrink-0 border border-[#EFF6FF]">
                              {card.logo}
                            </div>
                            
                            {/* Correctly mapped Readiness Status Badge */}
                            <div className="text-right">
                              <span className={getReadinessBadgeClass(readiness)}>
                                {readiness}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <h4 className="text-base font-extrabold text-[#0F172A] truncate max-w-xs">{card.companyName}</h4>
                            <p className="text-xs text-[#64748B] font-bold truncate">{card.role}</p>
                            <p className="text-[10px] text-[#64748B] font-semibold mt-1">
                              Applied: <span className="text-[#0F172A] font-bold">{new Date(card.appliedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              {card.location && <span className="mx-1.5">•</span>}
                              {card.location && <span className="text-[#64748B] font-bold">{card.location}</span>}
                            </p>
                          </div>

                          {/* Dynamic gray pill skill tags */}
                          {card.skills && (
                            <div className="flex flex-wrap gap-1.5 pt-1 overflow-hidden h-[24px]">
                              {card.skills.split(',').slice(0, 3).map((skill, sIdx) => (
                                <span key={sIdx} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold select-none whitespace-nowrap">
                                  {skill.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Dark Navy Button (Background #0F172A, hover #1E293B, white text) */}
                        <button
                          onClick={() => handlePrepareNow(card.readinessCompanyId)}
                          className={`w-full rounded-xl py-3 text-xs font-black shadow-xs transition duration-150 cursor-pointer ${
                            card.readinessCompanyId
                              ? 'bg-[#0F172A] hover:bg-[#1E293B] text-white'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                          }`}
                        >
                          {card.readinessCompanyId ? 'View Preparation Plan' : 'Plan Coming Soon'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* MODERN PREPARATION PAGE REDESIGN */
          <div className="space-y-8 animate-fadeIn text-[#0F172A]">
            
            {/* Header Segment with Back Button */}
            <div className="border-b border-[#E5E7EB] bg-white pb-5 flex items-center justify-between shadow-xs select-none">
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleBackToLanding}
                  className="rounded-full border border-[#E5E7EB] bg-white p-2 text-[#64748B] hover:text-[#0F172A] hover:border-slate-350 transition cursor-pointer"
                  title="Back to Landing"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-xl font-black text-[#0F172A]">Company Preparation Plan</h1>
                  <p className="text-xs text-[#64748B] font-semibold mt-0.5">Explore company timeline, detailed syllabi, and live RAG crawled metadata.</p>
                </div>
              </div>
              
              <button 
                onClick={handleRefreshReadiness}
                disabled={refreshing || guideLoading}
                className={`rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:bg-slate-400 select-none ${
                  refreshing ? 'bg-[#1E293B] cursor-not-allowed' : 'bg-[#0F172A] hover:bg-[#1E293B]'
                }`}
              >
                {refreshing ? (
                  <>
                    <div className="h-3 w-3 rounded-full border-2 border-slate-200 border-t-white animate-spin"></div>
                    <span>Refreshing AI Plan...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    <span>Refresh AI Plan</span>
                  </>
                )}
              </button>
            </div>

            {guideLoading ? (
              <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
                <div className="h-8 w-8 rounded-full border-2 border-[#E5E7EB] border-t-[#2563EB] animate-spin"></div>
                <p className="text-xs font-bold text-[#64748B]">Assembling Interview Guides...</p>
              </div>
            ) : error ? (
              <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 p-8 text-center bg-white rounded-[20px] border border-[#E5E7EB] shadow-xs">
                <div className="h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 animate-bounce">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                </div>
                <h3 className="text-base font-extrabold text-[#0F172A]">Generation Failed</h3>
                <p className="text-xs text-[#64748B] font-bold max-w-md">{error}</p>
                <button 
                  onClick={() => handlePrepareNow(selectedCompanyId)}
                  className="mt-2 rounded-xl bg-[#0F172A] px-5 py-2 text-xs font-black text-white hover:bg-[#1E293B] shadow-xs cursor-pointer transition"
                >
                  Retry Generation
                </button>
              </div>
            ) : (
              <div className="space-y-8 animate-fadeIn text-[#0F172A]">
                
                {/* 1. TOP SECTION (Dashboard Overview Header) */}
                <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6 animate-fadeIn">
                  
                  {/* Left segment */}
                  <div className="flex items-center gap-5">
                    <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[16px] bg-[#EFF6FF] text-[#2563EB] font-black text-3xl shadow-xs shrink-0 select-none border border-[#EFF6FF]">
                      {guide?.companyName?.substring(0, 1).toUpperCase()}
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-xl font-extrabold text-[#0F172A] leading-tight">{guide?.companyName}</h2>
                      <p className="text-xs text-[#64748B] font-bold uppercase tracking-wider">
                        Role: <span className="text-[#2563EB] font-extrabold">{guide?.role}</span>
                        {guide?.researchData && <span className="mx-1.5">•</span>}
                        {guide?.researchData && <span className="text-[#64748B] font-bold">Applied: {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                      </p>
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="inline-flex rounded-full bg-slate-100 border border-[#E5E7EB] px-2.5 py-0.5 font-bold uppercase text-[9px] text-[#64748B]">
                          🌍 {companies.find(c => c.readinessCompanyId === selectedCompanyId)?.location || "Remote"}
                        </span>
                        <span className={getReadinessBadgeClass(getReadinessStatus(companies.find(c => c.readinessCompanyId === selectedCompanyId)?.status))}>
                          {getReadinessStatus(companies.find(c => c.readinessCompanyId === selectedCompanyId)?.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right segment (Preparation Progress, Readiness, Est Days) */}
                  <div className="flex flex-wrap items-center gap-6 border-t md:border-t-0 md:border-l border-[#E5E7EB] pt-4 md:pt-0 md:pl-6 shrink-0 justify-between md:justify-end min-w-[280px]">
                    <div className="space-y-1.5 w-full sm:w-[150px]">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase text-[#64748B]">
                        <span>Prep Progress</span>
                        <span className="text-[#2563EB]">{overallPrepPct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-[#E5E7EB] flex">
                        <div 
                          className="bg-[#2563EB] h-full rounded-full transition-all duration-300"
                          style={{ width: `${overallPrepPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-right space-y-1 min-w-[80px]">
                      <span className="text-[9px] font-black text-[#64748B] uppercase tracking-wider block">Target Prep</span>
                      <span className="text-base font-extrabold text-[#0F172A] block select-none">
                        ⏱️ {guide?.estimatedPreparationTime || "30 Days"}
                      </span>
                    </div>
                  </div>

                </div>

                {/* 2. RAG WEB RESEARCH GROUNDING PANEL */}
                {guide?.researchData && guide.researchData.groundingChunks && guide.researchData.groundingChunks.length > 0 && (
                  <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6 shadow-sm space-y-4 animate-fadeIn">
                    <div>
                      <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-wider flex items-center gap-2 select-none">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-[#2563EB]">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-.778.099-1.533.284-2.253" />
                        </svg>
                        Live AI Web Research Grounding (RAG Sources)
                      </h3>
                      <p className="text-[10px] text-[#64748B] font-semibold mt-0.5">Real-time search queries and context crawling conducted by Google Search integration during roadmap generation</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {guide.researchData.groundingChunks.map((chunk, cidx) => {
                        const webSource = chunk.web || {};
                        if (!webSource.uri) return null;
                        
                        const pageTitle = webSource.title || "Web Reference Link";

                        return (
                          <a 
                            key={cidx}
                            href={webSource.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-4 rounded-[16px] bg-[#F8F9FB] border border-[#E5E7EB] shadow-xs hover:border-[#2563EB] hover:bg-white transition duration-150 animate-fadeIn"
                          >
                            <div className="space-y-1.5">
                              <h5 className="font-bold text-[#0F172A] text-xs leading-snug line-clamp-1" title={pageTitle}>
                                {pageTitle}
                              </h5>
                              <div className="flex items-center gap-1.5 text-[9px] text-[#2563EB] font-black uppercase tracking-wider select-none">
                                <span>🌐 Open Live Source</span>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-2.5 h-2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                </svg>
                              </div>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. MAIN CONTENT (70 / 30 SaaS Grid Layout) */}
                <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-6 items-start">
                  
                  {/* LEFT COLUMN - 70% Layout Panel */}
                  <div className="space-y-8 col-span-1">
                    
                    {/* Hiring Process timeline section */}
                    <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6 shadow-sm space-y-5">
                      <div>
                        <h3 className="text-base font-extrabold text-[#0F172A]">Hiring Process</h3>
                        <p className="text-[11px] text-[#64748B] font-semibold mt-0.5">Typical structured interview loops returned by AI</p>
                      </div>

                      <div className="relative pl-6 border-l border-[#E5E7EB] py-1 space-y-6 select-none">
                        {rounds.length === 0 || (rounds.length === 1 && rounds[0].roundName?.toLowerCase().includes("unavailable")) ? (
                          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs leading-relaxed">
                            ⚠️ Company-specific hiring process unavailable.
                          </div>
                        ) : (
                          rounds.map((round, idx) => (
                            <div key={idx} className="relative space-y-1 pl-1 animate-fadeIn">
                              {/* Timeline Node icon */}
                              <div className="absolute -left-[1.82rem] top-1 h-4.5 w-4.5 rounded-full border border-[#2563EB] bg-[#EFF6FF] flex items-center justify-center shrink-0">
                                <span className="text-[8px] font-black text-[#2563EB]">{round.roundOrder}</span>
                              </div>
                              <span className="text-[9px] font-black text-[#2563EB] uppercase tracking-wider block">Round {round.roundOrder}</span>
                              <h4 className="font-extrabold text-[#0F172A] text-xs">{round.roundName}</h4>
                              {round.focus && <p className="text-[10px] text-[#64748B] font-semibold mt-0.5">Focus: {round.focus}</p>}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Expandable Preparation Roadmap Weeks Section */}
                    {roadmap.length > 0 && (
                      <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6 shadow-sm space-y-5">
                        <div>
                          <h3 className="text-base font-extrabold text-[#0F172A]">Preparation Roadmap</h3>
                          <p className="text-[11px] text-[#64748B] font-semibold mt-0.5">expandable weekly preparation roadmap and target study guidelines</p>
                        </div>

                        <div className="space-y-3">
                          {roadmap.map((week, index) => (
                            <div 
                              key={index}
                              className="rounded-xl border border-[#E5E7EB] overflow-hidden"
                            >
                              <button
                                onClick={() => setActiveRoadmapWeek(activeRoadmapWeek === index ? -1 : index)}
                                className="w-full text-left px-5 py-4 flex items-center justify-between font-extrabold text-xs text-[#0F172A] bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer select-none"
                              >
                                <span className="flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full bg-[#2563EB]"></span>
                                  {week.week} — {week.topics}
                                </span>
                                <span className="font-bold text-[#64748B]">
                                  {activeRoadmapWeek === index ? '▲' : '▼'}
                                </span>
                              </button>

                              {activeRoadmapWeek === index && (
                                <div className="px-5 py-4 border-t border-[#E5E7EB] bg-white text-[11px] font-semibold leading-relaxed text-[#64748B] space-y-2 animate-fadeIn">
                                  <span className="text-[9px] font-black text-[#64748B] uppercase tracking-wider block">Weekly Syllabus Topics & Study Guideline:</span>
                                  <p className="text-[#0F172A] leading-relaxed whitespace-pre-line bg-[#F8F9FB] p-3 rounded-lg border border-[#E5E7EB]">
                                    {week.resources}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sleek Interview Questions Table Section */}
                    {questions.length > 0 && (
                      <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6 shadow-sm space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <h3 className="text-base font-extrabold text-[#0F172A]">Interview Questions</h3>
                            <p className="text-[11px] text-[#64748B] font-semibold mt-0.5">Filterable database of typical interview questions</p>
                          </div>

                          {/* Category pill filters */}
                          <div className="flex flex-wrap gap-1.5 select-none">
                            {['All', 'Technical', 'Coding', 'HR', 'Behavioral'].map((filter) => (
                              <button
                                key={filter}
                                onClick={() => setQuestionFilter(filter)}
                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border cursor-pointer transition ${
                                  questionFilter === filter 
                                    ? 'bg-[#0F172A] text-white border-[#0F172A]' 
                                    : 'bg-white text-[#64748B] border-[#E5E7EB] hover:text-[#0F172A]'
                                }`}
                              >
                                {filter}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Questions Table */}
                        <div className="overflow-x-auto border border-[#E5E7EB] rounded-xl text-xs">
                          <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 font-black text-[#0F172A] uppercase tracking-wider select-none border-b border-[#E5E7EB]">
                              <tr>
                                <th className="px-5 py-3">Interview Question</th>
                                <th className="px-5 py-3">Category</th>
                                <th className="px-5 py-3">Difficulty</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E7EB] font-medium text-[#64748B]">
                              {filteredQuestionsList.length === 0 ? (
                                <tr>
                                  <td colSpan="3" className="px-5 py-6 text-center text-[#64748B] font-bold">
                                    No interview questions found matching this filter category.
                                  </td>
                                </tr>
                              ) : (
                                filteredQuestionsList.map((q, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50/50">
                                    <td className="px-5 py-3 text-[#0F172A] font-bold max-w-md leading-relaxed">{q.question}</td>
                                    <td className="px-5 py-3 font-semibold uppercase text-[9px] tracking-wider select-none">
                                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                                        {q.roundType || "General"}
                                      </span>
                                    </td>
                                    <td className="px-5 py-3 font-bold select-none">
                                      <span className={
                                        q.difficulty === 'Hard' ? 'text-rose-600' :
                                        q.difficulty === 'Medium' ? 'text-amber-600' : 'text-emerald-600'
                                      }>
                                        {q.difficulty || "Medium"}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Dynamic Learning Resources Section */}
                    {resources.length > 0 && (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-base font-extrabold text-[#0F172A] uppercase tracking-wider select-none">Learning Resources</h3>
                          <p className="text-[10px] text-[#64748B] font-semibold mt-0.5">Targeted learning resources generated dynamically by RAG intelligence</p>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                          {resources.map((res, idx) => (
                            <div 
                              key={idx}
                              className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-xs flex flex-col justify-between h-[150px] hover:border-slate-300 transition duration-150 animate-fadeIn"
                            >
                              <div className="space-y-1.5">
                                <span className="inline-flex rounded-full bg-slate-100 text-[#64748B] border border-[#E5E7EB] px-2 py-0.5 uppercase tracking-wide text-[8px] font-black select-none">
                                  {res.resourceType || "Resource"}
                                </span>
                                <h4 className="font-extrabold text-[#0F172A] text-xs truncate max-w-xs">{res.resourceName}</h4>
                                <p className="text-[#64748B] font-semibold text-[10px] leading-relaxed line-clamp-2">
                                  {`Targeted ${res.resourceType || "Reference"} study guide and practice resources carefully selected for ${guide?.role || "candidates"} preparing for interviews at ${guide?.companyName || "the company"}.`}
                                </p>
                              </div>
                              
                              <a 
                                href={res.resourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-center rounded-lg bg-white border border-[#E5E7EB] py-2 text-[10px] font-black text-[#0F172A] hover:bg-[#F8F9FB] hover:border-slate-350 shadow-xs cursor-pointer transition select-none block mt-1"
                              >
                                Open Resource Link →
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* RIGHT COLUMN - 30% Layout Panel */}
                  <div className="space-y-6 col-span-1">
                    
                    {/* SaaS Progress & Dynamic Checkbox Tracker */}
                    <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6 shadow-sm space-y-6 select-none animate-fadeIn">
                      <div>
                        <h3 className="text-base font-extrabold text-[#0F172A]">Syllabus Progress</h3>
                        <p className="text-[10px] text-[#64748B] font-semibold mt-0.5">Track your preparation coverage dynamically derived from the roadmap</p>
                      </div>

                      {/* Dynamic Progress Indicator */}
                      <div className="flex flex-col items-center justify-center p-4 bg-[#F8F9FB] rounded-[16px] border border-[#E5E7EB] gap-3">
                        <div className="relative h-[84px] w-[84px] flex items-center justify-center select-none">
                          <svg className="absolute w-full h-full transform -rotate-90">
                            <circle 
                              cx="42" 
                              cy="42" 
                              r="36" 
                              stroke="#E5E7EB" 
                              strokeWidth="6" 
                              fill="transparent" 
                            />
                            <circle 
                              cx="42" 
                              cy="42" 
                              r="36" 
                              stroke="#2563EB" 
                              strokeWidth="6" 
                              fill="transparent" 
                              strokeDasharray={`${2 * Math.PI * 36}`}
                              strokeDashoffset={`${2 * Math.PI * 36 * (1 - overallPrepPct / 100)}`}
                              className="transition-all duration-350"
                            />
                          </svg>
                          <span className="text-[#0F172A] text-lg font-black">{overallPrepPct}%</span>
                        </div>
                        
                        <div className="text-center space-y-0.5">
                          <span className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">Completed Topics</span>
                          <span className="text-xs font-extrabold text-[#0F172A] block mt-0.5">
                            {completedTopicsCount} of {totalTopicsCount} Covered
                          </span>
                        </div>
                      </div>

                      {/* Interactive Syllabus Checkbox Checklist */}
                      {checklistItems.length === 0 ? (
                        <p className="text-center text-[10px] text-[#64748B] font-semibold py-4 border border-dashed border-[#E5E7EB] rounded-xl">
                          Syllabus topics checklist unavailable.
                        </p>
                      ) : (
                        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                          {checklistItems.map((topic) => {
                            const isChecked = completedTopics.includes(topic.id);
                            return (
                              <label 
                                key={topic.id}
                                className={`flex items-start gap-3 p-3.5 rounded-xl border transition cursor-pointer text-[11px] font-semibold ${
                                  isChecked 
                                    ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E3A8A]' 
                                    : 'bg-white border-[#E5E7EB] text-[#64748B] hover:bg-slate-50/50'
                                }`}
                              >
                                <input 
                                  type="checkbox" 
                                  checked={isChecked}
                                  onChange={() => {
                                    setCompletedTopics(prev => prev.includes(topic.id) ? prev.filter(id => id !== topic.id) : [...prev, topic.id]);
                                  }}
                                  className="h-4.5 w-4.5 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB] shrink-0 mt-0.5 cursor-pointer"
                                />
                                <span className={isChecked ? 'line-through decoration-[#BFDBFE]' : ''}>
                                  {topic.label}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>

                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

export default PlacementReadiness;
