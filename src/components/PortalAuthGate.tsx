'use client';

import React, { useState, useEffect } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface PortalAuthGateProps {
  onAuthenticated: (meta: { securityQuestion: string; recoveryKey: string; rememberMe: boolean }) => void;
}

export const PortalAuthGate: React.FC<PortalAuthGateProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'reset'>('login');
  const [recoveryMethod, setRecoveryMethod] = useState<'security_question' | 'recovery_key'>('security_question');

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [securityQuestion, setSecurityQuestion] = useState(
    'Which area/suburb is the cosmetics.lk Head Office (HQ) located in?'
  );
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [recoveryKeyInput, setRecoveryKeyInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.securityQuestion) {
          setSecurityQuestion(data.securityQuestion);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!password.trim()) {
      setError('Please enter the portal password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          password: password.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Incorrect password. Please try again.');
        setLoading(false);
        return;
      }

      onAuthenticated({
        securityQuestion: data.securityQuestion || securityQuestion,
        recoveryKey: data.recoveryKey || 'COSMETICS-IT-ADMIN',
        rememberMe,
      });
    } catch {
      setError('Network error while verifying password. Please try again.');
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (recoveryMethod === 'security_question' && !securityAnswer.trim()) {
      setError('Please enter the answer to the security question.');
      return;
    }

    if (recoveryMethod === 'recovery_key' && !recoveryKeyInput.trim()) {
      setError('Please enter your Master Recovery Key.');
      return;
    }

    if (!newPassword.trim() || newPassword.trim().length < 4) {
      setError('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword.trim() !== confirmNewPassword.trim()) {
      setError('New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_password',
          recoveryMethod,
          securityAnswer: securityAnswer.trim(),
          recoveryKey: recoveryKeyInput.trim(),
          newPassword: newPassword.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Could not reset password. Please check your verification details.');
        setLoading(false);
        return;
      }

      setSuccessMsg('Password reset successfully! Signing you into the portal...');
      setTimeout(() => {
        onAuthenticated({
          securityQuestion: data.securityQuestion || securityQuestion,
          recoveryKey: data.recoveryKey || 'COSMETICS-IT-ADMIN',
          rememberMe: true,
        });
      }, 900);
    } catch {
      setError('Network error while resetting password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfbf9] via-[#faf4ee] to-[#f4e8dc] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Subtle decorative background glow */}
      <div className="pointer-events-none fixed -top-32 -right-32 w-96 h-96 rounded-full bg-[#c28551]/10 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#dfae85]/15 blur-3xl" />

      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl border border-[#ead7c7] shadow-2xl shadow-[#c28551]/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Brand Banner */}
        <div className="px-7 pt-8 pb-6 bg-gradient-to-b from-[#fbf5ef] to-white border-b border-[#f0e6de] text-center">
          <div className="inline-flex items-center justify-center mb-3">
            <img
              src="/cosmetics-logo.png"
              alt="cosmetics.lk"
              className="h-10 w-auto object-contain"
            />
          </div>
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#c28551]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>IT Infrastructure &amp; Fleet Custody Portal</span>
          </div>
          <h1 className="text-lg font-extrabold text-slate-900 mt-2">
            {mode === 'login' ? 'Authorized Admin Sign In' : 'Reset Portal Password'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'login'
              ? 'Enter your administrator password to unlock fleet inventory & custody controls.'
              : 'Verify your identity using your Security Question or Master Recovery Key to set a new password.'}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-7">
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Portal Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#c28551]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter portal password..."
                    autoFocus
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-[#fdfbf9] border border-[#e6d5c5] text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c28551]/25 focus:border-[#c28551] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-[#c28551] focus:ring-[#c28551]"
                  />
                  <span>Keep me signed in on this device</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setMode('reset');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs font-bold text-[#c28551] hover:text-[#9f6738] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#c28551] to-[#dfae85] hover:from-[#b07440] hover:to-[#cb8e5c] text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-[#c28551]/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                <span>{loading ? 'Verifying Access...' : 'Unlock IT Fleet Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* Recovery Method Selector Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#fbf5ef] border border-[#ead7c7]">
                <button
                  type="button"
                  onClick={() => {
                    setRecoveryMethod('security_question');
                    setError(null);
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    recoveryMethod === 'security_question'
                      ? 'bg-white text-[#c28551] shadow-xs border border-[#ead7c7]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Security Question</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRecoveryMethod('recovery_key');
                    setError(null);
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    recoveryMethod === 'recovery_key'
                      ? 'bg-white text-[#c28551] shadow-xs border border-[#ead7c7]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Recovery Key</span>
                </button>
              </div>

              {recoveryMethod === 'security_question' ? (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-[#fbf5ef]/70 border border-[#ead7c7] text-xs text-slate-700">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[#c28551] mb-0.5">
                      Security Question
                    </span>
                    <span className="font-semibold text-slate-800">{securityQuestion}</span>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Your Answer
                    </label>
                    <input
                      type="text"
                      value={securityAnswer}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                      placeholder="e.g., Nawala"
                      autoFocus
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#fdfbf9] border border-[#e6d5c5] text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c28551]/25 focus:border-[#c28551]"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Master Recovery Key
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#c28551]">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={recoveryKeyInput}
                      onChange={(e) => setRecoveryKeyInput(e.target.value)}
                      placeholder="e.g., COSMETICS-IT-ADMIN"
                      autoFocus
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#fdfbf9] border border-[#e6d5c5] font-mono text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c28551]/25 focus:border-[#c28551]"
                    />
                  </div>
                </div>
              )}

              <div className="pt-1 border-t border-slate-100 space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    New Portal Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min. 4 chars)"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#fdfbf9] border border-[#e6d5c5] text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c28551]/25 focus:border-[#c28551]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#fdfbf9] border border-[#e6d5c5] text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c28551]/25 focus:border-[#c28551]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#c28551] to-[#dfae85] hover:from-[#b07440] hover:to-[#cb8e5c] text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-[#c28551]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  <span>{loading ? 'Resetting...' : 'Reset Password & Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 py-4 bg-[#fbf5ef]/60 border-t border-[#f0e6de] flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#c28551]" />
            Protected by Supabase Cloud Vault
          </span>
          <span className="font-semibold text-[#c28551]">cosmetics.lk</span>
        </div>
      </div>
    </div>
  );
};
