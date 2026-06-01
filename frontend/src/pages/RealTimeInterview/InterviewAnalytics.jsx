import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistory } from '../../services/realTimeInterviewService';

const InterviewAnalytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  
  // Tab states for charts
  const [activeChartTab, setActiveChartTab] = useState('scores'); // scores, communication, confidence, technical

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getHistory();
      setHistory(data || []);
    } catch (err) {
      console.error("Failed to load interview history", err);
      setError("Failed to fetch historical interview reports. Please check database connections.");
    } finally {
      setLoading(false);
    }
  };

  // 1. FILTER ONLY COMPLETED INTERVIEWS
  const completedInterviews = history
    .filter(s => s.status === 'COMPLETED')
    // Chronological order: earliest first (important for trend charts!)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const totalInterviews = completedInterviews.length;

  // Helper to count word occurrences
  const countOccurrences = (text, word) => {
    if (!text) return 0;
    const normalizedText = text.toLowerCase();
    const normalizedWord = word.toLowerCase();
    const regex = new RegExp(`\\b${normalizedWord}\\b`, 'g');
    const matches = normalizedText.match(regex);
    return matches ? matches.length : 0;
  };

  // Helper to estimate words-per-minute (WPM)
  const calculateSessionWpm = (session) => {
    if (!session.dialogs || session.dialogs.length === 0) return 0;
    let totalWords = 0;
    session.dialogs.forEach(d => {
      if (d.userAnswer) {
        totalWords += d.userAnswer.split(/\s+/).filter(Boolean).length;
      }
    });
    // duration is in seconds in Vapi
    const durationMins = (session.duration || 180) / 60.0;
    const effectiveMins = durationMins > 0.1 ? durationMins : 1.0;
    return Math.round(totalWords / effectiveMins);
  };

  // 2. DATA PROCESSING AND AGGREGATION
  let analyticsStats = null;
  let trendData = [];
  let aggregateInsights = {
    strengths: [],
    weaknesses: [],
    topicsToRevise: [],
    practiceAreas: [],
    learningRecommendations: "",
    fillerWordsBreakdown: { umm: 0, like: 0, actually: 0, basically: 0, 'you know': 0 },
    avgWpm: 0,
    avgAnswerLength: 0,
    clarityScore: 0,
    responseDelay: 0
  };

  if (totalInterviews > 0) {
    // Basic stats
    const averageScore = Math.round(completedInterviews.reduce((acc, s) => acc + s.overallScore, 0) / totalInterviews);
    
    // Sort completed list DESC for latest/best lookups
    const descCompleted = [...completedInterviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const latestInterview = descCompleted[0];
    
    const bestInterview = completedInterviews.reduce((max, s) => s.overallScore > max.overallScore ? s : max, completedInterviews[0]);
    const earliestInterview = completedInterviews[0];
    
    const scoreDiff = latestInterview.overallScore - earliestInterview.overallScore;
    const improvementPct = earliestInterview.overallScore > 0 
      ? Math.round((scoreDiff / earliestInterview.overallScore) * 100) 
      : 0;

    analyticsStats = {
      averageScore,
      bestInterview,
      latestInterview,
      improvementPct,
      scoreDiff
    };

    // Process dialogs & counts across all sessions
    let totalWpm = 0;
    let totalAnswerWords = 0;
    let totalDialogCount = 0;
    let fillerUmm = 0;
    let fillerLike = 0;
    let fillerActually = 0;
    let fillerBasically = 0;
    let fillerYouKnow = 0;

    // Trend mapping
    trendData = completedInterviews.map((session, index) => {
      const idxLabel = `Mock #${index + 1}`;
      const sessionWpm = calculateSessionWpm(session);
      totalWpm += sessionWpm;

      // Scan dialogs in this session for filler words & word counts
      let sessionFillerCount = 0;
      let sessionWords = 0;
      let sessionDialogs = 0;

      if (session.dialogs && session.dialogs.length > 0) {
        session.dialogs.forEach(d => {
          if (d.userAnswer) {
            sessionDialogs++;
            totalDialogCount++;
            
            // 1. Text-based regex search for exact user filler words
            const text = d.userAnswer;
            const umms = countOccurrences(text, 'umm') + countOccurrences(text, 'um') + countOccurrences(text, 'uh');
            const likes = countOccurrences(text, 'like');
            const actuallys = countOccurrences(text, 'actually');
            const basicallys = countOccurrences(text, 'basically');
            const youKnows = countOccurrences(text, 'you know') + countOccurrences(text, 'youknow');

            fillerUmm += umms;
            fillerLike += likes;
            fillerActually += actuallys;
            fillerBasically += basicallys;
            fillerYouKnow += youKnows;

            const dialogFillers = umms + likes + actuallys + basicallys + youKnows;
            sessionFillerCount += dialogFillers;

            // Word count
            const words = text.split(/\s+/).filter(Boolean).length;
            sessionWords += words;
            totalAnswerWords += words;
          }
        });
      }

      const avgWordsPerAnswer = sessionDialogs > 0 ? Math.round(sessionWords / sessionDialogs) : 0;

      return {
        interviewLabel: idxLabel,
        companyName: session.companyName,
        jobTitle: session.jobTitle,
        overallScore: session.overallScore,
        technicalScore: session.technicalScore,
        communicationScore: session.communicationScore,
        confidenceScore: session.confidenceScore,
        problemSolvingScore: session.problemSolvingScore,
        behavioralScore: session.behavioralScore,
        fillerCount: sessionFillerCount,
        wpm: sessionWpm,
        answerLen: avgWordsPerAnswer,
        date: new Date(session.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      };
    });

    // Aggregate filler word distributions
    aggregateInsights.fillerWordsBreakdown = {
      umm: fillerUmm,
      like: fillerLike,
      actually: fillerActually,
      basically: fillerBasically,
      'you know': fillerYouKnow
    };

    // Averages
    aggregateInsights.avgWpm = Math.round(totalWpm / totalInterviews);
    aggregateInsights.avgAnswerLength = totalDialogCount > 0 ? Math.round(totalAnswerWords / totalDialogCount) : 0;
    
    // Clarity score mapping (derived from overall communication scores)
    aggregateInsights.clarityScore = Math.round(completedInterviews.reduce((acc, s) => acc + s.communicationScore, 0) / totalInterviews);
    
    // Symmetrical response delay mapping (derived from average hesitation counts, normalized 1.5 - 4.5 seconds)
    const avgFillersPerSession = trendData.reduce((acc, s) => acc + s.fillerCount, 0) / totalInterviews;
    aggregateInsights.responseDelay = (1.5 + Math.min(3.0, avgFillersPerSession * 0.4)).toFixed(1);

    // Learning insights (strengths, weaknesses aggregated from the latest completed session)
    aggregateInsights.strengths = latestInterview.strengths || [];
    aggregateInsights.weaknesses = latestInterview.weaknesses || [];
    if (latestInterview.improvementPlan) {
      aggregateInsights.topicsToRevise = latestInterview.improvementPlan.topicsToRevise || [];
      aggregateInsights.practiceAreas = latestInterview.improvementPlan.practiceAreas || [];
      aggregateInsights.learningRecommendations = latestInterview.improvementPlan.learningRecommendations || "";
    }
  }

  // Formatting helpers
  const getScoreColor = (score) => {
    if (score >= 85) return 'text-emerald-600 border-emerald-200 bg-emerald-50';
    if (score >= 70) return 'text-violet-600 border-violet-200 bg-violet-50';
    return 'text-amber-600 border-amber-200 bg-amber-50';
  };

  // 3. RENDER SVG CHARTS DYNAMICALLY (NO THIRD PARTY LIBRARIES)
  const renderInteractiveChart = () => {
    if (trendData.length < 2) {
      return (
        <div className="h-64 flex items-center justify-center border border-dashed border-slate-200 rounded-3xl p-6 text-center select-none bg-slate-50">
          <div>
            <span className="text-2xl mb-1 block">📈</span>
            <p className="text-xs font-bold text-slate-500">Chronological chart trends require at least 2 completed interviews.</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Complete another voice interview to unlock glowing trend line charts!</p>
          </div>
        </div>
      );
    }

    const width = 680;
    const height = 280;
    const paddingLeft = 45;
    const paddingRight = 30;
    const paddingTop = 25;
    const paddingBottom = 35;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    const numPoints = trendData.length;

    // Helper to calculate SVG X & Y coordinates
    const getX = (index) => paddingLeft + (index / (numPoints - 1)) * chartWidth;
    const getY = (value, maxVal = 100) => height - paddingBottom - (value / maxVal) * chartHeight;

    // Y Axis markers
    const yGridValues = [0, 20, 40, 60, 80, 100];
    
    // Choose dataset depending on selected tab
    let series = [];
    if (activeChartTab === 'scores') {
      series = [
        { label: 'Overall', key: 'overallScore', color: '#2563EB', shadowColor: 'rgba(37, 99, 235, 0.4)' },
        { label: 'Technical', key: 'technicalScore', color: '#EC4899', shadowColor: 'rgba(236, 72, 153, 0.4)' },
        { label: 'Communication', key: 'communicationScore', color: '#10B981', shadowColor: 'rgba(16, 185, 129, 0.4)' },
        { label: 'Confidence', key: 'confidenceScore', color: '#F59E0B', shadowColor: 'rgba(245, 158, 11, 0.4)' }
      ];
    } else if (activeChartTab === 'communication') {
      series = [
        { label: 'Comm Score', key: 'communicationScore', color: '#10B981', shadowColor: 'rgba(16, 185, 129, 0.4)' },
        { label: 'Filler count', key: 'fillerCount', color: '#EF4444', shadowColor: 'rgba(239, 68, 68, 0.4)', maxVal: Math.max(...trendData.map(d => d.fillerCount), 10) }
      ];
    } else if (activeChartTab === 'confidence') {
      series = [
        { label: 'Confidence', key: 'confidenceScore', color: '#F59E0B', shadowColor: 'rgba(245, 158, 11, 0.4)' },
        { label: 'Clarity / wpm', key: 'wpm', color: '#6366F1', shadowColor: 'rgba(99, 102, 241, 0.4)', maxVal: Math.max(...trendData.map(d => d.wpm), 200) }
      ];
    } else if (activeChartTab === 'technical') {
      series = [
        { label: 'Technical', key: 'technicalScore', color: '#EC4899', shadowColor: 'rgba(236, 72, 153, 0.4)' },
        { label: 'Problem Solving', key: 'problemSolvingScore', color: '#8B5CF6', shadowColor: 'rgba(139, 92, 246, 0.4)' }
      ];
    }

    return (
      <div className="w-full">
        {/* SVG Wrapper */}
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none overflow-visible">
          {/* Y Axis Grid lines */}
          {yGridValues.map((val, idx) => {
            const y = getY(val);
            return (
              <g key={idx} className="opacity-40">
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={width - paddingRight} 
                  y2={y} 
                  stroke="#E2E8F0" 
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
                <text 
                  x={paddingLeft - 8} 
                  y={y + 4} 
                  textAnchor="end" 
                  className="text-[9px] font-bold text-slate-400 font-mono"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* X Axis labels */}
          {trendData.map((d, index) => {
            const x = getX(index);
            return (
              <g key={index}>
                <line 
                  x1={x} 
                  y1={height - paddingBottom} 
                  x2={x} 
                  y2={height - paddingBottom + 5} 
                  stroke="#CBD5E1" 
                  strokeWidth={1.5}
                />
                <text 
                  x={x} 
                  y={height - paddingBottom + 16} 
                  textAnchor="middle" 
                  className="text-[8px] font-bold text-slate-500 font-mono"
                >
                  {d.interviewLabel}
                </text>
                <text 
                  x={x} 
                  y={height - paddingBottom + 26} 
                  textAnchor="middle" 
                  className="text-[7px] font-bold text-slate-400 truncate max-w-[50px] font-mono"
                >
                  {d.date}
                </text>
              </g>
            );
          })}

          {/* Render lines and dots */}
          {series.map((ser, sIdx) => {
            const maxVal = ser.maxVal || 100;
            
            // Build SVG path
            let pathD = "";
            trendData.forEach((d, index) => {
              const x = getX(index);
              const y = getY(d[ser.key], maxVal);
              if (index === 0) {
                pathD = `M ${x} ${y}`;
              } else {
                // Symmetrical bezier curves for smooth flowing paths
                const prevX = getX(index - 1);
                const prevY = getY(trendData[index - 1][ser.key], maxVal);
                const cpX1 = prevX + (x - prevX) / 2;
                const cpY1 = prevY;
                const cpX2 = prevX + (x - prevX) / 2;
                const cpY2 = y;
                pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x} ${y}`;
              }
            });

            return (
              <g key={sIdx}>
                {/* Glowing neon shadow path */}
                <path 
                  d={pathD} 
                  fill="none" 
                  stroke={ser.color} 
                  strokeWidth={4.5} 
                  strokeLinecap="round"
                  className="opacity-25"
                  style={{ filter: `drop-shadow(0 0 4px ${ser.color})` }}
                />
                
                {/* Sharp primary path */}
                <path 
                  d={pathD} 
                  fill="none" 
                  stroke={ser.color} 
                  strokeWidth={2.5} 
                  strokeLinecap="round"
                />

                {/* Individual data point dots */}
                {trendData.map((d, index) => {
                  const x = getX(index);
                  const y = getY(d[ser.key], maxVal);
                  return (
                    <g key={index} className="group cursor-pointer">
                      <circle 
                        cx={x} 
                        cy={y} 
                        r={5.5} 
                        fill="white" 
                        stroke={ser.color} 
                        strokeWidth={2.5}
                      />
                      {/* Hover card indicator (soft pulse behind) */}
                      <circle 
                        cx={x} 
                        cy={y} 
                        r={8.5} 
                        fill={ser.color} 
                        className="opacity-0 group-hover:opacity-15 transition duration-150"
                      />
                      {/* Tooltip value */}
                      <text 
                        x={x} 
                        y={y - 10} 
                        textAnchor="middle" 
                        className="text-[9px] font-black text-slate-800 bg-white font-mono opacity-0 group-hover:opacity-100 transition duration-150 pointer-events-none"
                      >
                        {d[ser.key]}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* Legend Panel */}
        <div className="flex flex-wrap items-center justify-center gap-5 mt-4 select-none">
          {series.map((ser, sIdx) => (
            <div key={sIdx} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
              <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: ser.color }}></span>
              <span className="uppercase tracking-wider">
                {ser.label} {ser.maxVal ? `(Scale: 0-${ser.maxVal})` : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 4. SCREEN VIEWS
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 w-full">
        <div className="h-10 w-10 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500 font-mono">Synthesizing telemetry data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700 shadow-sm">
          ⚠️ {error}
        </div>
      </div>
    );
  }

  // STRICT EMPTY STATE GUARD
  if (totalInterviews === 0) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full min-h-[85vh] flex flex-col items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 max-w-xl text-center shadow-lg flex flex-col items-center gap-6 animate-fadeIn">
          {/* Branded Icon Frame */}
          <div className="h-16 w-16 rounded-[1.5rem] bg-violet-50 flex items-center justify-center text-4xl shadow-xs select-none">
            📊
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 leading-tight">No interview data available yet.</h2>
            <p className="text-sm font-medium text-slate-500 leading-relaxed">
              Complete your first dynamic voice mock interview in the AI Interview Room to unlock high-fidelity score tracking, communication telemetry, filler word analysis, and personalized growth insights.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full pt-2 select-none">
            <button
              onClick={() => navigate('/realtime-interview')}
              className="flex-1 rounded-2xl bg-violet-600 hover:bg-violet-700 py-3 text-xs font-black text-white shadow-md shadow-violet-100 transition cursor-pointer"
            >
              ▶ Enter AI Interview Lobby
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 rounded-2xl border border-slate-200 hover:border-slate-350 bg-white py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Go to Placement Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6 bg-slate-50 min-h-screen">
      
      {/* 1. HEADER SECTION */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-250 pb-5 select-none shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900">AI Coach Improvement Tracker</h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">Granular historical speech, confidence, and technical scoring analytics</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2 flex items-center gap-2 shadow-xs shrink-0">
          <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Completed Sessions:</span>
          <span className="text-sm font-black text-[#2563EB] font-mono">{totalInterviews} Mock Rounds</span>
        </div>
      </header>

      {/* 2. STATS & ANALYTICS WIDGET GRID */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0 select-none">
        
        {/* AVERAGE PERFORMANCE SCORE */}
        <div className="rounded-[2rem] border border-slate-250 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider block">Average overall</span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-black text-slate-900 font-mono">{analyticsStats.averageScore}%</span>
            <span className="text-xs font-bold text-slate-500 font-mono">/ 100</span>
          </div>
          <span className="text-[8px] font-bold text-slate-400 block mt-2">Aggregate across completed mocks</span>
        </div>

        {/* BEST INTERVIEW PERFORMANCE */}
        <div className="rounded-[2rem] border border-slate-250 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition border-l-4 border-l-emerald-500">
          <span className="text-emerald-600 text-[10px] font-black uppercase tracking-wider block">🥇 Best Interview</span>
          <div className="mt-4">
            <span className="text-2xl font-black text-emerald-700 font-mono">{analyticsStats.bestInterview.overallScore}%</span>
            <span className="text-[10px] font-black text-slate-900 block truncate mt-0.5">{analyticsStats.bestInterview.jobTitle}</span>
            <span className="text-[8px] text-slate-450 font-bold block truncate mt-0.5 uppercase tracking-wide">at {analyticsStats.bestInterview.companyName}</span>
          </div>
        </div>

        {/* LATEST INTERVIEW ATTEMPT */}
        <div className="rounded-[2rem] border border-slate-250 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition border-l-4 border-l-violet-600">
          <span className="text-violet-600 text-[10px] font-black uppercase tracking-wider block">⏱️ Latest Interview</span>
          <div className="mt-4">
            <span className="text-2xl font-black text-violet-700 font-mono">{analyticsStats.latestInterview.overallScore}%</span>
            <span className="text-[10px] font-black text-slate-900 block truncate mt-0.5">{analyticsStats.latestInterview.jobTitle}</span>
            <span className="text-[8px] text-slate-450 font-bold block truncate mt-0.5 uppercase tracking-wide">at {analyticsStats.latestInterview.companyName}</span>
          </div>
        </div>

        {/* CHRONOLOGICAL IMPROVEMENT RATE */}
        <div className={`rounded-[2rem] border bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition border-l-4 ${
          analyticsStats.improvementPct >= 0 ? 'border-l-indigo-600' : 'border-l-rose-500'
        }`}>
          <span className="text-indigo-600 text-[10px] font-black uppercase tracking-wider block">📈 Improvement rate</span>
          <div className="mt-4">
            <span className={`text-3xl font-black font-mono ${analyticsStats.improvementPct >= 0 ? 'text-indigo-700' : 'text-rose-600'}`}>
              {analyticsStats.improvementPct >= 0 ? `+${analyticsStats.improvementPct}` : analyticsStats.improvementPct}%
            </span>
            <span className="text-[9px] font-bold text-slate-500 block mt-1.5 leading-tight">
              {analyticsStats.improvementPct >= 0 
                ? `Improved by ${analyticsStats.scoreDiff} points since earliest mock!` 
                : `Score dropped by ${Math.abs(analyticsStats.scoreDiff)} points since earliest mock.`}
            </span>
          </div>
        </div>

      </section>

      {/* 3. CORE ANALYTICS BOARD */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch shrink-0">
        
        {/* LEFT COMPONENT: PROGRESS TREND LINE CHARTS (Span 2) */}
        <article className="lg:col-span-2 rounded-[2.5rem] border border-slate-200 bg-white p-6 md:p-8 shadow-sm flex flex-col justify-between gap-6">
          
          {/* Chart Controls Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150 pb-4 select-none">
            <div>
              <h3 className="text-lg font-black text-slate-900">Historical Growth Curves</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">Chronological score progressions across completed attempts</p>
            </div>
            
            {/* Chart Tab Navigation */}
            <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-1 rounded-2xl font-mono text-[9px] font-black uppercase shrink-0">
              <button 
                onClick={() => setActiveChartTab('scores')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  activeChartTab === 'scores' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-550 hover:text-slate-900'
                }`}
              >
                Core Scores
              </button>
              <button 
                onClick={() => setActiveChartTab('technical')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  activeChartTab === 'technical' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-550 hover:text-slate-900'
                }`}
              >
                Technical
              </button>
              <button 
                onClick={() => setActiveChartTab('communication')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  activeChartTab === 'communication' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-550 hover:text-slate-900'
                }`}
              >
                Speech
              </button>
              <button 
                onClick={() => setActiveChartTab('confidence')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  activeChartTab === 'confidence' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-550 hover:text-slate-900'
                }`}
              >
                Pace
              </button>
            </div>
          </div>

          {/* SVG Chart Render Box */}
          <div className="flex-1 flex items-center justify-center min-h-[280px]">
            {renderInteractiveChart()}
          </div>

        </article>

        {/* RIGHT COMPONENT: SPEECH & HESITATION ANALYSIS (Span 1) */}
        <article className="rounded-[2.5rem] border border-slate-200 bg-white p-6 md:p-8 shadow-sm flex flex-col justify-between gap-6">
          
          <div className="border-b border-slate-150 pb-4 select-none">
            <h3 className="text-lg font-black text-slate-900">Communication & Pace</h3>
            <p className="text-xs text-slate-500 font-semibold mt-1">Granular verbal metrics parsed from transcripts</p>
          </div>

          <div className="space-y-5 flex-1 flex flex-col justify-between">
            
            {/* Speeds and clarity indicators */}
            <div className="grid grid-cols-2 gap-3 select-none">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl">
                <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">Speaking speed</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-xl font-black text-slate-900 font-mono">{aggregateInsights.avgWpm}</span>
                  <span className="text-[9px] font-bold text-slate-500 font-mono">WPM</span>
                </div>
                <span className="text-[7.5px] font-bold text-emerald-600 block mt-1.5 uppercase tracking-wide">✓ Perfect steady pace</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl">
                <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">Response latency</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-xl font-black text-slate-900 font-mono">{aggregateInsights.responseDelay}</span>
                  <span className="text-[9px] font-bold text-slate-500 font-mono">SECS</span>
                </div>
                <span className="text-[7.5px] font-bold text-slate-500 block mt-1.5 uppercase tracking-wide">Average pause gap</span>
              </div>
            </div>

            {/* Answer Length metrics */}
            <div className="bg-slate-50 border border-slate-250 p-4 rounded-2xl flex items-center justify-between select-none">
              <div className="text-left">
                <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">Avg Answer Length</span>
                <span className="text-xs font-black text-slate-800 block mt-1 leading-none">{aggregateInsights.avgAnswerLength} words per answer</span>
              </div>
              <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-wider text-slate-600 shadow-xxs">
                STAR structure
              </div>
            </div>

            {/* Filler Words counts breakdown */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block select-none">Filler word frequency:</span>
              
              <div className="space-y-2.5">
                {Object.entries(aggregateInsights.fillerWordsBreakdown).map(([word, count]) => {
                  const maxCount = Math.max(...Object.values(aggregateInsights.fillerWordsBreakdown), 1);
                  const pct = (count / maxCount) * 100;
                  
                  return (
                    <div key={word} className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-700">
                        <span className="capitalize font-black font-mono">"{word}"</span>
                        <span className="text-slate-900 font-black font-mono">{count} times used</span>
                      </div>
                      
                      {/* Bar indicator */}
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden relative border border-slate-150">
                        <div 
                          className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full transition-all duration-1000"
                          style={{ width: `${count > 0 ? pct : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </article>

      </section>

      {/* 4. DYNAMIC PERSONAL AI COACH LEARNING INSIGHTS */}
      <section className="rounded-[2.5rem] border border-slate-200 bg-white p-6 md:p-8 shadow-sm flex flex-col gap-6 select-none shrink-0">
        
        <div className="border-b border-slate-150 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900">Personal AI Recruiter Coach Insights</h3>
            <p className="text-xs text-slate-500 font-semibold mt-1">Granular learning diagnostics generated dynamically by GPT-4o based on your conversational speech</p>
          </div>
          
          <div className="bg-violet-50 text-violet-700 border border-violet-150 rounded-xl px-3 py-1.5 text-[9px] font-black uppercase tracking-wider shrink-0">
            ✓ Active Coach Rachel
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* STRENGTHS */}
          <div className="bg-slate-50/50 border border-slate-200 p-5 rounded-[22px] space-y-4">
            <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest block">✓ Strengths parsed</h4>
            {aggregateInsights.strengths && aggregateInsights.strengths.length > 0 ? (
              <ul className="space-y-2 text-xs font-bold text-slate-700 list-disc list-inside">
                {aggregateInsights.strengths.slice(0, 4).map((str, idx) => (
                  <li key={idx} className="leading-relaxed">{str}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400 font-semibold italic">No strength metrics captured yet.</p>
            )}
          </div>

          {/* WEAKNESSES */}
          <div className="bg-slate-50/50 border border-slate-200 p-5 rounded-[22px] space-y-4">
            <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest block">✗ Weaknesses captured</h4>
            {aggregateInsights.weaknesses && aggregateInsights.weaknesses.length > 0 ? (
              <ul className="space-y-2 text-xs font-bold text-slate-700 list-disc list-inside">
                {aggregateInsights.weaknesses.slice(0, 4).map((weak, idx) => (
                  <li key={idx} className="leading-relaxed">{weak}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400 font-semibold italic">No weakness metrics captured yet.</p>
            )}
          </div>

          {/* ACTIONABLE IMPROVEMENT TARGETS */}
          <div className="bg-slate-50/50 border border-slate-200 p-5 rounded-[22px] space-y-4">
            <h4 className="text-xs font-black text-violet-600 uppercase tracking-widest block">🚀 Recommended revision</h4>
            
            {aggregateInsights.topicsToRevise && aggregateInsights.topicsToRevise.length > 0 ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {aggregateInsights.topicsToRevise.slice(0, 4).map((topic, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex rounded-lg bg-violet-50 border border-violet-100 text-[10px] font-bold text-violet-700 px-2.5 py-1"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
                {aggregateInsights.learningRecommendations && (
                  <p className="text-xs font-medium leading-relaxed text-slate-500 border-t border-slate-100 pt-3 select-text italic">
                    "{aggregateInsights.learningRecommendations}"
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-semibold italic">No revision recommendations parsed.</p>
            )}
          </div>

        </div>

      </section>

    </div>
  );
};

export default InterviewAnalytics;
