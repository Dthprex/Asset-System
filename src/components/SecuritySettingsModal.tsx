'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuestion?: string;
  initialRecoveryKey?: string;
  onUpdated: (meta: { securityQuestion: string; recoveryKey: string }) => void;
}

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({
  isOpen,
  onClose,
  initialQuestion = 'Which area/suburb is the cosmetics.lk Head Office (HQ) located in?',
  initialRecoveryKey = 'COSMETICS-IT-ADMIN',
  onUpdated,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  const [securityQuestion, setSecurityQuestion] = useState(initialQuestion);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [recoveryKey, setRecoveryKey] = useState(initialRecoveryKey);

  const [copiedKey, setCopiedKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSecurityQuestion(initialQuestion);
      setRecoveryKey(initialRecoveryKey);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setSecurityAnswer('');
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialQuestion, initialRecoveryKey]);

  if (!isOpen) return null;

  const handleCopyRecoveryKey = () => {
    navigator.clipboard.writeText(recoveryKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!currentPassword.trim()) {
      setError('Please enter your current password to save security changes.');
      return;
    }

    if (newPassword.trim()) {
      if (newPassword.trim().length < 4) {
        setError('New password must be at least 4 characters long.');
        return;
      }
      if (newPassword.trim() !== confirmNewPassword.trim()) {
        setError('New password and confirmation do not match.');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_security',
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim() || undefined,
          securityQuestion: securityQuestion.trim() || undefined,
          securityAnswer: securityAnswer.trim() || undefined,
          recoveryKey: recoveryKey.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to update security settings.');
        setLoading(false);
        return;
      }

      setSuccessMsg('Password & recovery settings saved to Supabase Cloud!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setSecurityAnswer('');
      onUpdated({
        securityQuestion: data.securityQuestion || securityQuestion,
        recoveryKey: data.recoveryKey || recoveryKey,
      });
      setLoading(false);
    } catch {
      setError('Network error while saving security settings.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-[#ead7c7] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#fbf5ef] to-white border-b border-[#f0e6de] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#faece2] border border-[#ead7c7] flex items-center justify-center text-[#c28551]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Portal Password &amp; Recovery Settings
              </h2>
              <p className="text-xs text-slate-500">
                Manage your admin password and Forgot Password recovery options
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Current Password Verification */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Current Portal Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#c28551]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password to authorize changes"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#fdfbf9] border border-[#e6d5c5] text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#c28551]/25 focus:border-[#c28551]"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Change Password Section */}
          <div className="p-4 rounded-2xl bg-[#fbf5ef]/50 border border-[#f0e6de] space-y-3">
            <div className="text-xs font-bold text-[#c28551] uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Change Portal Password (Optional)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  New Password
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#e6d5c5] text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#c28551]/25 focus:border-[#c28551]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#e6d5c5] text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#c28551]/25 focus:border-[#c28551]"
                />
              </div>
            </div>
          </div>

          {/* Password Recovery Options */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#c28551]" />
              <span>Forgot Password Recovery Options</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Security Question
              </label>
              <input
                type="text"
                value={securityQuestion}
                onChange={(e) => setSecurityQuestion(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#c28551]/25 focus:border-[#c28551]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                New Security Question Answer (Leave blank to keep current answer)
              </label>
              <input
                type="text"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                placeholder="e.g., Pepiliyana (case-insensitive)"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#c28551]/25 focus:border-[#c28551]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Master Recovery Key (Keep a copy in a safe place)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={recoveryKey}
                  onChange={(e) => setRecoveryKey(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#c28551]/25 focus:border-[#c28551]"
                />
                <button
                  type="button"
                  onClick={handleCopyRecoveryKey}
                  className="px-3 py-2 rounded-xl border border-[#ead7c7] bg-[#fbf5ef] hover:bg-[#faece2] text-[#c28551] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#c28551] to-[#dfae85] hover:from-[#b07440] hover:to-[#cb8e5c] text-white text-xs font-bold shadow-md shadow-[#c28551]/20 transition cursor-pointer disabled:opacity-60"
            >
              {loading ? 'Saving...' : 'Save Security Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
