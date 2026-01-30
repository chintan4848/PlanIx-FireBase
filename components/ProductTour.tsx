import React, { useState, useEffect, useMemo } from 'react';
import { Language } from '../types';
import { translations } from '../translations';
import { ChevronRight, X, Sparkles, Command, ShieldCheck, Zap } from 'lucide-react';

interface ProductTourProps {
  language: Language;
  onClose: () => void;
}

const ProductTour: React.FC<ProductTourProps> = ({ language, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, align: 'center' });
  
  const t = translations[language].tour;
  const steps = t.steps;

  const targetSelectors = [
    'body',                   // Welcome
    '[data-tour="sidebar"]',  // Navigation
    '[data-tour="import"]',   // Import
    '[data-tour="user"]'      // Profile
  ];

  useEffect(() => {
    const updatePosition = () => {
      const target = document.querySelector(targetSelectors[currentStep]);
      if (!target) {
        setTooltipPos({ top: window.innerHeight / 2, left: window.innerWidth / 2, align: 'center' });
        return;
      }

      const rect = target.getBoundingClientRect();
      
      if (currentStep === 0) {
        setTooltipPos({ top: window.innerHeight / 2, left: window.innerWidth / 2, align: 'center' });
      } else if (currentStep === 1) { // Sidebar
        setTooltipPos({ top: rect.top + 100, left: rect.right + 20, align: 'left' });
      } else if (currentStep === 2) { // Import Button
        setTooltipPos({ top: rect.bottom + 20, left: rect.left - 100, align: 'top' });
      } else if (currentStep === 3) { // User Profile
        setTooltipPos({ top: rect.top - 180, left: rect.right + 20, align: 'bottom' });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none overflow-hidden">
      {/* Dimmed Overlay */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] transition-opacity duration-500 pointer-events-auto" onClick={onClose} />

      {/* Tooltip Card */}
      <div 
        className="absolute pointer-events-auto transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1)"
        style={{ 
          top: tooltipPos.top, 
          left: tooltipPos.left,
          transform: tooltipPos.align === 'center' ? 'translate(-50%, -50%)' : 'none'
        }}
      >
        <div className="w-[340px] bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg">
                  {currentStep === 0 ? <Sparkles size={16} /> : currentStep === 1 ? <Command size={16} /> : currentStep === 2 ? <Zap size={16} /> : <ShieldCheck size={16} />}
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Step {currentStep + 1} / {steps.length}</span>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-rose-500 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{steps[currentStep].title}</h3>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">{steps[currentStep].content}</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button onClick={onClose} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">{t.skip}</button>
              <button 
                onClick={handleNext} 
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
              >
                {currentStep === steps.length - 1 ? t.finish : t.next}
                <ChevronRight size={14} strokeWidth={3} />
              </button>
            </div>
          </div>

          {/* Indicator Dots */}
          <div className="flex gap-1.5 justify-center mt-6">
            {steps.map((_: any, i: number) => (
              <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === currentStep ? 'bg-indigo-500 w-6' : 'bg-slate-200 dark:bg-slate-800 w-1.5'}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductTour;