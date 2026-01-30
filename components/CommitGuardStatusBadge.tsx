import React from 'react';

interface StatusBadgeProps {
  status: 'AVAILABLE' | 'ACTIVE' | 'LOCKED' | 'SUCCESS';
  size?: 'sm' | 'md';
}

const CommitGuardStatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = {
    AVAILABLE: {
      label: 'Available',
      classes: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      dot: 'bg-emerald-500'
    },
    ACTIVE: {
      label: 'Active',
      classes: 'bg-[#ff5d2a] text-white border-[#ff5d2a] shadow-lg shadow-orange-500/20',
      dot: 'bg-white'
    },
    SUCCESS: {
      label: 'Success',
      classes: 'bg-[#ff5d2a]/10 text-[#ff5d2a] border-[#ff5d2a]/20',
      dot: 'bg-[#ff5d2a]'
    },
    LOCKED: {
      label: 'Locked',
      classes: 'bg-slate-50 text-slate-500 border-slate-200',
      dot: 'bg-slate-400'
    }
  };

  const { label, classes, dot } = config[status];

  return (
    <span className={`inline-flex items-center border font-black uppercase tracking-widest rounded-full font-mono transition-all duration-300 ${classes} ${
      size === 'sm' ? 'px-3 py-1 text-[8px]' : 'px-5 py-2 text-[10px]'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${dot} ${status === 'ACTIVE' ? 'animate-status-pulse-red' : ''}`}></span>
      {label}
    </span>
  );
};

export default CommitGuardStatusBadge;