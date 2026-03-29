import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasFlagged, setHasFlagged] = useState(false);
  const [noFlagMessage, setNoFlagMessage] = useState('');
  const [isFlagAccordionOpen, setIsFlagAccordionOpen] = useState(false);
  const [hasReceivedFollowUp, setHasReceivedFollowUp] = useState(false);
  
  const [transcript, setTranscript] = useState([]);
  const [insights, setInsights] = useState([]);
  const [sessionTime, setSessionTime] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [patientName, setPatientName] = useState('');
  
  // Follow-up interaction states
  const [assessmentNumber, setAssessmentNumber] = useState(1);
  const [isInteractiveMode, setIsInteractiveMode] = useState(false);
  const [inputRole, setInputRole] = useState('doctor');
  const [inputText, setInputText] = useState('');
  const [intelligenceAction, setIntelligenceAction] = useState(null);
  const [isIntelligenceLoading, setIsIntelligenceLoading] = useState(false);
  
  const timerRef = useRef(null);
  const transcriptEndRef = useRef(null);
  
  // Audio recording refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  // Auto-scroll to bottom of transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, isTyping]);

  // Session Timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setSessionTime(t => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const fetchClinicalIntelligence = async (currentTranscript, currentAssessmentNum) => {
    setIsIntelligenceLoading(true);
    try {
      const conversation = currentTranscript.map(m => ({
        role: m.type,
        content: m.text
      }));

      const response = await fetch('http://127.0.0.1:8000/api/suggest-next-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessment_number: currentAssessmentNum,
          conversation
        })
      });

      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      const res = data.result;

      if (res.goto_next_assessment) {
        const nextAssessment = currentAssessmentNum + 1;
        setAssessmentNumber(nextAssessment);
        // Automatically fetch the next question with the incremented assessment number
        return await fetchClinicalIntelligence(currentTranscript, nextAssessment);
      } else if (res.unlikely_depression) {
        setIntelligenceAction({ type: 'unlikely', text: 'Unlikely Depression. Further routing will apply.' });
        setHasReceivedFollowUp(true);
      } else if (res.next_question === 'PROTOCOL 1' || res.next_question === 'BIPOLAR PROTOCOL') {
        const protoRes = await fetch('http://127.0.0.1:8000/api/get_protocol', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ protocol_name: res.next_question })
        });
        const protoData = await protoRes.json();
        const steps = protoData[res.next_question] || [];
        setIntelligenceAction({ type: 'protocol', title: res.next_question, steps });
        setHasReceivedFollowUp(true);
      } else if (res.next_question) {
        setIntelligenceAction({ type: 'question', text: res.next_question });
        setHasReceivedFollowUp(true);
      } else {
        setIntelligenceAction({ type: 'info', text: 'Continuing conversation...' });
        if (hasFlagged) setHasReceivedFollowUp(true);
      }

    } catch (error) {
      console.error('Error fetching clinical intelligence:', error);
      setIntelligenceAction({ type: 'error', text: 'Failed to fetch suggestions from backend.' });
    } finally {
      setIsIntelligenceLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startOrResumeRecording = async (isNewSession = false) => {
    try {
      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      
      const mediaRecorder = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(200);
      
      setIsRecording(true);
      setIsPaused(false);
      setNoFlagMessage('');

      if (isNewSession) {
        setTranscript([]);
        setInsights([]);
        setSessionTime(0);
        setIsInteractiveMode(false);
        setIntelligenceAction(null);
        setInputRole('doctor');
        setInputText('');
        setAssessmentNumber(1);
        setHasFlagged(false);
        setIsFlagAccordionOpen(false);
        setHasReceivedFollowUp(false);
      }
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const pauseAndProcess = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
      };
      
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(true);
      setIsProcessing(true);
    }
  };

  const processAudio = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'record.webm');

      const transcribeRes = await fetch('http://127.0.0.1:8000/transcribe', {
        method: 'POST',
        body: formData
      });
      
      if (!transcribeRes.ok) throw new Error("Transcription failed");
      const transcribeData = await transcribeRes.json();
      const newConversation = transcribeData.conversation || [];

      const mappedNewTranscript = newConversation.map((msg, index) => ({
        id: Date.now() + index,
        speaker: msg.role === 'doctor' ? `Dr. Smith (GP)` : `${patientName} (Patient)`,
        type: msg.role,
        text: msg.content,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));

      const currentFullTranscript = [...transcript, ...mappedNewTranscript];
      setTranscript(currentFullTranscript);
      
      if (!currentFullTranscript || currentFullTranscript.length === 0) {
        setIsProcessing(false);
        return;
      }

      const apiConversation = currentFullTranscript.map(m => ({
        role: m.type,
        content: m.text
      }));

      if (!hasFlagged) {
        const analyzeRes = await fetch('http://127.0.0.1:8000/api/analyze-symptoms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversation: apiConversation })
        });
        
        if (!analyzeRes.ok) throw new Error("Analyze symptoms failed");
        
        const analyzeData = await analyzeRes.json();
        const res = analyzeData.result;
        
        if (res && res.possible_depression) {
          setHasFlagged(true);
          
          const title = (res.clusters_with_symptoms && res.clusters_with_symptoms.length > 0) 
            ? res.clusters_with_symptoms.join(" / ") + " Detected" 
            : "Possible Depression Detected";
            
          const tags = res.symptoms ? res.symptoms.map(s => ({ icon: 'psychology', text: s, color: 'accent-terracotta' })) : [];
          const mentions = res.symptom_phrases ? res.symptom_phrases.map(p => `"${p}"`) : [];
          
          setInsights([{
            title,
            mentions,
            tags,
            probes: []
          }]);
          
          setIsInteractiveMode(true);
          await fetchClinicalIntelligence(currentFullTranscript, assessmentNumber);
        } else {
          setNoFlagMessage("No flags detected yet. You can resume recording.");
        }
      } else {
        await fetchClinicalIntelligence(currentFullTranscript, assessmentNumber);
      }

    } catch (error) {
      console.error("Error during processing:", error);
      setNoFlagMessage("Error processing audio. Please try again or resume recording.");
    } finally {
      setIsProcessing(false);
    }
  };

  const endSession = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    navigate('/post-session-summary', { 
      state: { 
        patientName, 
        transcript, 
        insights, 
        sessionTime 
      } 
    });
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      id: Date.now(),
      speaker: inputRole === 'doctor' ? `Dr. Smith (GP)` : `${patientName} (Patient)`,
      type: inputRole,
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedTranscript = [...transcript, newMsg];
    setTranscript(updatedTranscript);
    setInputText('');

    if (inputRole === 'patient') {
      await fetchClinicalIntelligence(updatedTranscript, assessmentNumber);
    } else {
      setIntelligenceAction(null);
    }
  };

  // ───────────── Recording wave visualizer ─────────────
  const RecordingWave = () => (
    <div className="flex items-center gap-[3px] h-5">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="w-[3px] bg-primary rounded-full recording-wave-bar"
          style={{
            animationDuration: `${0.8 + i * 0.15}s`,
            animationDelay: `${i * 0.1}s`,
            height: '8px',
          }}
        />
      ))}
    </div>
  );

  return (
    <>
      {!isSetupComplete ? (
        /* ═══════════ SETUP SCREEN ═══════════ */
        <div className="flex flex-col h-screen w-full items-center justify-center font-sans tracking-tight relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f0fdf4 50%, #f8fafc 100%)' }}
        >
          {/* Decorative background circles */}
          <div className="absolute top-[-120px] right-[-80px] w-[400px] h-[400px] rounded-full bg-primary/5 animate-float" />
          <div className="absolute bottom-[-100px] left-[-100px] w-[350px] h-[350px] rounded-full bg-primary/3 animate-float" style={{ animationDelay: '1.5s' }} />

          <div className="bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-gray-100/80 w-full max-w-md mx-4 relative z-10 animate-scale-in">
            <div className="flex justify-center mb-6">
              <div className="h-16 flex items-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <img src="/somascribelogo.svg" alt="SomaScribe" className="h-full w-auto object-contain" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-text-main mb-2 animate-fade-in" style={{ animationDelay: '0.3s' }}>Initialize Session</h2>
            <p className="text-gray-500 text-center mb-8 text-sm animate-fade-in" style={{ animationDelay: '0.4s' }}>Enter the patient's name to prepare the live context.</p>
            
            <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Patient Name</label>
                <input 
                  type="text" 
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all placeholder:text-gray-300 shadow-sm bg-white/70 backdrop-blur-sm"
                  onKeyDown={(e) => e.key === 'Enter' && patientName.trim() && setIsSetupComplete(true)}
                  autoFocus
                />
              </div>
              <button 
                onClick={() => setIsSetupComplete(true)}
                disabled={!patientName.trim()}
                className="w-full mt-4 flex items-center justify-center rounded-xl h-12 bg-primary text-text-main hover:brightness-105 hover:shadow-lg hover:shadow-primary/20 transition-all font-semibold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                <span className="material-symbols-outlined mr-2 text-lg">play_arrow</span>
                Start SomaScribe
              </button>
            </div>
          </div>
        </div>
      ) : (
    /* ═══════════ MAIN SESSION SCREEN ═══════════ */
    <div className="flex flex-col h-screen w-full bg-surface text-text-main font-sans">
      {/* ──── Header ──── */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-gray-200/60 px-8 py-4 glass shrink-0 shadow-[0_4px_20px_rgb(0,0,0,0.03)] relative z-20 h-[80px] animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="h-8 flex items-center">
            <img src="/somascribelogo.svg" alt="SomaScribe Logo" className="h-full w-auto object-contain" />
          </div>
          <div>
            <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">SomaScribe Live</h2>
            <p className="text-sm text-gray-500 font-medium border-l pl-3 ml-3 border-gray-300 inline-block">Patient: {patientName}</p>
            {isRecording && (
              <p className="text-sm text-gray-500 font-medium border-l pl-3 ml-3 border-gray-300 inline-block animate-fade-in">
                Session Timer: <span className="text-gray-800 font-semibold tabular-nums">{formatTime(sessionTime)}</span>
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {isRecording ? (
            <>
              <div className="flex items-center gap-2.5 mr-2 bg-primary/5 px-4 py-2 rounded-full border border-primary/20 animate-fade-in animate-glow-pulse">
                <RecordingWave />
                <span className="text-sm font-medium text-gray-600">Recording live...</span>
              </div>
              <button 
                onClick={pauseAndProcess}
                className="flex items-center justify-center rounded-lg h-10 px-5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-semibold border border-amber-200/60 hover:border-amber-200 shadow-sm hover:shadow-md"
              >
                <span className="material-symbols-outlined mr-1.5 text-base">pause</span>
                Pause & Process
              </button>
            </>
          ) : isProcessing ? (
            <>
               <div className="flex items-center gap-2.5 mr-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-100 animate-fade-in">
                 <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                 <span className="text-sm font-medium text-primary">Transcribing & Analyzing...</span>
               </div>
            </>
          ) : isPaused || transcript.length > 0 ? (
            <div className="flex items-center gap-3 animate-fade-in">
              <button 
                onClick={() => startOrResumeRecording(false)}
                className="flex items-center border border-primary text-primary justify-center rounded-lg h-10 px-5 bg-primary/5 hover:bg-primary/15 text-sm font-semibold shadow-sm hover:shadow-md hover:shadow-primary/10"
              >
                <span className="material-symbols-outlined mr-1.5 text-base">mic</span>
                Resume Recording
              </button>
              <button 
                onClick={endSession}
                className="flex items-center justify-center rounded-lg h-10 px-5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold border border-red-200/60 hover:border-red-200 shadow-sm hover:shadow-md"
              >
                <span className="material-symbols-outlined mr-1.5 text-base">stop_circle</span>
                End Session
              </button>
            </div>
          ) : (
            <button 
              onClick={() => startOrResumeRecording(true)}
              className="flex items-center border border-primary text-primary justify-center rounded-lg h-10 px-5 bg-primary/5 hover:bg-primary/15 text-sm font-semibold shadow-sm hover:shadow-md hover:shadow-primary/10 animate-fade-in"
            >
              <span className="material-symbols-outlined mr-1.5 text-base">mic</span>
              Start Recording
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden lg:flex-row flex-col">
        {/* ──── Left Panel: Transcript ──── */}
        <section className="lg:w-[60%] w-full h-full flex flex-col bg-surface border-r border-gray-200/60 animate-slide-in-left" style={{ animationDuration: '0.6s' }}>
          <div className="px-8 py-4 border-b border-gray-100/60 bg-gray-50/30 flex justify-between items-center shrink-0">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-base">forum</span>
              Live Transcript
            </h3>
            {isRecording && <span className="text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full font-medium animate-fade-in">WhisperX Active</span>}
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 pb-24 scrollbar-hide custom-scrollbar">
            {!isRecording && transcript.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-40 animate-fade-in">
                <span className="material-symbols-outlined text-5xl mb-3 animate-float">mic</span>
                <p className="text-base">Click "Start Recording" to begin the session.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center gap-4 my-4 animate-fade-in">
                  <div className="h-px bg-gray-200 flex-1"></div>
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Session Started</span>
                  <div className="h-px bg-gray-200 flex-1"></div>
                </div>

                {transcript.map((msg, index) => (
                  <div 
                    key={msg.id} 
                    className={`flex items-end gap-3 animate-fade-in-up ${msg.type === 'doctor' ? 'justify-end' : ''}`}
                    style={{ animationDelay: `${Math.min(index * 60, 400)}ms` }}
                  >
                    {msg.type === 'patient' && (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                        <span className="material-symbols-outlined text-gray-400">person</span>
                      </div>
                    )}
                    <div className={`flex flex-col gap-1 max-w-[80%] ${msg.type === 'doctor' ? 'items-end' : 'items-start'}`}>
                      <span className={`text-gray-500 text-xs font-medium ${msg.type === 'doctor' ? 'mr-1' : 'ml-1'}`}>{msg.speaker} • {msg.time}</span>
                      <div className={`text-[15px] leading-relaxed px-5 py-3 rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.02)] hover:shadow-[0_4px_16px_rgb(0,0,0,0.05)] transition-all duration-300 ${msg.type === 'doctor' ? 'rounded-br-none border border-gray-200/60 bg-white' : 'rounded-bl-none bg-patient-bubble border border-primary/20'}`}>
                        {msg.text}
                      </div>
                    </div>
                    {msg.type === 'doctor' && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                        <span className="material-symbols-outlined text-sm text-primary">stethoscope</span>
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-end gap-3 opacity-70 animate-fade-in">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                      <span className="material-symbols-outlined text-gray-400">person</span>
                    </div>
                    <div className="flex flex-col gap-1 items-start max-w-[80%]">
                      <div className="px-5 py-3 rounded-2xl rounded-bl-none bg-patient-bubble border border-primary/20 flex items-center gap-1.5 min-h-[48px]">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={transcriptEndRef} />
              </>
            )}
          </div>

          {/* ──── Interactive Input Bar ──── */}
          {isInteractiveMode && (
            <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-200 shrink-0 animate-fade-in-up" style={{ animationDuration: '0.3s' }}>
              <form onSubmit={handleManualSubmit} className="flex items-center gap-3">
                <select 
                  value={inputRole} 
                  onChange={(e) => setInputRole(e.target.value)}
                  className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  <option value="doctor">Doctor</option>
                  <option value="patient">Patient</option>
                </select>
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Type ${inputRole}'s response...`}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white"
                  autoFocus
                />
                <button 
                  type="submit"
                  disabled={!inputText.trim() || isIntelligenceLoading}
                  className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center shrink-0 disabled:opacity-40 hover:shadow-lg hover:shadow-primary/20 hover:brightness-110"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                </button>
              </form>
            </div>
          )}
        </section>

        {/* ──── Right Panel: Clinical Intelligence ──── */}
        <section className="lg:w-[40%] w-full h-full flex flex-col bg-background-light animate-slide-in-right" style={{ animationDuration: '0.6s' }}>
          <div className="px-8 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm shrink-0">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-accent-terracotta">lightbulb</span>
              Clinical Intelligence
            </h3>
          </div>
          
          <div className="flex-1 flex flex-col p-6 overflow-y-auto custom-scrollbar">
            {insights.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="max-w-sm space-y-6 w-full">
                  {isProcessing ? (
                     <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden flex flex-col items-center text-center animate-scale-in">
                        <div className="absolute top-0 left-0 w-full h-[3px] shimmer bg-gradient-to-r from-transparent via-primary to-transparent opacity-60"></div>
                        <div className="w-12 h-12 border-[3px] border-primary border-t-transparent rounded-full animate-spin mb-5 mt-2"></div>
                        <h4 className="text-lg font-semibold text-gray-800 tracking-tight">Processing Audio</h4>
                        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                          Transcribing and analyzing for somatic markers...
                        </p>
                     </div>
                  ) : isRecording ? (
                    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden flex flex-col items-center text-center animate-scale-in animate-glow-pulse">
                      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-60 animate-[pulse_2s_ease-in-out_infinite]"></div>
                      <div className="relative flex h-16 w-16 items-center justify-center mb-3 mt-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-15"></span>
                        <div className="relative flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary">
                          <span className="material-symbols-outlined text-2xl">mic</span>
                        </div>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-800 tracking-tight">Listening</h4>
                      <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                        Recording audio... Click "Pause & Process" when ready for analysis.
                      </p>
                    </div>
                  ) : noFlagMessage ? (
                    <div className="bg-blue-50/50 rounded-2xl p-8 border border-blue-100 flex flex-col items-center gap-3 text-center animate-fade-in-up">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                        <span className="material-symbols-outlined">info</span>
                      </div>
                      <h4 className="text-gray-800 font-medium">{noFlagMessage}</h4>
                      <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                        Click "Resume Recording" to continue the session and gather more context.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-50/50 rounded-2xl p-8 border border-gray-100 border-dashed flex flex-col items-center gap-3 text-center animate-fade-in">
                      <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 animate-float">
                        <span className="material-symbols-outlined text-2xl">psychology</span>
                      </div>
                      <h4 className="text-gray-600 font-medium">Intelligence Offline</h4>
                      <p className="text-xs text-gray-400">Start recording to enable AI analysis and actionable insights.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                {insights.map((insight, idx) => (
                  <div key={idx} className="mb-4">
                    {/* ── Flag Accordion Section ── */}
                    <div className={`rounded-xl shadow-sm border overflow-hidden relative transition-all duration-400 ${
                      hasReceivedFollowUp 
                        ? 'border-accent-terracotta/20 bg-orange-50/30' 
                        : 'border-accent-terracotta/30 bg-orange-50/50 animate-scale-in'
                    }`}>
                      {/* Accent left bar */}
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-accent-terracotta"></div>

                      {/* "Just Flagged" badge - only on first appearance */}
                      {!hasReceivedFollowUp && (
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent-terracotta text-white text-[10px] font-bold uppercase tracking-wider shadow-sm z-20 animate-pulse-subtle">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                          Just Flagged
                        </div>
                      )}

                      {/* Accordion Header (clickable when collapsed) */}
                      <div 
                        className={`p-5 ${hasReceivedFollowUp ? 'cursor-pointer hover:bg-orange-50/60 transition-colors' : ''}`}
                        onClick={() => hasReceivedFollowUp && setIsFlagAccordionOpen(prev => !prev)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-accent-terracotta">
                            <span className="material-symbols-outlined text-sm">warning</span>
                            <span className="text-xs font-bold uppercase tracking-wider">Bradford Somatic Inventory</span>
                            {hasReceivedFollowUp && (
                              <span className="ml-2 px-2 py-0.5 rounded-full bg-accent-terracotta/10 text-[10px] font-bold text-accent-terracotta border border-accent-terracotta/20">
                                {insight.title}
                              </span>
                            )}
                          </div>
                          {hasReceivedFollowUp && (
                            <span className={`material-symbols-outlined text-base text-gray-400 transition-transform duration-300 ${isFlagAccordionOpen ? 'rotate-180' : ''}`}>
                              expand_more
                            </span>
                          )}
                        </div>

                        {/* Expanded content (always shown when no follow-up yet, toggled after) */}
                        <div className={`flag-accordion-content ${hasReceivedFollowUp && !isFlagAccordionOpen ? 'collapsed' : 'expanded'}`}>
                          <h4 className="text-lg font-serif font-semibold text-text-main mb-2 mt-2">
                            Patient Mentions: {insight.mentions.map((m, i) => <span key={i} className="italic text-gray-700">{m}{i < insight.mentions.length - 1 ? ' & ' : ''}</span>)}
                          </h4>
                          
                          <div className="flex items-center gap-2 mb-4">
                            <span className="px-2 py-0.5 rounded bg-white border border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-tight">Cluster Detected</span>
                            <span className="text-sm font-medium text-text-main shrink-0">{insight.title}</span>
                          </div>

                          <div className="flex flex-wrap gap-2 stagger-children">
                            {insight.tags.map((tag, i) => (
                              <span key={i} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border shadow-sm hover:shadow-md transition-all duration-200 animate-fade-in-up ${tag.color === 'primary' ? 'border-primary/30 text-primary' : 'border-accent-terracotta/40 text-accent-terracotta'}`}>
                                <span className="material-symbols-outlined text-[16px]">{tag.icon}</span>
                                <span className="text-sm font-medium text-text-main">{tag.text}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Follow-up Question (Main Content) ── */}
                    {hasReceivedFollowUp ? (
                      <div className="mt-4 bg-white rounded-xl border border-primary/25 shadow-[0_4px_24px_rgb(0,0,0,0.04)] overflow-hidden animate-fade-in-up">
                        <div className="border-l-[3px] border-primary p-5">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                              <span className="material-symbols-outlined text-primary text-sm">assistant</span>
                              Suggested Follow-up
                              <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase">mhGAP Aligned</span>
                            </h5>
                          </div>
                          
                          {isIntelligenceLoading ? (
                            <div className="flex items-center gap-2.5 text-primary font-medium text-sm animate-pulse py-2">
                              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                              Generating next question...
                            </div>
                          ) : intelligenceAction ? (
                            <div className="animate-fade-in-up">
                              {intelligenceAction.type === 'protocol' ? (
                                <>
                                  <p className="font-serif italic font-bold text-text-main text-[16px] leading-relaxed uppercase">{intelligenceAction.title}</p>
                                  <ul className="mt-3 space-y-2">
                                    {intelligenceAction.steps.map((step, i) => (
                                      <li key={i} className="text-[13px] text-gray-700 leading-relaxed flex gap-2 items-start">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>{step}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </>
                              ) : intelligenceAction.type === 'question' ? (
                                <div className="bg-primary/5 rounded-lg p-4 border border-primary/15">
                                  <p className="font-serif italic text-text-main text-[16px] leading-relaxed">"{intelligenceAction.text}"</p>
                                </div>
                              ) : (
                                <p className="font-serif text-text-main text-[15px] leading-relaxed font-medium">{intelligenceAction.text}</p>
                              )}
                              <span className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter mt-3 block">Source: Follow-up Module • Assessment #{assessmentNumber}</span>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic animate-fade-in">Waiting for patient response...</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* First-time view: follow-up embedded inside flag card */
                      <div className="mt-0 -translate-y-px">
                        <div className="bg-orange-50/30 rounded-b-xl border border-t-0 border-accent-terracotta/20 overflow-hidden">
                          <div className="border-l-2 border-primary ml-5 mr-5 my-4 pl-4 py-1 bg-white/60 rounded-r-lg p-3">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dynamic mhGAP Probes</h5>
                            </div>
                            <ul className="space-y-4">
                              {isIntelligenceLoading ? (
                                <div className="flex items-center gap-2.5 text-primary font-medium text-sm animate-pulse">
                                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                  Fetching next question...
                                </div>
                              ) : intelligenceAction ? (
                                <li className="flex items-start gap-3 cursor-pointer hover:bg-white/80 p-2 rounded-r-lg -ml-2 transition-all duration-200 animate-fade-in-up">
                                  <button className="mt-0.5 w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center shrink-0 hover:border-primary hover:bg-primary/10 transition-colors">
                                    <span className="material-symbols-outlined text-[12px] text-gray-400 hover:text-primary">add</span>
                                  </button>
                                  <div>
                                    {intelligenceAction.type === 'protocol' ? (
                                      <>
                                        <p className="font-serif italic font-bold text-text-main text-[14px] leading-relaxed uppercase">{intelligenceAction.title}</p>
                                        <ul className="mt-2 space-y-1">
                                          {intelligenceAction.steps.map((step, i) => (
                                            <li key={i} className="text-[12px] text-gray-700 leading-relaxed flex gap-1"><span className="text-primary">•</span>{step}</li>
                                          ))}
                                        </ul>
                                      </>
                                    ) : intelligenceAction.type === 'question' ? (
                                      <p className="font-serif italic text-text-main text-[14px] leading-relaxed">"{intelligenceAction.text}"</p>
                                    ) : (
                                      <p className="font-serif text-text-main text-[14px] leading-relaxed font-medium">{intelligenceAction.text}</p>
                                    )}
                                    <span className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter mt-1 block">Source: Follow-up Module</span>
                                  </div>
                                </li>
                              ) : (
                                <p className="text-sm text-gray-500 italic animate-fade-in">Waiting for analysis...</p>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
          
          <div className="px-8 py-4 bg-white/80 backdrop-blur-sm border-t border-gray-100 shrink-0">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-gray-400 text-base mt-0.5">info</span>
              <p className="text-[11px] leading-relaxed text-gray-400"><span className="font-semibold text-gray-500">Decision Support Disclaimer:</span> Suggestions are AI-generated based on detected somatic markers and do not constitute a diagnosis.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
      )}
    </>
  );
}
