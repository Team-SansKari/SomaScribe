import React from 'react';

export default function ActiveSession() {
  // Recording wave visualizer
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
      

<header className="flex items-center justify-between whitespace-nowrap border-b border-gray-200/60 px-8 py-4 glass shrink-0 shadow-[0_4px_20px_rgb(0,0,0,0.03)] relative z-10 h-[80px] animate-fade-in">
<div className="flex items-center gap-4 text-[#0d1b14]">
<div className="size-6 text-primary">
<svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
<path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path>
</svg>
</div>
<div>
<h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">Patient: Ananya P.</h2>
<p className="text-sm text-gray-500 font-medium">Session Timer: <span className="text-[#2C3531] font-semibold tabular-nums">00:45</span></p>
</div>
</div>
<div className="flex items-center gap-4">
<div className="flex items-center gap-2.5 mr-2 bg-primary/5 px-4 py-2 rounded-full border border-primary/20 animate-glow-pulse">
<RecordingWave />
<span className="text-sm font-medium text-gray-600">Listening softly...</span>
</div>
<button className="flex items-center justify-center rounded-lg h-10 px-6 bg-gray-100 hover:bg-gray-200 text-sm font-semibold border border-gray-200 shadow-sm hover:shadow-md">
<span className="material-symbols-outlined mr-1.5 text-base">pause</span>
        Pause
      </button>
<button className="flex items-center justify-center rounded-lg h-10 px-6 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold border border-red-200/60 shadow-sm hover:shadow-md hover:border-red-200">
<span className="material-symbols-outlined mr-1.5 text-base">stop_circle</span>
        End Session
      </button>
</div>
</header>

<main className="flex-1 flex overflow-hidden lg:flex-row flex-col">

<section className="lg:w-[60%] w-full h-full flex flex-col bg-white border-r border-gray-200/60 animate-slide-in-left" style={{ animationDuration: '0.6s' }}>
<div className="px-8 py-4 border-b border-gray-100 bg-gray-50/30 shrink-0">
<h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
<span className="material-symbols-outlined text-base">forum</span>
Live Transcript
</h3>
</div>

<div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 scrollbar-hide custom-scrollbar pb-24">

<div className="flex flex-col items-end w-full animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
<span className="text-xs font-medium text-gray-400 mb-1 mr-1">Dr. Smith • 10:02 AM</span>
<div className="max-w-[80%] bg-white border border-gray-200/60 p-4 rounded-xl rounded-br-none shadow-sm hover:shadow-md transition-shadow duration-300">
<p className="text-[15px] leading-relaxed">Good morning, Ananya. How have you been feeling since our last visit?</p>
</div>
</div>

<div className="flex flex-col items-start w-full animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
<span className="text-xs font-medium text-gray-400 mb-1 ml-1">Ananya P. • 10:02 AM</span>
<div className="max-w-[80%] bg-[#f0fdf4] border border-[#bbf7d0] p-4 rounded-xl rounded-bl-none shadow-sm hover:shadow-md transition-shadow duration-300">
<p className="text-[15px] leading-relaxed">Honestly, Doctor, not very good. I've been having this heavy feeling in my head for the past two weeks. It just doesn't go away.</p>
</div>
</div>

<div className="flex flex-col items-end w-full animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
<span className="text-xs font-medium text-gray-400 mb-1 mr-1">Dr. Smith • 10:03 AM</span>
<div className="max-w-[80%] bg-white border border-gray-200/60 p-4 rounded-xl rounded-br-none shadow-sm hover:shadow-md transition-shadow duration-300">
<p className="text-[15px] leading-relaxed">I'm sorry to hear that. Can you describe the heaviness? Is it painful, or more like a pressure?</p>
</div>
</div>

<div className="flex flex-col items-start w-full opacity-70 animate-fade-in" style={{ animationDelay: '0.4s' }}>
<span className="text-xs font-medium text-gray-400 mb-1 ml-1">Ananya P. • Speaking...</span>
<div className="bg-[#f0fdf4] border border-[#bbf7d0] px-4 py-3 rounded-xl rounded-bl-none shadow-sm flex items-center gap-1.5">
<div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
<div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
<div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
</div>
</div>
</div>
</section>

<section className="lg:w-[40%] w-full h-full flex flex-col bg-background-light animate-slide-in-right" style={{ animationDuration: '0.6s' }}>
<div className="px-8 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm shrink-0">
<h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
<span className="material-symbols-outlined text-base">psychology</span>
      Diagnostic Insights
    </h3>
</div>
<div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative">
<div className="max-w-xs space-y-4 animate-scale-in">
<div className="relative inline-flex items-center justify-center animate-float">
<div className="absolute inset-0 bg-primary/10 rounded-full animate-ping"></div>
<div className="relative size-16 bg-white border border-gray-200/60 rounded-full flex items-center justify-center shadow-sm">
<span className="material-symbols-outlined text-primary text-3xl">fluid_meditation</span>
</div>
</div>
<div className="space-y-2">
<h4 className="text-lg font-semibold text-[#2C3531]">Listening for clinical signals...</h4>
<p className="text-sm text-gray-500 leading-relaxed">
            Awaiting somatic patterns and psychological markers to begin analysis.
          </p>
</div>
<div className="pt-4">
<span className="inline-flex items-center gap-2 bg-white border border-gray-200/60 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider text-gray-400 shadow-sm">
<div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse"></div>
            Real-time analysis idle
          </span>
</div>
</div>
</div>

<div className="px-8 py-4 bg-white/80 backdrop-blur-sm border-t border-gray-100 shrink-0">
<div className="flex items-start gap-2.5">
<span className="material-symbols-outlined text-gray-400 text-base mt-0.5">info</span>
<p className="text-[11px] leading-relaxed text-gray-400"><span className="font-semibold text-gray-500">Clinical Aid Only:</span> These suggestions are for further probing based on somatic markers and do not constitute a diagnosis. Results may vary in accuracy.</p>
</div>
</div>
</section>
</main>

    </>
  );
}
