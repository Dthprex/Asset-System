'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  RotateCcw, 
  Clock, 
  AlertTriangle, 
  Check, 
  ShieldAlert, 
  Sparkles,
  Tag
} from 'lucide-react';
import { Asset, AssetCondition } from '@/types/asset';
import { calculateDuration, formatDate } from '@/lib/utils';

interface ReturnChecklistModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: Asset) => void;
}

const DAMAGE_TAGS = [
  'Minor Bezel Scratches',
  'Display / Screen Hairline Scratches',
  'Cracked Screen / Glass Damage',
  'Liquid Ingress / Spill Marks',
  'Sticky / Unresponsive Keyboard Keys',
  'Intermittent Trackpad / Port Issue',
  'Battery Degradation / Overheating',
  'Missing Original Charger / Cable',
  'Missing Case / Carrying Bag'
];

export const ReturnChecklistModal: React.FC<ReturnChecklistModalProps> = ({
  asset,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [returnDate, setReturnDate] = useState('');

  useEffect(() => {
    if (isOpen && !returnDate) {
      setReturnDate(new Date().toISOString().slice(0, 10));
    }
  }, [isOpen, returnDate]);

  const [conditionUponReturn, setConditionUponReturn] = useState<AssetCondition>('Used - Good');
  const [selectedDamageTags, setSelectedDamageTags] = useState<string[]>([]);
  const [damageNotes, setDamageNotes] = useState('');
  const [sanitizationNotes, setSanitizationNotes] = useState('Sanitized with isopropyl alcohol, data wiped, and verified functional.');
  const [performedBy, setPerformedBy] = useState('IT Asset Admin');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !asset || !asset.currentAssignment) return null;

  const currentHolder = asset.currentAssignment.assignedToName;
  const currentBranch = asset.currentAssignment.locationOrBranch;
  const assignedDate = asset.currentAssignment.assignedDate;
  const custodyDuration = calculateDuration(assignedDate, returnDate);

  const toggleDamageTag = (tag: string) => {
    if (selectedDamageTags.includes(tag)) {
      setSelectedDamageTags(selectedDamageTags.filter(t => t !== tag));
    } else {
      setSelectedDamageTags([...selectedDamageTags, tag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // Combine selected tags with custom notes
    const combinedDamages = [
      ...selectedDamageTags,
      damageNotes.trim()
    ].filter(Boolean).join('. ');

    try {
      const res = await fetch(`/api/assets/${asset.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnDate,
          conditionUponReturn: selectedDamageTags.length > 0 && !conditionUponReturn.includes('Damaged') 
            ? 'Used - Fair' 
            : conditionUponReturn,
          damages: combinedDamages,
          notes: sanitizationNotes.trim(),
          performedBy,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to process return');
      }

      onSuccess(data.data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error occurred during return');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-6 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#fbf5ef] border border-[#c28551]/30 flex items-center justify-center text-[#c28551]">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Return Check-in & Damage Checklist</h2>
              <p className="text-xs text-slate-500">
                {asset.name} • <span className="font-mono text-[#c28551] font-semibold">{asset.assetTag}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Custody Card */}
        <div className="m-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Returning From</span>
            <div className="text-xs font-bold text-slate-900 mt-0.5">{currentHolder}</div>
            <div className="text-[11px] text-slate-500">{currentBranch}</div>
          </div>

          <div className="p-2 px-3 rounded-xl bg-white border border-slate-200 text-xs font-mono flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#c28551]" />
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Total Custody Period</span>
              <span className="font-bold text-slate-800">{custodyDuration}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-6 mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Return Date (Asia/Colombo) <span className="text-[#c28551]">*</span>
              </label>
              <input
                type="date"
                required
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:ring-2 focus:ring-[#c28551]/20 focus:border-[#c28551] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Condition Upon Return <span className="text-[#c28551]">*</span>
              </label>
              <select
                value={conditionUponReturn}
                onChange={(e) => setConditionUponReturn(e.target.value as AssetCondition)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:ring-2 focus:ring-[#c28551]/20 focus:border-[#c28551] focus:bg-white transition cursor-pointer"
              >
                <option value="Used - Like New">Used - Like New (Mint Condition)</option>
                <option value="Used - Good">Used - Good (Normal Cosmetic Wear)</option>
                <option value="Used - Fair">Used - Fair (Visible Wear / Scratches)</option>
                <option value="Damaged / Needs Repair">Damaged / Needs Repair (Defects)</option>
                <option value="Scrapped / Retired">Unrepairable / Total Scrapped Loss</option>
              </select>
            </div>
          </div>

          {/* Quick Damage Severity Checklist Tags */}
          <div className="p-4 rounded-2xl bg-[#fbf5ef]/70 border border-[#c28551]/30 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <AlertTriangle className="w-4 h-4 text-[#c28551]" />
              <span>Inspection Checklist: Tap Any Detected Issues</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Select all physical defects observed during return inspection:
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {DAMAGE_TAGS.map((tag) => {
                const isSelected = selectedDamageTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleDamageTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer border ${
                      isSelected
                        ? 'bg-[#c28551] text-white border-[#c28551] shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-[#c28551]/40 hover:text-[#c28551]'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            <div>
              <textarea
                rows={2}
                value={damageNotes}
                onChange={(e) => setDamageNotes(e.target.value)}
                placeholder="Additional specific damage details, e.g. spacebar has liquid stickiness, power brick cord is frayed..."
                className="w-full mt-2 px-3 py-2 rounded-xl bg-white border border-[#c28551]/30 text-slate-900 text-xs focus:ring-1 focus:ring-[#c28551] placeholder-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sanitization & Wipe Notes
            </label>
            <input
              type="text"
              value={sanitizationNotes}
              onChange={(e) => setSanitizationNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:ring-2 focus:ring-[#c28551]/20 focus:border-[#c28551] focus:bg-white transition"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#c28551] hover:bg-[#a66c3b] text-white text-xs font-semibold shadow-md shadow-[#c28551]/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <span>Checking In...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirm Return to Inventory</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
