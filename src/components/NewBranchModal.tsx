'use client';

import React, { useState } from 'react';
import { 
  X, 
  Store, 
  MapPin, 
  Tag, 
  Building2, 
  Plus, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Branch } from '@/types/asset';

interface NewBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newBranch: Branch) => void;
}

export const NewBranchModal: React.FC<NewBranchModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<Branch['type']>('Showroom');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto-generate a branch code from name if user hasn't explicitly customized it
  const handleNameChange = (val: string) => {
    setName(val);
    if (!code || code.length <= 6) {
      const words = val.trim().split(/\s+/).filter(Boolean);
      let suggested = '';
      if (words.length >= 2) {
        suggested = (words[0].slice(0, 3) + '-' + words[1].slice(0, 2)).toUpperCase();
      } else if (words.length === 1) {
        suggested = (words[0].slice(0, 4) + '-01').toUpperCase();
      }
      if (suggested) setCode(suggested);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter a location or showroom name');
      return;
    }
    if (!code.trim()) {
      setError('Please provide a unique short branch code');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          type,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to register shop location');
      }

      onSuccess(data.data);
      setName('');
      setCode('');
      setType('Showroom');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong while saving the location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#f0e6de] overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-[#fbf5ef] border-b border-[#f0e6de] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#faece2] text-[#c28551]">
              <Store className="w-5 h-5 text-[#c28551]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Add New Shop / Branch Location</h3>
              <p className="text-xs text-slate-500">Register a new retail showroom, kiosk, or warehouse hub</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/80 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Location Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Showroom / Location Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Havelock City Mall Outlet, Galle Fort Boutique"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#f0e6de] text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c28551]/30 focus:border-[#c28551] bg-[#fdfbf9]"
              />
            </div>
          </div>

          {/* Branch Code & Facility Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Branch Code <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. HCM-01, GAL-01"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#f0e6de] text-xs font-mono font-bold text-[#c28551] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c28551]/30 focus:border-[#c28551] bg-[#fdfbf9]"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Short identifier used on hardware barcodes</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Facility Category <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as Branch['type'])}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#f0e6de] text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#c28551]/30 focus:border-[#c28551] bg-[#fdfbf9] cursor-pointer"
                >
                  <option value="Showroom">Retail Showroom</option>
                  <option value="Outlet">Mall Kiosk / Outlet</option>
                  <option value="Head Office">Head Office / Corporate</option>
                  <option value="Warehouse">Warehouse & Logistics</option>
                  <option value="IT Department">Central IT Hub / Lab</option>
                </select>
              </div>
            </div>
          </div>

          {/* Preview Box */}
          <div className="p-3.5 rounded-2xl bg-[#faf7f3] border border-[#f0e6de] text-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#c28551] tracking-wider block">Location Badge Preview</span>
            <div className="flex items-center justify-between font-semibold text-slate-800 pt-1">
              <span>{name || 'New Showroom Location'}</span>
              <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold bg-[#faece2] text-[#c28551] border border-[#ead7c7]">
                {code || 'CODE'} • {type}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#f0e6de] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#c28551] to-[#dfae85] hover:from-[#b07440] hover:to-[#cb8e5c] text-white text-xs font-semibold shadow-md shadow-[#c28551]/20 transition flex items-center gap-2 cursor-pointer btn-press disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Saving Location...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Register Location</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
