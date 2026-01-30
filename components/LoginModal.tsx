import React, { useState, useMemo, useEffect } from 'react';
import { User, Language } from '../types';
import { AuthService } from '../services/taskService';
import { translations } from '../translations';
import { 
  Lock, 
  ArrowRight, 
  Loader2, 
  Terminal,
  ChevronLeft,
  Zap,
  BoxSelect,
  ShieldAlert,
  Command,
  LogIn,
  RefreshCcw,
  Network,
  ShieldCheck,
  Cpu,
  Eye,
  EyeOff,
  Sparkles,
  Key,
  Mail,
  Fingerprint,
  RotateCcw,
  Bell,
  X,
  Target,
  Activity
} from 'lucide-react';

interface LoginModalProps {
  language: Language;
  onLogin: (user: User) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ language, onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [recoveryStep, setRecoveryStep] = useState<1 | 2 | 3>(1); // 1: Username, 2: OTP, 3: New Pass
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Recovery states
  const [recoveryUser, setRecoveryUser] = useState<User | null>(null);
  const [otpValue, setOtpValue] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mockEmailReceived, setMockEmailReceived] = useState<{ visible: boolean; otp: string } | null>(null);

  const [loading, setLoading] = useState(false);
  const [isBooting, setIsBooting] = useState(false);
  const [bootProgress, setBootProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const t = translations[language].auth;

  useEffect(() => {
    if (isBooting) {
      // Speed up progress calculation to match the reduced wait time
      const interval = setInterval(() => {
        setBootProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          // Faster increments to reach 100 in ~2 seconds
          const increment = prev < 20 ? 8 : prev < 60 ? 3.5 : prev < 85 ? 5.5 : 2.2;
          return Math.min(100, prev + (Math.random() * increment + 0.5));
        });
      }, 40); // Faster interval
      return () => clearInterval(interval);
    }
  }, [isBooting]);

  const passwordStrength = useMemo(() => {
    const val = mode === 'register' ? password : newPassword;
    if (!val) return { score: 0, label: 'Waiting...', color: 'bg-slate-200 dark:bg-slate-800' };
    
    let score = 0;
    if (val.length >= 8) score += 1;
    if (/[0-9]/.test(val)) score += 1;
    if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score += 1;
    if (/[^A-Za-z0-9]/.test(val)) score += 1;

    switch (score) {
      case 1: return { score, label: 'Weak', color: 'bg-rose-500' };
      case 2: return { score, label: 'Fair', color: 'bg-amber-500' };
      case 3: return { score, label: 'Good', color: 'bg-indigo-500' };
      case 4: return { score, label: 'Strong', color: 'bg-emerald-500' };
      default: return { score, label: 'Very Weak', color: 'bg-rose-600' };
    }
  }, [password, newPassword, mode]);

  const isFormValid = useMemo(() => {
    if (mode === 'login') return username.trim().length > 0 && password.trim().length > 0;
    if (mode === 'register') return name.trim().length > 0 && username.trim().length > 0 && password.trim().length >= 8;
    if (mode === 'forgot') {
      if (recoveryStep === 1) return username.trim().length > 0;
      if (recoveryStep === 2) return otpValue.length === 6;
      if (recoveryStep === 3) return newPassword.trim().length >= 8 && newPassword === confirmPassword;
    }
    return false;
  }, [mode, username, password, name, recoveryStep, otpValue, newPassword, confirmPassword]);

  const maskEmail = (email?: string) => {
    if (!email) return "u***@p***.io";
    const [user, domain] = email.split('@');
    const domainParts = domain.split('.');
    const ext = domainParts.pop();
    const dom = domainParts.join('.');
    return `${user.charAt(0)}***@${dom.charAt(0)}***.${ext}`;
  };

  const handleStartRecovery = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    
    setTimeout(async () => {
      const user = await AuthService.findByUsername(username);
      if (!user) {
        setError("NODE_IDENTITY_NOT_FOUND");
        setLoading(false);
        return;
      }
      
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp);
      setRecoveryUser(user);
      setRecoveryStep(2);
      setSuccessMsg(`OTP_SENT_TO_${maskEmail(user.email)}`);
      
      // Trigger Mock Email Notification
      setMockEmailReceived({ visible: true, otp });
      setLoading(false);
    }, 1200);
  };

  const handleVerifyOtp = () => {
    setLoading(true);
    setTimeout(() => {
      if (otpValue === generatedOtp) {
        setRecoveryStep(3);
        setSuccessMsg("IDENTITY_VERIFIED");
        setError(null);
        setMockEmailReceived(null);
      } else {
        setError("INVALID_OTP_TOKEN");
      }
      setLoading(false);
    }, 800);
  };

  const handleFinalReset = async () => {
    setLoading(true);
    setTimeout(async () => {
      if (recoveryUser) {
        await AuthService.resetPassword(recoveryUser.id, newPassword);
        setSuccessMsg("PASSWORD_RECALIBRATED");
        setError(null);
        setTimeout(() => {
          setMode('login');
          setRecoveryStep(1);
          setRecoveryUser(null);
          setSuccessMsg(null);
        }, 2000);
      }
      setLoading(false);
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    if (mode === 'forgot') {
      if (recoveryStep === 1) handleStartRecovery();
      else if (recoveryStep === 2) handleVerifyOtp();
      else if (recoveryStep === 3) handleFinalReset();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let user: User;
      if (mode === 'login') {
        user = await AuthService.login(username, password);
      } else {
        user = await AuthService.register(name, username, password);
      }
      
      // Reduced delays for a snappier experience
      setTimeout(() => {
        setIsBooting(true);
        setLoading(false);
        setTimeout(() => {
          onLogin(user);
        }, 2200); // Reduced animation duration
      }, 400); // Reduced start delay
    } catch (err: any) {
      setError(err.message.toUpperCase());
      setLoading(false);
    }
  };

  const bootLogs = [
    "UPLINK_ESTABLISHED",
    "DECRYPTING_BIOMETRIC_SEED",
    "MATERIALIZING_WORKSPACE",
    "CALIBRATING_CORE_LOGIC",
    "SYNCING_USER_REGISTRY",
    "AUTHORIZING_PROTOCOL_4.2",
    "SYSTEM_READY"
  ];

  const currentLog = useMemo(() => {
    const index = Math.floor((bootProgress / 100) * bootLogs.length);
    return bootLogs[Math.min(index, bootLogs.length - 1)];
  }, [bootProgress]);

  return (
    <div className="fixed inset-0 z-[200] flex items-stretch bg-[#020617] overflow-hidden font-sans">
      <style>{`
        @keyframes orbital-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes orbital-spin-rev { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        @keyframes scan-line { 0% { transform: translateY(-100%); opacity: 0; } 50% { opacity: 0.1; } 100% { transform: translateY(100%); opacity: 0; } }
        @keyframes flow-data { 0% { background-position: 0% 0%; } 100% { background-position: 0% 100%; } }
        @keyframes glow-button-pulse { 0%, 100% { box-shadow: 0 0 15px rgba(79, 70, 229, 0.3); } 50% { box-shadow: 0 0 35px rgba(79, 70, 229, 0.7); } }
        @keyframes shimmer { 0% { left: -100%; } 100% { left: 100%; } }
        @keyframes biometric-scan { 0%, 100% { transform: translateY(-30px); opacity: 0.05; } 50% { transform: translateY(30px); opacity: 0.4; } }
        @keyframes neural-pulse { 0% { transform: scale(0.95); opacity: 0.3; } 50% { transform: scale(1.05); opacity: 0.6; } 100% { transform: scale(0.95); opacity: 0.3; } }
        @keyframes ring-expand { 0% { transform: scale(1); opacity: 0.2; } 100% { transform: scale(2.5); opacity: 0; } }
        @keyframes glitch-text { 0% { transform: translate(0); } 20% { transform: translate(-2px, 2px); } 40% { transform: translate(-2px, -2px); } 60% { transform: translate(2px, 2px); } 80% { transform: translate(2px, -2px); } 100% { transform: translate(0); } }
        
        .data-grid {
          background-image: linear-gradient(rgba(79, 70, 229, 0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(79, 70, 229, 0.05) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: flow-data 15s linear infinite;
        }
        .animate-orbit { animation: orbital-spin 20s linear infinite; }
        .animate-orbit-rev { animation: orbital-spin-rev 15s linear infinite; }
        .animate-orbit-fast { animation: orbital-spin 8s linear infinite; }
        .btn-active-glow { animation: glow-button-pulse 1.2s ease-in-out infinite; }
        .shimmer-effect { animation: shimmer 2s linear infinite; }
        .biometric-line { animation: biometric-scan 2.5s ease-in-out infinite; }
        .neural-bg { animation: neural-pulse 4s ease-in-out infinite; }
        .ring-echo { animation: ring-expand 3s cubic-bezier(0.16, 1, 0.3, 1) infinite; }
        .text-glitch-active { animation: glitch-text 0.1s linear infinite; }
      `}</style>

      {/* --- MOCK EMAIL NOTIFICATION (DEMO ONLY) --- */}
      {mockEmailReceived?.visible && (
        <div className="fixed top-8 right-8 z-[1000] w-full max-w-sm animate-in slide-in-from-right-8 fade-in duration-500">
           <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
              <div className="p-6">
                 <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                       <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20">
                          <Mail size={18} strokeWidth={2.5} />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Incoming Transmission</span>
                          <span className="text-[13px] font-black text-white">Planix Recovery Service</span>
                       </div>
                    </div>
                    <button onClick={() => setMockEmailReceived(null)} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-slate-500">
                       <X size={16} />
                    </button>
                 </div>
                 <div className="bg-slate-950/50 rounded-2xl p-5 border border-white/5 space-y-4">
                    <p className="text-[12px] text-slate-300 font-bold leading-relaxed">
                       Subject: <span className="text-white italic">OTP Verification Protocol</span><br/>
                       To: <span className="text-indigo-400 font-mono text-[11px]">{maskEmail(recoveryUser?.email)}</span>
                    </p>
                    <div className="h-px bg-white/5" />
                    <div className="space-y-3">
                       <p className="text-[11px] font-black uppercase text-slate-500 tracking-widest">Your One-Time Access Key:</p>
                       <div className="flex items-center justify-center p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-xl">
                          <span className="text-4xl font-black font-mono tracking-[0.4em] text-white tabular-nums drop-shadow-[0_0_15px_rgba(79,70,229,0.5)]">
                             {mockEmailReceived.otp}
                          </span>
                       </div>
                    </div>
                 </div>
                 <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest pl-2">
                    <Bell size={10} className="animate-bounce" />
                    Demo Environment: Real email disabled
                 </div>
              </div>
           </div>
        </div>
      )}

      {isBooting && (
        <div className={`absolute inset-0 z-[300] bg-[#020617] flex flex-col items-center justify-center p-8 transition-all duration-1000 ${bootProgress === 100 ? 'bg-white' : ''}`}>
          <div className="absolute inset-0 data-grid opacity-30" />
          <div className="absolute inset-0 neural-bg bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.15),transparent_60%)]" />
          <div className={`relative z-10 w-full max-w-4xl flex flex-col items-center justify-center transition-all duration-1000 ${bootProgress === 100 ? 'scale-[3] opacity-0' : 'scale-100 opacity-100'}`}>
            <div className="relative w-96 h-96 flex items-center justify-center mb-16">
              <div className="absolute inset-0 ring-echo border-2 border-indigo-500 rounded-full" />
              <div className="absolute inset-4 ring-echo border border-indigo-500/50 rounded-full" style={{ animationDelay: '1s' }} />
              <div className="absolute inset-8 ring-echo border border-indigo-400/30 rounded-full" style={{ animationDelay: '2s' }} />
              <div className="absolute inset-0 border-t-2 border-b-2 border-indigo-500/20 rounded-full animate-orbit" />
              <div className="absolute inset-8 border-l-2 border-r-2 border-indigo-500/40 rounded-full animate-orbit-rev" />
              <div className="absolute inset-16 border-t-2 border-indigo-400/60 rounded-full animate-orbit-fast shadow-[0_0_40px_rgba(79,70,229,0.2)]" />
              <div className="relative z-20 w-44 h-44 bg-slate-950 rounded-[3.5rem] flex items-center justify-center shadow-[0_0_100px_rgba(79,70,229,0.4)] border border-white/10 group overflow-hidden">
                <BoxSelect size={80} strokeWidth={2} className="text-white relative z-10" />
                <div className="absolute inset-0 bg-indigo-500/5 opacity-50 transition-opacity" />
                <div className="absolute inset-x-0 h-1 bg-indigo-500/80 blur-md biometric-line z-20" />
                <div className="absolute bottom-0 left-0 right-0 bg-indigo-600 transition-all duration-500" style={{ height: `${bootProgress}%`, opacity: 0.15 }} />
              </div>
            </div>
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="flex items-baseline gap-4">
                 <span className="text-8xl font-black text-white font-mono tracking-tighter tabular-nums">{Math.floor(bootProgress)}</span>
                 <span className="text-2xl font-black text-indigo-500 font-mono">%</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <h3 className={`text-[13px] font-black text-indigo-400 uppercase tracking-[0.8em] font-mono transition-all duration-75 ${bootProgress % 10 < 2 ? 'text-white blur-[1px] text-glitch-active' : ''}`}>
                    {currentLog}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- BRANDING --- */}
      <div className="hidden lg:flex flex-[1.4] relative items-center justify-center overflow-hidden border-r border-white/5 bg-[#020617]">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 data-grid" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-[#020617]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.15),transparent_70%)]" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl px-12 space-y-16">
          <div className="relative w-[360px] h-[360px] flex items-center justify-center">
            <div className="absolute inset-0 border-[1px] border-indigo-500/10 rounded-full animate-orbit" />
            <div className="relative z-20 w-40 h-40 bg-indigo-600 rounded-[3.5rem] flex items-center justify-center shadow-[0_0_120px_rgba(79,70,229,0.4)] border-4 border-white/10">
               <BoxSelect size={80} strokeWidth={2.5} className="text-white relative z-10" />
            </div>
          </div>
          <div className="space-y-8">
             <div className="flex items-center justify-center gap-8">
                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-indigo-500/40" />
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.8em]">PLANIX SYSTEM</span>
                <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-indigo-500/40" />
             </div>
             <h1 className="text-[7rem] font-black text-white tracking-[-0.05em] scale-[0.9] lg:scale-100 font-black leading-none font-orbitron">
                PLAN<span className="text-indigo-500">IX</span>
             </h1>
             <div className="max-w-md mx-auto space-y-6 pt-4">
                <p className="text-slate-400 font-bold text-sm leading-relaxed uppercase tracking-[0.2em] opacity-80">
                  Precision-Engineered <span className="text-indigo-400">Task Orchestration</span> Ecosystem.
                </p>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
                  Synchronize complex workflows with military-grade efficiency. Real-time telemetry, automated analytics, and high-velocity project intelligence.
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* --- FORM PORTAL --- */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-20">
        <div className="w-full max-w-xl animate-in slide-in-from-right-12 duration-1000">
          <div className="bg-slate-950/90 backdrop-blur-3xl rounded-[3.5rem] border border-white/10 shadow-[0_40px_150px_-30px_rgba(0,0,0,0.9)] overflow-hidden">
            <div className="relative px-12 py-12 bg-slate-950/50 overflow-hidden border-b border-white/5">
               <div className="absolute inset-x-0 h-48 bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent" style={{ animation: 'scan-line 5s linear infinite' }} />
               <div className="relative z-10 flex flex-col items-center space-y-10">
                  <div className="flex items-center gap-3 px-6 py-2 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-indigo-400 shadow-[0_0_20px_rgba(79,70,229,0.1)]">
                     <ShieldCheck size={14} strokeWidth={3} />
                     <span className="text-[11px] font-black uppercase tracking-[0.4em]">
                        {mode === 'forgot' ? `Recovery Step ${recoveryStep}/3` : 'Auth Protocol'}
                     </span>
                  </div>
                  
                  {mode === 'forgot' && (
                    <div className="text-center space-y-2">
                       <h3 className="text-white text-xl font-black uppercase tracking-widest italic">{recoveryStep === 1 ? 'Identify Node' : recoveryStep === 2 ? 'Verify Link' : 'Recalibrate Key'}</h3>
                       <div className="flex gap-1.5 justify-center">
                          {[1,2,3].map(s => <div key={s} className={`h-1 rounded-full transition-all duration-500 ${s <= recoveryStep ? 'bg-indigo-500 w-6' : 'bg-white/10 w-2'}`} />)}
                       </div>
                    </div>
                  )}
               </div>
            </div>

            <form onSubmit={handleSubmit} className="p-12 lg:p-14 space-y-10">
              {error && (
                <div className="p-6 bg-rose-500/10 border-2 border-rose-500/20 rounded-[2rem] flex items-center gap-6 text-rose-400 animate-in slide-in-from-top-4 duration-500">
                  <ShieldAlert size={20} strokeWidth={3} />
                  <p className="text-[12px] font-black uppercase tracking-widest leading-relaxed">{error}</p>
                </div>
              )}
              {successMsg && (
                <div className="p-6 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-[2rem] flex items-center gap-6 text-emerald-400 animate-in slide-in-from-top-4 duration-500">
                  <ShieldCheck size={20} strokeWidth={3} />
                  <p className="text-[12px] font-black uppercase tracking-widest leading-relaxed">{successMsg}</p>
                </div>
              )}

              <div className="space-y-8">
                {/* --- LOGIN / REGISTER FIELDS --- */}
                {mode === 'register' && (
                  <div className="space-y-3 group/field">
                    <div className={`flex items-center gap-3 px-4 transition-colors ${name ? 'text-emerald-400' : 'text-slate-500'}`}>
                      <Terminal size={14} strokeWidth={3} /><label className="text-[10px] font-black uppercase tracking-[0.4em]">{t.name}</label>
                    </div>
                    <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-8 py-5 bg-slate-900/50 border-2 border-white/5 rounded-[1.75rem] text-lg font-bold text-white focus:border-emerald-500 outline-none transition-all placeholder:text-slate-800" placeholder="NAME_STRING" />
                  </div>
                )}

                {(mode !== 'forgot' || recoveryStep === 1) && (
                  <div className="space-y-3 group/field">
                    <div className={`flex items-center gap-3 px-4 transition-colors ${username ? 'text-indigo-400' : 'text-slate-500'}`}>
                      <Command size={14} strokeWidth={3} /><label className="text-[10px] font-black uppercase tracking-[0.4em]">{t.username}</label>
                    </div>
                    <input required type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-8 py-5 bg-slate-900/50 border-2 border-white/5 rounded-[1.75rem] text-lg font-bold text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-800" placeholder="ACCESS_ID" />
                  </div>
                )}

                {(mode === 'login' || mode === 'register') && (
                  <div className="space-y-3 group/field">
                    <div className="flex justify-between items-center px-4">
                      <div className={`flex items-center gap-3 transition-colors ${password ? 'text-indigo-400' : 'text-slate-500'}`}>
                        <Lock size={14} strokeWidth={3} /><label className="text-[10px] font-black uppercase tracking-[0.4em]">{t.password}</label>
                      </div>
                      {mode === 'register' && (
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${passwordStrength.color} text-white border-transparent`}>{passwordStrength.label}</div>
                      )}
                    </div>
                    <div className="relative">
                      <input required type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-8 py-5 bg-slate-900/50 border-2 border-white/5 rounded-[1.75rem] text-lg font-bold tracking-[0.2em] text-white focus:border-indigo-500 outline-none transition-all" placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-700 hover:text-indigo-400 transition-colors">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                    </div>
                    {mode === 'register' && (
                      <div className="flex gap-2 h-1.5 w-full px-2 mt-4">
                        {[1, 2, 3, 4].map((s) => (
                          <div key={s} className={`flex-1 rounded-full transition-all duration-700 ${s <= passwordStrength.score ? passwordStrength.color : 'bg-white/5'}`} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* --- MULTI-STEP RECOVERY FLOW --- */}
                {mode === 'forgot' && recoveryStep === 2 && (
                  <div className="space-y-3 group/field">
                    <div className={`flex items-center gap-3 px-4 transition-colors ${otpValue ? 'text-amber-400' : 'text-slate-500'}`}>
                      <Fingerprint size={14} strokeWidth={3} /><label className="text-[10px] font-black uppercase tracking-[0.4em]">Verification Token</label>
                    </div>
                    <input required maxLength={6} type="text" value={otpValue} onChange={(e) => setOtpValue(e.target.value.replace(/\D/g,''))} className="w-full px-8 py-5 bg-slate-900/50 border-2 border-white/5 rounded-[1.75rem] text-3xl font-mono font-black text-center tracking-[0.5em] text-indigo-400 focus:border-amber-500 outline-none transition-all placeholder:text-slate-800" placeholder="000000" />
                    <p className="text-[10px] text-center font-bold text-slate-500 uppercase tracking-widest mt-4">Check linked node primary email</p>
                  </div>
                )}

                {mode === 'forgot' && recoveryStep === 3 && (
                  <div className="space-y-6">
                    <div className="space-y-3 group/field">
                      <div className="flex justify-between items-center px-4">
                        <div className={`flex items-center gap-3 transition-colors ${newPassword ? 'text-indigo-400' : 'text-slate-500'}`}>
                          <Key size={14} strokeWidth={3} /><label className="text-[10px] font-black uppercase tracking-[0.4em]">New Access Key</label>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${passwordStrength.color} text-white border-transparent`}>{passwordStrength.label}</div>
                      </div>
                      <input required type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-8 py-5 bg-slate-900/50 border-2 border-white/5 rounded-[1.75rem] text-lg font-bold tracking-[0.2em] text-white focus:border-indigo-500 outline-none transition-all shadow-inner" placeholder="••••••••" />
                    </div>
                    <div className="space-y-3 group/field">
                      <div className={`flex items-center gap-3 transition-colors ${confirmPassword ? (confirmPassword === newPassword ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-500'}`}>
                        <RotateCcw size={14} strokeWidth={3} /><label className="text-[10px] font-black uppercase tracking-[0.4em]">Verify Key</label>
                      </div>
                      <input required type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`w-full px-8 py-5 bg-slate-900/50 border-2 rounded-[1.75rem] text-lg font-bold tracking-[0.2em] text-white outline-none transition-all shadow-inner ${confirmPassword ? (confirmPassword === newPassword ? 'border-emerald-500/50' : 'border-rose-500/50') : 'border-white/5'}`} placeholder="••••••••" />
                    </div>
                  </div>
                )}
              </div>

              {/* --- ACTION BUTTONS --- */}
              <div className="flex flex-col items-center gap-10">
                <button 
                  disabled={loading || !isFormValid} 
                  type="submit" 
                  className={`relative w-full max-w-[340px] py-5 text-white font-black text-[13px] uppercase tracking-[0.5em] rounded-full shadow-2xl transition-all duration-500 flex items-center justify-center gap-5 overflow-hidden border-2 
                    ${!isFormValid ? 'bg-slate-900 text-slate-700 border-white/5 cursor-not-allowed opacity-50' : 'bg-indigo-600 hover:bg-indigo-50 border-indigo-400/20 active:scale-[0.96]'}
                  `}
                >
                  {loading ? (
                    <div className="flex items-center gap-4 relative z-10"><Loader2 size={20} className="animate-spin text-white" /><span className="tracking-[0.3em]">Processing</span></div>
                  ) : (
                    <>
                      <div className={`w-2 h-2 rounded-full ${isFormValid ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'}`} />
                      <span className="relative z-10">
                        {mode === 'login' ? 'Authorize' : mode === 'register' ? 'Register' : (recoveryStep === 1 ? 'Send OTP' : recoveryStep === 2 ? 'Verify Token' : 'Update Key')}
                      </span>
                      <ArrowRight size={18} strokeWidth={3} className={`transition-all duration-500 ${isFormValid ? 'translate-x-1 opacity-100' : 'opacity-20'}`} />
                    </>
                  )}
                </button>

                <div className="flex flex-col items-center gap-8 w-full border-t border-white/5 pt-8">
                  {mode !== 'login' && (
                    <button type="button" onClick={() => { setMode('login'); setRecoveryStep(1); setRecoveryUser(null); setError(null); setSuccessMsg(null); setMockEmailReceived(null); }} className="flex items-center gap-4 text-[12px] font-black uppercase tracking-[0.4em] text-indigo-400 hover:text-white transition-all group">
                      <ChevronLeft size={20} strokeWidth={4} className="group-hover:-translate-x-1 transition-transform" />
                      Back to Base
                    </button>
                  )}
                </div>
              </div>
            </form>
            
            <div className="pb-12 px-12 flex justify-between items-center text-[10px] font-black font-mono tracking-[0.4em]">
               <div className="flex items-center gap-3 text-indigo-400 drop-shadow-[0_0_10px_rgba(129,140,248,0.3)]">
                  <Network size={14} strokeWidth={2.5} /> 
                  <span className="bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">ENCRYPTED_UPLINK</span>
               </div>
               <div className="flex items-center gap-3 text-indigo-400/90">
                  <Cpu size={14} strokeWidth={2.5} /> 
                  <span className="bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">V4.2.0_CORE</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;