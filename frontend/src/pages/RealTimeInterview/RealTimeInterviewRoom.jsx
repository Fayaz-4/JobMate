import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSessionReport, endSession } from '../../services/realTimeInterviewService';
import vapi from '../../services/vapiService';

const RealTimeInterviewRoom = () => {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();

  // Webcam Video Refs
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // States
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [callStatus, setCallStatus] = useState('disconnected'); // disconnected, connecting, active, ending
  const [vapiCallId, setVapiCallId] = useState(null);
  
  // Real-time transcript captions
  const [liveCaption, setLiveCaption] = useState('Welcome candidate! Connect your microphone and camera, then click "Start AI Interview" below to begin.');
  const [transcriptRole, setTranscriptRole] = useState('assistant'); // assistant or user
  
  // Device Controls
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Timer States
  const [timeElapsed, setTimeElapsed] = useState(0); // in seconds
  const [sessionDuration, setSessionDuration] = useState(30);

  // Volume level states for dynamic soundwave equalizer
  const [assistantVolume, setAssistantVolume] = useState(0);
  const [userVolume, setUserVolume] = useState(0);

  // Canvas Ref
  const canvasRef = useRef(null);

  // Refs for Web Audio API monitoring of user mic track
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const micAnimationFrameRef = useRef(null);
  const vapiCallIdRef = useRef(null);

  // Initialize browser permissions and streams
  useEffect(() => {
    loadSessionRoom();
    return () => {
      stopCameraAndMic();
      try {
        vapi.stop();
      } catch (err) {}
      vapi.removeAllListeners();
    };
  }, [sessionId]);

  // Timer Tick-tock Effect when call is active
  useEffect(() => {
    if (callStatus !== 'active') return;
    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callStatus]);

  // Dynamic Neon Canvas Equalizer Animation Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let phase = 0;

    // Number of vertical equalizer spikes per side (left & right)
    const numBars = 22;
    const smoothedHeights = new Array(numBars).fill(0);

    const render = () => {
      // Keep canvas resolution synchronized with CSS display size for maximum sharpness
      if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // 1. Get real-time audio data and determine active speaker states
      let activeVolume = 0;
      let isAiSpeaking = false;
      let isUserSpeaking = false;

      if (callStatus === 'active') {
        if (assistantVolume > 0.01) {
          activeVolume = assistantVolume;
          isAiSpeaking = true;
        } else if (userVolume > 0.05) {
          activeVolume = userVolume;
          isUserSpeaking = true;
        }
      }

      // Apply logarithmic gain compression to make the voice highly responsive
      const mappedVolume = Math.min(1.0, Math.pow(activeVolume, 0.7) * 1.35);

      // 2. Fetch User frequency data if active
      const freqData = new Uint8Array(128);
      if (isUserSpeaking && audioContextRef.current && analyserRef.current) {
        analyserRef.current.getByteFrequencyData(freqData);
      }

      // Calculate zone coordinates (symmetrical left and right of the cylinder speaker)
      // The central speaker cylinder is centered and occupies roughly width * 0.38 to width * 0.62
      const leftStart = width * 0.04;
      const leftEnd = width * 0.36;
      const rightStart = width * 0.64;
      const rightEnd = width * 0.96;

      const zoneWidth = leftEnd - leftStart;
      const spacing = zoneWidth / (numBars - 1);

      // 3. Compute target heights for each equalizer spike
      for (let i = 0; i < numBars; i++) {
        let targetHeight = 0;

        if (isUserSpeaking) {
          // Real-time frequency mapping! Mirror bass near center and treble near outer edges
          const binIndex = Math.floor((i / numBars) * 35) + 2; 
          const freqVal = freqData[binIndex] || 0;
          // Scale relative to height
          targetHeight = (freqVal / 255.0) * (height * 0.58);
          // Add organic mic noise modulation
          targetHeight += Math.random() * (activeVolume * 8);
        } else if (isAiSpeaking) {
          // Dynamic pseudo-spectrum for Rachel's voice
          const waveFactor = 0.25 
            + Math.sin(phase * 2.2 + i * 0.75) * 0.4 
            + Math.cos(phase * 1.1 - i * 0.45) * 0.25;
          targetHeight = Math.max(0.05, waveFactor) * mappedVolume * (height * 0.52);
        } else if (callStatus === 'connecting') {
          // Connecting state: Scanning ripple wave
          const scanFactor = 0.15 + Math.sin(phase * 1.6 + i * 0.45) * 0.1;
          targetHeight = scanFactor * (height * 0.35);
        } else {
          // Idle state: Slow, elegant breathing wave
          const breathFactor = 0.04 + Math.sin(phase * 1.0 + i * 0.22) * 0.02;
          targetHeight = breathFactor * (height * 0.24);
        }

        // Apply temporal smoothing for fluid transitions
        const smoothSpeed = isUserSpeaking ? 0.26 : 0.18;
        smoothedHeights[i] = smoothedHeights[i] * (1 - smoothSpeed) + targetHeight * smoothSpeed;

        // Guarantee a minimum height so visualizer lines remain softly visible
        if (smoothedHeights[i] < 3.0) {
          smoothedHeights[i] = 3.0;
        }
      }

      // 4. Draw the vertical spikes symmetrically on the left and right
      ctx.lineCap = 'round';
      
      for (let i = 0; i < numBars; i++) {
        const barHeight = smoothedHeights[i];
        
        // Calculate HSL gradients based on spike position (inner to outer edges)
        let color;
        let shadowColor;
        const progress = i / (numBars - 1); // 0 (near cylinder) to 1 (near edges)

        if (isAiSpeaking) {
          // Neon Blue near speaker, transitioning to Neon Purple/Pink at the edges
          color = `hsla(${210 + progress * 110}, 95%, 65%, 0.95)`;
          shadowColor = `hsla(${210 + progress * 110}, 95%, 55%, 0.65)`;
        } else if (isUserSpeaking) {
          // Neon Emerald Green near speaker, transitioning to Neon Gold/Orange at the edges
          color = `hsla(${140 + progress * 80}, 95%, 55%, 0.95)`;
          shadowColor = `hsla(${140 + progress * 80}, 95%, 45%, 0.65)`;
        } else if (callStatus === 'connecting') {
          // Searching: Glowing amber/yellow
          color = `hsla(${35 + progress * 20}, 90%, 60%, 0.65)`;
          shadowColor = `hsla(${35 + progress * 20}, 90%, 50%, 0.45)`;
        } else {
          // Idle/Silent: Ambient slate blue/indigo
          color = `hsla(${225 + progress * 20}, 75%, 70%, 0.4)`;
          shadowColor = `hsla(${225 + progress * 20}, 75%, 60%, 0.25)`;
        }

        ctx.strokeStyle = color;
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = callStatus === 'disconnected' ? 4 : 15;
        ctx.lineWidth = Math.max(3.0, width * 0.0075); // Spike thickness scale

        // Draw Left Spike (Inner to Outer: leftEnd to leftStart)
        const xLeft = leftEnd - i * spacing;
        ctx.beginPath();
        ctx.moveTo(xLeft, centerY - barHeight / 2);
        ctx.lineTo(xLeft, centerY + barHeight / 2);
        ctx.stroke();

        // Draw Right Spike (Inner to Outer: rightStart to rightEnd)
        const xRight = rightStart + i * spacing;
        ctx.beginPath();
        ctx.moveTo(xRight, centerY - barHeight / 2);
        ctx.lineTo(xRight, centerY + barHeight / 2);
        ctx.stroke();
      }

      phase += 0.045 + (mappedVolume * 0.075); // Wave cycle speed
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [callStatus, assistantVolume, userVolume]);

  // Load Room Details
  const loadSessionRoom = async () => {
    setLoading(true);
    try {
      const data = await getSessionReport(sessionId);
      setSession(data);
      setSessionDuration(data.duration || 30);

      // Start local WebRTC media stream preview
      await initWebRTCStream();
    } catch (err) {
      console.error("Room loading error", err);
      alert("Failed to load interview session details.");
    } finally {
      setLoading(false);
    }
  };

  // WebRTC Camera & Microphone Stream Handlers
  const initWebRTCStream = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        startUserVolumeMonitoring(stream);
      }
    } catch (e) {
      console.warn("Media capture permissions rejected or unavailable.", e);
      setCameraActive(false);
      setMicActive(false);
    }
  };

  // Monitor user mic frequency amplitude via browser Web Audio API Analyser Node
  const startUserVolumeMonitoring = (stream) => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      const audioCtx = new AudioContextClass();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Sum frequency band volumes
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        
        // Map average amplitude to 0-1 range
        setUserVolume(average / 110.0);

        micAnimationFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn("Failed to initialize user volume monitor", e);
    }
  };

  const stopUserVolumeMonitoring = () => {
    if (micAnimationFrameRef.current) {
      cancelAnimationFrame(micAnimationFrameRef.current);
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (err) {}
    }
    audioContextRef.current = null;
    analyserRef.current = null;
  };

  const toggleCamera = () => {
    if (mediaStreamRef.current) {
      const videoTracks = mediaStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !cameraActive;
      });
      setCameraActive(!cameraActive);
    }
  };

  const toggleMic = () => {
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !micActive;
      });
      setMicActive(!micActive);
      try {
        vapi.setMuted(!micActive);
      } catch (err) {
        console.warn("Failed to toggle Vapi mic state", err);
      }
    }
  };

  const toggleFullScreen = () => {
    const videoContainer = document.getElementById('camera-preview-container');
    if (!videoContainer) return;

    if (!isFullScreen) {
      if (videoContainer.requestFullscreen) {
        videoContainer.requestFullscreen();
      }
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullScreen(false);
    }
  };

  const stopCameraAndMic = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    stopUserVolumeMonitoring();
  };

  // Start Vapi Call
  const startVapiInterview = () => {
    if (!session || !session.vapiAssistantConfig) {
      alert("AI Assistant configuration is not ready. Please try again.");
      return;
    }

    setCallStatus('connecting');
    setLiveCaption('Establishing secure WebRTC voice channel to Rachel...');

    vapi.removeAllListeners();

    vapi.on('call-start-success', (event) => {
      if (event && event.callId) {
        setVapiCallId(event.callId);
        vapiCallIdRef.current = event.callId;
      }
    });

    vapi.on('call-start', () => {
      setCallStatus('active');
      setLiveCaption('Rachel is introducing the interview round...');
    });

    vapi.on('call-end', () => {
      setCallStatus('ending');
      setAssistantVolume(0);
      setLiveCaption('Voice session concluded. Synthesizing granular metrics...');
      triggerEndSession(vapiCallIdRef.current);
    });

    vapi.on('message', (message) => {
      if (message.type === 'transcript') {
        const text = message.transcript;
        if (text && text.trim().length > 0) {
          setLiveCaption(text);
          setTranscriptRole(message.role);
        }
      }
    });

    vapi.on('volume-level', (vol) => {
      setAssistantVolume(vol || 0);
    });

    vapi.on('error', (err) => {
      console.error("Vapi call error", err);
      setAssistantVolume(0);
      alert("A voice connection error occurred. Reconnecting...");
      setCallStatus('disconnected');
    });

    try {
      vapi.start(session.vapiAssistantConfig);
    } catch (err) {
      console.error("Failed to start Vapi call", err);
      alert("Failed to start real-time voice call. Please check microphone permissions.");
      setCallStatus('disconnected');
    }
  };

  const handleEndSession = () => {
    try {
      vapi.stop();
    } catch (err) {
      console.warn("Failed to stop Vapi call", err);
      setCallStatus('ending');
      triggerEndSession(vapiCallIdRef.current);
    }
  };

  const triggerEndSession = async (callId) => {
    setCallStatus('ending');
    stopCameraAndMic();
    try {
      await endSession(sessionId, callId);
      navigate('/realtime-interview');
    } catch (err) {
      console.error("Failed to conclude mock session", err);
      navigate('/realtime-interview');
    }
  };

  // Format Elapsed Timer
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-[#2563EB] animate-spin"></div>
        <p className="text-xs font-bold text-slate-500">Preparing Virtual Interview Lobby...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased text-[#0F172A] flex flex-col justify-between">
      
      {/* 1. ROOM HEADER BAR */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between select-none shadow-xs">
        <div className="flex items-center gap-3">
          {callStatus === 'active' ? (
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10B981]"></div>
          ) : (
            <div className="h-2.5 w-2.5 rounded-full bg-slate-300"></div>
          )}
          <div>
            <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider">Virtual AI Recruiter Room</h2>
            <span className="text-xs font-extrabold text-[#0F172A] block mt-0.5">
              Role: <span className="text-[#2563EB]">{session?.jobTitle || "Software Engineer"}</span>
            </span>
          </div>
        </div>

        {/* Dynamic Timer Box */}
        <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
            <span className="text-slate-500">⏱️ Time Elapsed:</span>
            <span className="text-[#0F172A] font-mono">{formatTime(timeElapsed)}</span>
            <span className="text-slate-350">/</span>
            <span>{sessionDuration}:00</span>
          </div>

          <div className="hidden sm:block bg-blue-50 border border-blue-100 text-[#2563EB] px-3 py-1.5 rounded-xl font-extrabold">
            <span>COMPANY: <span className="uppercase tracking-wider">{session?.companyName || "TARGET COMPANY"}</span></span>
          </div>
        </div>
      </header>

      {/* 2. CORE MEET LAYOUT GRID */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 items-stretch">
        
        {/* LEFT COLUMN: VIRTUAL AI RECRUITER WIDGET */}
        <section className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm flex flex-col justify-between space-y-6">
          
          {/* Avatar Panel with dynamic glowing Canvas Equalizer and speaker background */}
          <div className="flex-1 relative rounded-[24px] overflow-hidden border border-slate-800 shadow-md bg-slate-950 flex flex-col items-center justify-between min-h-[300px]">
            {/* Background Speaker Equalizer Image */}
            <img 
              src="/speaker_equalizer.png" 
              alt="AI Recruiter" 
              className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0"
            />
            
            {/* Overlay Neon Canvas Waves */}
            <canvas 
              ref={canvasRef} 
              width={600} 
              height={300} 
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
            />

            {/* Glowing Speaker Indicator Status Bar */}
            <div className="relative z-20 w-full bg-slate-950/85 backdrop-blur-md border-t border-slate-800/80 px-6 py-4 flex items-center justify-between mt-auto select-none">
              <div className="flex items-center gap-2.5">
                {/* Active Indicator Pulse */}
                <div className={`h-2.5 w-2.5 rounded-full transition-all duration-500 ${
                  callStatus === 'active' 
                    ? assistantVolume > 0.01 
                      ? 'bg-blue-400 animate-pulse shadow-[0_0_10px_#60A5FA]' 
                      : userVolume > 0.05 
                        ? 'bg-emerald-400 animate-pulse shadow-[0_0_10px_#34D399]' 
                        : 'bg-indigo-500 shadow-[0_0_6px_#6366F1]'
                    : callStatus === 'connecting'
                      ? 'bg-amber-400 animate-ping'
                      : 'bg-slate-650'
                }`}></div>
                
                <div className="text-left">
                  <span className={`text-[9px] font-black uppercase tracking-widest block transition-colors duration-300 ${
                    callStatus === 'active'
                      ? assistantVolume > 0.01
                        ? 'text-blue-400'
                        : userVolume > 0.05
                          ? 'text-emerald-400'
                          : 'text-indigo-400'
                      : callStatus === 'connecting'
                        ? 'text-amber-400'
                        : 'text-slate-500'
                  }`}>
                    {callStatus === 'active'
                      ? assistantVolume > 0.01
                        ? 'Rachel Speaking...'
                        : userVolume > 0.05
                          ? 'Candidate Speaking...'
                          : 'AI Recruiter Active'
                      : callStatus === 'connecting'
                        ? 'Connecting...'
                        : 'AI Coach Offline'}
                  </span>
                  
                  <span className="text-[10px] font-bold text-slate-300 block mt-0.5 max-w-[280px] sm:max-w-md truncate">
                    {callStatus === 'active' 
                      ? assistantVolume > 0.01 
                        ? "Rachel is asking a question..." 
                        : userVolume > 0.05 
                          ? "Listening to your answer..." 
                          : "Voice session active" 
                      : callStatus === 'connecting' 
                        ? "Establishing WebRTC voice channel to Rachel..." 
                        : callStatus === 'ending' 
                          ? "Synthesizing granular metrics..." 
                          : "Click 'Start AI Interview' to connect"}
                  </span>
                </div>
              </div>

              {/* Status Mini Pill */}
              <div className={`px-2.5 py-1 rounded-lg border text-[8px] font-black uppercase tracking-wider ${
                callStatus === 'active'
                  ? assistantVolume > 0.01
                    ? 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                    : userVolume > 0.05
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400'
                  : callStatus === 'connecting'
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                    : 'border-slate-800 bg-slate-900 text-slate-500'
              }`}>
                {callStatus === 'active' ? 'Live connected' : callStatus === 'connecting' ? 'Connecting' : 'Disconnected'}
              </div>
            </div>
          </div>

          {/* Question & Transcription caption feed */}
          <div className="bg-slate-50 border border-slate-200 shadow-xs rounded-[20px] p-5 space-y-3">
            <div className="flex items-center justify-between text-[9px] font-black tracking-widest block border-b border-slate-200 pb-2 select-none">
              <span className="text-[#2563EB] uppercase">Real-Time Transcription Captions:</span>
              {callStatus === 'active' && (
                <span className="flex items-center gap-1 text-emerald-600 font-extrabold animate-pulse">
                  ● Streaming Audio
                </span>
              )}
            </div>

            <div className="min-h-[90px] font-extrabold text-sm text-slate-800 leading-relaxed italic whitespace-pre-line">
              "{liveCaption}"
            </div>
            
            {callStatus === 'active' && (
              <span className="text-[9px] font-black block text-slate-400 select-none uppercase tracking-widest">
                Speaker: {transcriptRole === 'assistant' ? 'Rachel (AI Coach)' : 'You (Candidate)'}
              </span>
            )}
          </div>

        </section>

        {/* RIGHT COLUMN: CANDIDATE WEBRTC PREVIEW */}
        <section className="flex flex-col gap-6 justify-between items-stretch">
          
          {/* HTML5 Camera Video Frame */}
          <div 
            id="camera-preview-container"
            className="flex-1 bg-slate-900 border border-slate-200 rounded-[28px] overflow-hidden relative shadow-sm min-h-[220px] flex items-center justify-center"
          >
            {cameraActive ? (
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted
                className="h-full w-full object-cover transform scale-x-[-1]"
              />
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-center select-none bg-slate-950">
                <span className="text-3xl mb-2">📹</span>
                <span className="text-xs font-bold text-slate-500">Camera preview disabled</span>
              </div>
            )}

            {/* Overlaid Candidate Name Badge */}
            <div className="absolute bottom-4 left-4 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700 text-[10px] font-black text-slate-350 uppercase tracking-wider select-none">
              Candidate Preview
            </div>

            {/* Overlaid Camera Control Pills */}
            <div className="absolute top-4 right-4 flex gap-2 select-none z-10">
              <button 
                onClick={toggleFullScreen}
                className="h-8 w-8 rounded-xl bg-slate-900/80 border border-slate-700 hover:bg-slate-800 flex items-center justify-center text-slate-300 transition cursor-pointer"
                title="Toggle Full Screen"
              >
                ⛶
              </button>
            </div>
          </div>

          {/* Device indicators */}
          <div className="bg-white border border-slate-200 rounded-[28px] p-5 shadow-sm space-y-4 select-none">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Hardware & Connectivity:</span>

            <div className="grid grid-cols-2 gap-3 text-center text-[10px] font-bold text-slate-600">
              <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                <span className="text-slate-400 font-extrabold uppercase tracking-wide">Mic Status</span>
                <span className={`block mt-1 font-black uppercase ${micActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {micActive ? 'Active' : 'Muted'}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                <span className="text-slate-400 font-extrabold uppercase tracking-wide">Vapi Call Channel</span>
                <span className={`block mt-1 font-black uppercase ${callStatus === 'active' ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {callStatus === 'active' ? 'Live connected' : callStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>

        </section>

      </main>

      {/* 3. BOTTOM CONTROL PANEL */}
      <footer className="bg-white border-t border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 select-none shadow-xs">
        
        {/* Toggle Devices Mute Controls */}
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleCamera}
            className={`h-10 px-4 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              cameraActive 
                ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-[#0F172A]' 
                : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100/50'
            }`}
          >
            <span>{cameraActive ? '📹 Disable Camera' : '📹 Enable Camera'}</span>
          </button>

          <button 
            onClick={toggleMic}
            className={`h-10 px-4 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              micActive 
                ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-[#0F172A]' 
                : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100/50'
            }`}
          >
            <span>{micActive ? '🎙️ Mute Mic' : '🎙️ Unmute Mic'}</span>
          </button>
        </div>

        {/* Center operational controls */}
        <div className="flex items-center gap-3">
          {callStatus === 'disconnected' ? (
            <button
              onClick={startVapiInterview}
              className="h-10 px-6 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-black transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>▶ Start AI Interview</span>
            </button>
          ) : callStatus === 'active' ? (
            <button
              onClick={handleEndSession}
              className="h-10 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>■ End AI Interview</span>
            </button>
          ) : (
            <button
              disabled
              className="h-10 px-6 rounded-xl bg-slate-100 text-slate-400 text-xs font-black transition flex items-center justify-center gap-1.5 select-none"
            >
              <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-350 border-t-slate-500 animate-spin"></div>
              <span>Processing...</span>
            </button>
          )}
        </div>

        {/* Exit Control */}
        <div>
          <button
            onClick={() => {
              stopCameraAndMic();
              try { vapi.stop(); } catch (err) {}
              navigate('/realtime-interview');
            }}
            className="h-10 px-5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition text-xs font-bold cursor-pointer"
          >
            Quit Interview Room
          </button>
        </div>

      </footer>

    </div>
  );
};

export default RealTimeInterviewRoom;
