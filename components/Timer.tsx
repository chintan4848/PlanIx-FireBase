import React, { useState, useEffect } from 'react';
import { Play, Pause, Clock } from 'lucide-react';

interface TimerProps {
  startedAt: string | null;
  baseSeconds: number;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
}

const Timer: React.FC<TimerProps> = ({ startedAt, baseSeconds, isPaused, onPause, onResume }) => {
  const [displaySeconds, setDisplaySeconds] = useState(baseSeconds);

  useEffect(() => {
    let interval: number | undefined;
    if (!isPaused && startedAt) {
      const startTime = new Date(startedAt).getTime();
      const update = () => {
        const currentElapsed = Math.floor((Date.now() - startTime) / 1000);
        setDisplaySeconds(baseSeconds + currentElapsed);
      };
      update();
      interval = window.setInterval(update, 1000);
    } else {
      setDisplaySeconds(baseSeconds);
    }
    return () => clearInterval(interval);
  }, [startedAt, baseSeconds, isPaused]);

  const formatTime = (total: number) => {
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-2 p-1 pr-1.5 rounded-xl shadow-lg border transition-all duration-300 ${
      isPaused 
        ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200/40 dark:border-amber-800/20' 
        : 'bg-slate-950 dark:bg-indigo-600 border-slate-800 dark:border-indigo-500 shadow-indigo-500/10'
    }`}>
      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg ${isPaused ? 'bg-white dark:bg-amber-900/20' : 'bg-white/10'}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.4)]'}`} />
        <span className={`text-[12px] font-black font-mono tracking-tight ${isPaused ? 'text-amber-700 dark:text-amber-400' : 'text-white'}`}>
          {formatTime(displaySeconds)}
        </span>
      </div>
      
      <div className="flex items-center gap-1">
        {isPaused ? (
          <button 
            onClick={(e) => { e.stopPropagation(); onResume(); }}
            className="p-1 text-amber-600 hover:text-white hover:bg-amber-500 transition-all rounded-full"
          >
            <Play size={12} fill="currentColor" />
          </button>
        ) : (
          <button 
            onClick={(e) => { e.stopPropagation(); onPause(); }}
            className="p-1 text-white/70 hover:text-white hover:bg-white/10 transition-all rounded-full"
          >
            <Pause size={12} fill="currentColor" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Timer;