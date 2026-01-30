import React from 'react';
import { CommitAudit } from '../types';
import { History, Activity } from 'lucide-react';

interface AuditLogProps {
  audit: CommitAudit[];
}

const CommitGuardAudit: React.FC<AuditLogProps> = ({ audit }) => {
  return (
    <div className="bg-white rounded-[5rem] p-24 shadow-2xl space-y-24 animate-in fade-in duration-1000 pb-32">
      <div className="flex justify-between items-center relative z-10">
        <div className="space-y-4">
          <h3 className="text-7xl font-black font-heading tracking-tighter text-slate-950 uppercase italic leading-none">Audit Archive</h3>
          <p className="text-[14px] font-black text-slate-400 uppercase tracking-[0.8em] font-mono">Protocol Event History Registry</p>
        </div>
      </div>
      <div className="space-y-8">
        {audit.length > 0 ? audit.map((log, idx) => (
          <div key={log.id} style={{ animationDelay: `${idx * 60}ms` }} className="flex items-center justify-between p-12 bg-slate-50 hover:bg-white border border-transparent hover:border-orange-500/20 rounded-[4rem] transition-all duration-700 group animate-in slide-in-from-right-8 shadow-sm">
            <div className="flex items-center gap-12">
              <div className={`p-8 rounded-[2.5rem] shadow-xl ${log.type === 'LOCK' ? 'bg-slate-950 text-[#ff5d2a]' : log.type === 'SYNC_COMPLETE' ? 'bg-emerald-500 text-white' : log.type === 'OVERRIDE' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-400'}`}><Activity size={36} /></div>
              <div className="space-y-3">
                <p className="text-[32px] font-black text-slate-900 group-hover:text-[#ff5d2a] transition-colors leading-none uppercase italic">{log.userName} initiated <span className="text-indigo-600">{log.type}</span></p>
                <div className="flex items-center gap-6">
                  <span className="text-[13px] font-black text-slate-400 uppercase tracking-[0.5em] font-mono">Project: {log.nodeName} / SubNode: {log.subNodeName}</span>
                  <div className="w-2 h-2 rounded-full bg-slate-200" />
                  <span className="text-[11px] font-mono text-indigo-500 font-bold tracking-widest uppercase">ID_{log.id}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              <span className="text-[20px] font-black text-slate-950 font-mono tracking-tighter tabular-nums">{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              <span className="text-[12px] font-black text-slate-300 uppercase tracking-[0.5em] font-mono">{new Date(log.timestamp).toLocaleDateString()}</span>
            </div>
          </div>
        )) : (
          <div className="py-80 text-center animate-in fade-in duration-1000">
            <History size={120} className="text-slate-100 mx-auto" />
            <p className="text-[22px] font-black text-slate-400 uppercase tracking-[1em] opacity-50 mt-12">Telemetry Empty</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommitGuardAudit;