import React, { useState } from 'react';
import { verifyPasscode, setSessionAuthenticated } from '../utils/auth';
import { Layers, ShieldCheck, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setError('Please enter your authorized access key');
      return;
    }

    setIsVerifying(true);
    setError(null);

    const isValid = await verifyPasscode(passcode);
    setIsVerifying(false);

    if (isValid) {
      setSessionAuthenticated(true);
      onLoginSuccess();
    } else {
      setError('Invalid access key. Please check your credentials and try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-[#101726] border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-[1.5px] shadow-lg shadow-cyan-500/20 mb-4">
            <div className="w-full h-full bg-[#0d1424] rounded-[14.5px] flex items-center justify-center">
              <Layers className="w-7 h-7 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">ProjectPulse</h1>
          <p className="text-xs text-slate-400 mt-1">
            Developer Workspace & Multi-Platform Pipeline
          </p>
        </div>

        {/* Security Badge */}
        <div className="bg-[#090d16] border border-slate-800/80 rounded-2xl p-3.5 mb-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-200 block">
              Cryptographically Protected Access
            </span>
            <span className="text-[10px] text-slate-500 block">
              Access key validated via one-way SHA-256 digest
            </span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
              Authorized Developer Key
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPasscode ? 'text' : 'password'}
                autoFocus
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter access key..."
                className="w-full bg-[#090d16] border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                tabIndex={-1}
              >
                {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-300 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 active:scale-[0.99] disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-950/40 transition-all"
          >
            <span>{isVerifying ? 'Verifying Key...' : 'Unlock Workspace'}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500">
            Android · Web · Cross-Platform Task & Step Execution
          </p>
        </div>
      </div>
    </div>
  );
};
