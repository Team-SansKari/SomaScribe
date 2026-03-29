import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function InsightTriggered() {
  const navigate = useNavigate();

  return (
    <>
      

<header className="flex items-center justify-between whitespace-nowrap border-b border-gray-200/60 glass px-8 py-4 shrink-0 shadow-[0_4px_20px_rgb(0,0,0,0.03)] z-10 animate-fade-in">
<div className="flex items-center gap-4 text-text-main">
<div className="size-6 flex items-center justify-center">
<img src="/somascribelogo.svg" alt="SomaScribe Logo" className="w-full h-full object-contain" />
</div>
<h2 className="text-text-main text-xl font-bold leading-tight tracking-[-0.015em]">SomaScribe - Active Session</h2>
<span className="text-text-muted text-sm ml-4 border-l border-gray-300 pl-4">Patient: Aisha Sharma</span>
</div>
<div className="flex items-center gap-4">
<div className="flex items-center gap-2 text-sm font-medium text-text-main">
<span className="relative flex h-3 w-3">
<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-terracotta opacity-75"></span>
<span className="relative inline-flex rounded-full h-3 w-3 bg-accent-terracotta"></span>
</span>
            Listening softly...
        </div>
<button className="flex items-center justify-center rounded-lg h-9 px-4 border border-gray-200 hover:bg-gray-50 hover:shadow-md text-text-main text-sm font-medium shadow-sm">
<span className="material-symbols-outlined mr-2 text-lg">pause</span>
            Pause
        </button>
<button 
  onClick={() => navigate('/post-session-summary')}
  className="flex items-center justify-center rounded-lg h-9 px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/60 hover:border-red-200 text-sm font-medium shadow-sm hover:shadow-md">
<span className="material-symbols-outlined mr-2 text-lg">stop_circle</span>
            End Session
        </button>
</div>
</header>

<main className="flex-1 flex overflow-hidden">

<section className="w-[60%] flex flex-col border-r border-gray-200/60 bg-surface relative animate-slide-in-left" style={{ animationDuration: '0.6s' }}>
<div className="p-6 border-b border-gray-100 flex justify-between items-center bg-surface/95 backdrop-blur z-10">
<h3 className="font-semibold text-lg flex items-center gap-2">
<span className="material-symbols-outlined text-text-muted">forum</span>
                Live Transcript
            </h3>
<span className="text-xs text-text-muted bg-gray-100 px-2.5 py-1 rounded-full">Auto-scrolling</span>
</div>
<div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 pb-24">

<div className="flex items-center justify-center gap-4 my-4 animate-fade-in">
<div className="h-px bg-gray-200 flex-1"></div>
<span className="text-xs font-medium text-text-muted uppercase tracking-wider">10:42 AM</span>
<div className="h-px bg-gray-200 flex-1"></div>
</div>

<div className="flex items-end gap-3 justify-end animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
<div className="flex flex-col gap-1 items-end max-w-[80%]">
<span className="text-text-muted text-xs font-medium mr-1">Dr. Smith (GP)</span>
<div className="text-base leading-relaxed px-5 py-3 rounded-2xl rounded-br-md border border-gray-200/60 bg-surface shadow-sm text-text-main hover:shadow-md transition-shadow duration-300">
                        Good morning, Aisha. How have you been feeling since our last visit?
                    </div>
</div>
<div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0 border border-primary/20">
<span className="material-symbols-outlined text-sm text-primary">stethoscope</span>
</div>
</div>

<div className="flex items-end gap-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
<div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
<img alt="Patient profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBAnaywJ1T3DEpgETMtB5POdhjvGIv6xXVyekTPB_nMm5X8wHVp7MWGnZG97vpN9fCYoRBqJ3UhNwD5h5g8S_IbxmWIXZFJu426_PzNaC8EiQTDqCEumZ7lvOUROaHNAs8XDYNeyWc14dIeYFTzCdMcWCNXT1t_kz05cU_GWEgL38DCAsm3UsinhDuYBzHn1ts6uQhtCdMoz4o7i7SN96UhAaZB5-_yIxMT5ekne2THb5uABa11b2utWCy73wAxgPJqWl0QBIxpmpQ"/>
</div>
<div className="flex flex-col gap-1 items-start max-w-[80%]">
<span className="text-text-muted text-xs font-medium ml-1">Aisha (Patient)</span>
<div className="text-base leading-relaxed px-5 py-3 rounded-2xl rounded-bl-md bg-patient-bubble text-text-main ring-2 ring-primary/20 ring-offset-1 hover:shadow-md transition-shadow duration-300">
                        Not great, honestly. I've just had this <span className="bg-primary/20 px-1 rounded transition-colors hover:bg-primary/30">really heavy head</span> lately, and a <span className="bg-accent-terracotta/20 px-1 rounded transition-colors hover:bg-accent-terracotta/30">burning in my stomach</span>... it makes it hard to focus on work.
                    </div>
</div>
</div>

<div className="flex items-end gap-3 justify-end animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
<div className="flex flex-col gap-1 items-end max-w-[80%]">
<span className="text-text-muted text-xs font-medium mr-1">Dr. Smith (GP)</span>
<div className="text-base leading-relaxed px-5 py-3 rounded-2xl rounded-br-md border border-gray-200/60 bg-surface shadow-sm text-text-main hover:shadow-md transition-shadow duration-300">
                        I hear you. Let's explore that a bit more. When did the heaviness and burning start?
                    </div>
</div>
<div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0 border border-primary/20">
<span className="material-symbols-outlined text-sm text-primary">stethoscope</span>
</div>
</div>

<div className="flex items-end gap-3 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
<div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 overflow-hidden opacity-70">
<img alt="Patient profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7lgP4fm_V_fF9Kst9mL3opxzb6sAGHaqSFH7zqg6yooUqhZCqGqLkGqiyy5Cy1H5rIfZdKV_tsw9XZwxseIQtv0VI_fYgqkFWB4RcnVwLWlSExUrzytcSweq1M8k3kGBsMFgW46IwTefl7-33zIB4eRgFbdnUoM3_4elKQKyST6-Ywd-uwmdcMCqXbEHiZiYXA8yVxyO2Asz54FBonYQa5lkCDrwwa1IAg3HqZ9u1qGxGpjx0cgdh6nExik_loh0xUR2gG0TE8aI"/>
</div>
<div className="flex flex-col gap-1 items-start max-w-[80%]">
<div className="text-base px-5 py-3 rounded-2xl rounded-bl-md bg-patient-bubble text-text-main/50 flex items-center gap-1.5 min-h-[48px]">
<span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
<span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
<span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
</div>
</div>
</div>
</div>

<div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-surface to-transparent pointer-events-none"></div>
</section>

<section className="w-[40%] bg-background-light flex flex-col relative animate-slide-in-right" style={{ animationDuration: '0.6s' }}>
<div className="p-6 pb-2 border-b border-gray-200/50">
<h3 className="font-semibold text-lg flex items-center gap-2 text-text-main">
<span className="material-symbols-outlined text-accent-terracotta">lightbulb</span>
                Clinical Intelligence
            </h3>
</div>
<div className="flex-1 p-6 overflow-y-auto custom-scrollbar">

<div className="bg-[#FFF5F2] rounded-xl shadow-sm border border-accent-terracotta/30 overflow-hidden relative transition-all duration-500 transform translate-y-0 opacity-100 ring-2 ring-accent-terracotta ring-offset-2 animate-scale-in">

<div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent-terracotta text-white text-[10px] font-bold uppercase tracking-wider shadow-sm z-20 animate-pulse-subtle">
<span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                    Just Flagged
                </div>

<div className="absolute left-0 top-0 bottom-0 w-1.5 bg-accent-terracotta"></div>
<div className="p-5">
<div className="flex justify-between items-start mb-4">
<div>
<div className="flex items-center gap-2 text-accent-terracotta mb-1">
<span className="material-symbols-outlined text-sm">warning</span>
<span className="text-xs font-bold uppercase tracking-wider">Bradford Somatic Inventory</span>
</div>
<h4 className="text-xl font-serif font-semibold text-text-main mb-2">Patient Mentions: <span className="italic">"heavy head"</span> &amp; <span className="italic">"burning in stomach"</span></h4>
</div>
</div>
<div className="flex items-center gap-2 mb-4">
<span className="px-2 py-0.5 rounded bg-gray-100 text-[11px] font-bold text-text-muted uppercase tracking-tight">Cluster Detected</span>
<span className="text-sm font-medium text-text-main">Head / Abdomen Somatic Markers (MDD)</span>
</div>

<div className="flex flex-wrap gap-2 mb-6 stagger-children">
<span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-primary/30 text-sm font-medium text-text-main shadow-sm bg-primary/5 hover:shadow-md transition-all duration-200 animate-fade-in-up">
<span className="material-symbols-outlined text-[16px] text-primary">psychology</span>
                            Heaviness in head
                        </span>
<span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-accent-terracotta/40 text-sm font-medium text-text-main shadow-sm bg-accent-terracotta/5 hover:shadow-md transition-all duration-200 animate-fade-in-up">
<span className="material-symbols-outlined text-[16px] text-accent-terracotta">local_fire_department</span>
                            Burning sensation
                        </span>
</div>

<div className="mt-4 border-l-2 border-primary pl-4 py-1 bg-white/40 rounded-r-lg p-3">
<div className="flex items-center justify-between mb-3">
<h5 className="text-xs font-bold text-text-muted uppercase tracking-wider">Dynamic mhGAP Probes <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700 border border-blue-200 uppercase">WHO mhGAP Aligned</span></h5>
<span className="text-[10px] text-primary font-bold flex items-center gap-1">
<span className="material-symbols-outlined text-[12px]">auto_awesome</span>
                                NEW
                            </span>
</div>
<ul className="space-y-4">
<li className="flex items-start gap-3 group cursor-pointer bg-primary/10 rounded-r-lg -ml-4 pl-4 py-2 border-l-2 border-primary transition-all duration-200 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
<button className="mt-0.5 w-5 h-5 rounded-full border border-primary flex items-center justify-center shrink-0 bg-primary/20 hover:bg-primary/30 transition-colors">
<span className="material-symbols-outlined text-[14px] text-text-main">add</span>
</button>
<div>
<p className="font-serif italic text-text-main text-[15px] leading-relaxed">"In the last few weeks, have you had little interest or pleasure in doing things?"</p>
<span className="text-[9px] text-text-muted uppercase font-bold tracking-tighter mt-1 block">Context: Screens for anhedonia following somatic report</span>
</div>
</li>
<li className="flex items-start gap-3 group cursor-pointer hover:bg-white/60 p-1 rounded-r-lg -ml-1 transition-all duration-200 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
<button className="mt-0.5 w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center shrink-0 group-hover:border-primary group-hover:bg-primary/10 transition-colors duration-200">
<span className="material-symbols-outlined text-[12px] opacity-0 group-hover:opacity-100 text-primary transition-opacity duration-200">add</span>
</button>
<div>
<p className="font-serif italic text-text-main text-[15px] leading-relaxed">"Have you been feeling down, depressed, or hopeless?"</p>
<div className="mt-1 flex items-center gap-1.5">
<span className="w-1 h-1 rounded-full bg-accent-terracotta animate-pulse"></span>
<span className="text-[10px] font-semibold text-accent-terracotta uppercase tracking-tight">Direct link to "burning sensation" report</span>
</div>
</div>
</li>
</ul>
</div>

<div className="mt-6 pt-4 border-t border-gray-200/60 flex justify-end gap-3">
<button className="px-4 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-text-main hover:bg-black/5 hover:shadow-sm transition-all duration-200">
                            Dismiss
                        </button>
</div>
</div>
</div>

<div className="mt-6 p-4 rounded-xl border border-gray-200 bg-surface/50 opacity-60 hover:opacity-100 transition-opacity duration-300 cursor-default animate-fade-in" style={{ animationDelay: '0.5s' }}>
<h5 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Patient History Context</h5>
<p className="text-sm text-text-main">Similar somatic complaints noted in visits on Oct 12 and Aug 04. Escalate monitoring.</p>
</div>
<div className="mt-8 pt-4 border-t border-gray-200 animate-fade-in" style={{ animationDelay: '0.6s' }}>
<div className="flex items-start gap-2 text-text-muted">
<span className="material-symbols-outlined text-[16px] mt-0.5">info</span>
<div className="text-[11px] leading-relaxed">
<p className="font-bold uppercase tracking-wider mb-1">Decision Support Disclaimer</p>
<p>Suggestions are AI-generated based on detected patterns and may be inaccurate. These tools are intended to assist, not replace, clinical reasoning. Final clinical judgment remains with the practitioner for further probing and diagnosis.</p>
</div>
</div>
</div></div>
</section>
</main>

    </>
  );
}
