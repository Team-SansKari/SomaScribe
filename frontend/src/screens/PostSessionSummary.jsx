import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function PostSessionSummary() {
  const navigate = useNavigate();
  const location = useLocation();
  const [dismissedInsights, setDismissedInsights] = useState([]);
  
  const { 
    patientName = 'Aisha Sharma', 
    transcript = [], 
    insights = [], 
    sessionTime = 0 
  } = location.state || {};

  const m = Math.floor((sessionTime || 0) / 60);
  const s = (sessionTime || 0) % 60;
  const wordCount = transcript.reduce((acc, curr) => acc + (curr.text ? curr.text.split(' ').length : 0), 0);

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden text-text-main font-sans">
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-gray-200/60 glass px-8 py-4 shrink-0 shadow-[0_4px_20px_rgb(0,0,0,0.03)] z-10 w-full relative animate-fade-in">
        <div className="flex items-center gap-4 text-text-main">
          <div className="size-6 flex items-center justify-center">
            <img src="/somascribelogo.svg" alt="SomaScribe Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-xl font-bold leading-tight tracking-tight">SomaScribe - Session Summary</h2>
          <div className="hidden sm:flex items-center gap-4 ml-4">
            <span className="text-text-muted text-sm border-l border-gray-300 pl-4">Patient: {patientName}</span>
            <span className="text-text-muted text-sm border-l border-gray-300 pl-4">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center justify-center rounded-lg h-9 px-4 border border-gray-200 bg-white hover:bg-gray-50 text-text-main text-sm font-medium shadow-sm hover:shadow-md"
          >
            <span className="material-symbols-outlined mr-2 text-[18px]">home</span>
            Dashboard
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full custom-scrollbar">
        <div className="max-w-[1280px] mx-auto p-8 space-y-8 pb-24">
          
          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
            {/* Duration Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col hover-lift relative overflow-hidden group animate-fade-in-up">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full group-hover:bg-blue-100 group-hover:scale-110 transition-all duration-500 z-0"></div>
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined">schedule</span>
                </div>
                <h3 className="font-semibold text-gray-500 uppercase tracking-wide text-xs">Duration</h3>
              </div>
              <p className="text-4xl font-bold text-gray-900 tracking-tight relative z-10">{m}<span className="text-2xl text-gray-400 font-medium">m</span> {s}<span className="text-2xl text-gray-400 font-medium">s</span></p>
              <div className="mt-4 flex items-center text-sm text-gray-500 relative z-10">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span> Completed successfully
              </div>
            </div>

            {/* Transcript Quality Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col hover-lift relative overflow-hidden group animate-fade-in-up">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-50 rounded-full group-hover:bg-green-100 group-hover:scale-110 transition-all duration-500 z-0"></div>
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined">forum</span>
                </div>
                <h3 className="font-semibold text-gray-500 uppercase tracking-wide text-xs">Transcript Quality</h3>
              </div>
              <p className="text-4xl font-bold text-gray-900 tracking-tight relative z-10">98<span className="text-2xl text-gray-400 font-medium">%</span></p>
              <div className="mt-4 flex items-center text-sm text-gray-500 relative z-10">
                <span className="bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded text-xs mr-2 border border-green-200">High Clarity</span> {wordCount} words
              </div>
            </div>
            
            {/* Clusters Detected Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-accent-terracotta/20 p-6 flex flex-col hover-lift relative overflow-hidden group animate-fade-in-up">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-50 rounded-full group-hover:bg-orange-100 group-hover:scale-110 transition-all duration-500 z-0"></div>
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-accent-terracotta z-10"></div>
              <div className="flex items-center gap-3 mb-4 relative z-10 pl-2">
                <div className="w-10 h-10 rounded-full bg-orange-50 text-accent-terracotta flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined">warning</span>
                </div>
                <h3 className="font-semibold text-gray-500 uppercase tracking-wide text-xs">Clusters Detected</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight relative z-10 pl-2 pr-2 leading-snug">
                {insights.length > 0 ? insights[0].title.replace(' Detected', '') : 'None'}
              </p>
              <div className="mt-4 flex flex-col text-sm text-gray-500 relative z-10 pl-2">
                {insights.length > 0 ? (
                  <span className="text-accent-terracotta font-medium truncate">Requires further evaluation</span>
                ) : (
                  <span className="text-gray-500 font-medium truncate">No immediate action needed</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            
            {/* Left Column - Transcript */}
            <div className="space-y-6 flex flex-col animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col flex-1 min-h-[500px] hover-lift">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">forum</span>
                  Full Patient Transcript
                </h4>
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex-1 overflow-y-auto custom-scrollbar relative">
                  <div className="space-y-6">
                    {transcript.length > 0 ? (
                      transcript.map((msg, idx) => (
                        <div key={idx} className="text-[15px] animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                          <span className={`font-semibold ${msg.type === 'doctor' ? 'text-gray-800' : 'text-primary'} block text-xs mb-1.5 uppercase tracking-wide`}>{msg.speaker}</span>
                          <span className="text-gray-700 leading-relaxed">{msg.text}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[15px] text-gray-500 italic text-center py-10 fade-in">
                        No transcript available for this session.
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none rounded-b-xl"></div>
                </div>
              </section>
            </div>

            {/* Right Column - Clinical Intelligence Summary */}
            <div className="space-y-6 flex flex-col animate-slide-in-right" style={{ animationDelay: '0.3s' }}>
              <section className="bg-white rounded-2xl shadow-sm border border-accent-terracotta/30 overflow-hidden relative flex-1 hover-lift">
                <div className="border-b border-orange-100/50 bg-gradient-to-r from-orange-50/50 to-white px-6 py-5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-accent-terracotta text-xl animate-pulse-subtle">lightbulb</span>
                  <h3 className="font-semibold text-gray-800 text-lg">Clinical Intelligence Review</h3>
                </div>
                
                <div className="p-8">
                  {/* The Flag */}
                  {insights.length > 0 ? insights.map((insight, idx) => (
                    <div 
                      key={idx} 
                      className={`p-5 bg-orange-50/80 rounded-xl border border-orange-100 relative mb-8 transition-all duration-500 ${dismissedInsights.includes(idx) ? 'opacity-30 scale-95' : 'animate-fade-in-up'}`}
                      style={{ animationDelay: '0.1s' }}
                    >
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-accent-terracotta rounded-l-xl"></div>
                      <div className="flex items-center gap-2 mb-3 pl-3">
                        <span className="text-[11px] font-bold text-accent-terracotta uppercase tracking-wider bg-white px-2.5 py-1 rounded shadow-sm border border-orange-200">Triggered Flag</span>
                      </div>
                      <h4 className="text-lg font-bold text-gray-800 mb-2 pl-3">{insight.title}</h4>
                      <p className="text-[15px] text-gray-700 mb-5 pl-3 leading-relaxed">
                        Patient mentioned {insight.mentions && insight.mentions.length > 0 ? insight.mentions.map((m_, i) => <strong key={i} className="font-bold text-gray-900">{m_}{i < insight.mentions.length - 1 ? ' & ' : ''}</strong>) : "specific somatic terms"} which mapped to clinical clusters.
                      </p>
                      <div className="pl-3 pt-4 border-t border-orange-200/50 flex flex-wrap gap-3">
                        <button 
                          onClick={() => setDismissedInsights(prev => [...prev, idx])}
                          className="px-4 py-2 rounded-lg text-sm font-semibold text-orange-700 bg-orange-100/50 hover:bg-orange-100 border border-orange-200 hover:shadow-md"
                        >
                          Dismiss
                        </button>
                        <button className="px-4 py-2 rounded-lg text-sm font-semibold bg-white border border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50 hover:shadow-md">
                          View Protocol
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="p-5 text-gray-500 italic text-center py-10 fade-in">
                      No clinical insights detected for this session.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
