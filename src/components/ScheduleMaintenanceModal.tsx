'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  CalendarCheck,
  Calendar,
  User,
  Zap,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { Asset, MaintenanceType, MaintenanceRecord } from '@/types/asset';
import { calculateNextBiannualDate } from '@/lib/utils';

interface ScheduleMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (record: MaintenanceRecord) => void;
  assets: Asset[];
  preselectedAsset?: Asset | null;
  defaultType?: MaintenanceType;
}

export const ScheduleMaintenanceModal: React.FC<ScheduleMaintenanceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  assets,
  preselectedAsset = null,
  defaultType = 'BIANNUAL_ROUTINE',
}) => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [type, setType] = useState<MaintenanceType>(defaultType);
  const [scheduledDate, setScheduledDate] = useState('');
  const [inspector, setInspector] = useState('Nuwan Bandara (Lead Systems Engineer)');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setType(defaultType);
      const today = new Date().toISOString().slice(0, 10);
      if (defaultType === 'RANDOM_SPOT_CHECK') {
        setScheduledDate(today);
      } else {
        // Scheduled 6-month routine or in 14 days
        const target = new Date();
        target.setDate(target.getDate() + 14);
        setScheduledDate(target.toISOString().slice(0, 10));
      }

      if (preselectedAsset) {
        setSelectedAssetId(preselectedAsset.id);
      } else if (assets.length > 0 && !selectedAssetId) {
        setSelectedAssetId(assets[0].id);
      }
    }
  }, [isOpen, preselectedAsset, assets, defaultType]);

  if (!isOpen) return null;

  const currentAsset = preselectedAsset || assets.find(a => a.id === selectedAssetId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentAsset) {
      setError('Please select an asset.');
      return;
    }

    if (!scheduledDate) {
      setError('Please select a scheduled inspection date.');
      return;
    }

    setSubmitting(true);

    try {
      const nextDate = type === 'BIANNUAL_ROUTINE' ? calculateNextBiannualDate(scheduledDate) : '';

      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: currentAsset.id,
          assetTag: currentAsset.assetTag,
          assetName: currentAsset.name,
          category: currentAsset.category,
          type,
          scheduledDate,
          inspector,
          nextScheduledDate: nextDate,
          notes,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to schedule inspection.');
      }

      onSuccess(data.data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error occurred while scheduling.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-white border border-[#f0e6de] rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-[#fbf5ef] border-b border-[#f0e6de] flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#c28551] text-white flex items-center justify-center shadow-md shadow-[#c28551]/20">
              {type === 'RANDOM_SPOT_CHECK' ? (
                <Zap className="w-6 h-6 text-[#faece2]" />
              ) : (
                <CalendarCheck className="w-6 h-6 text-[#faece2]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#faece2] text-[#c28551] border border-[#ead7c7]">
                  {type === 'RANDOM_SPOT_CHECK' ? 'Impromptu Spot Audit' : 'Semi-Annual Protocol'}
                </span>
                <span className="text-xs text-slate-400 font-mono">• Health Check</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                {type === 'RANDOM_SPOT_CHECK' ? 'Trigger Random Spot Check' : 'Schedule Biannual Routine (6-Month)'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white/80 transition cursor-pointer btn-press-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Inspection Type Selector */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Inspection Cadence & Protocol
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('BIANNUAL_ROUTINE')}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  type === 'BIANNUAL_ROUTINE'
                    ? 'bg-[#fbf5ef] border-[#c28551] text-[#713f12] shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-[#c28551]" />
                    <span className="font-bold text-xs">Biannual Routine</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#faece2] text-[#c28551] border border-[#ead7c7]">
                    Every 6 Mos
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Scheduled preventive overhaul. Cleans thermals, tests battery capacity, and sets next 6-month cycle.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('RANDOM_SPOT_CHECK');
                  setScheduledDate(new Date().toISOString().slice(0, 10));
                }}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  type === 'RANDOM_SPOT_CHECK'
                    ? 'bg-amber-50 border-amber-400 text-amber-950 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-xs">Random Spot Check</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    Unannounced
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Surprise physical inspection sweep on showroom desks or field staff to catch wear early.
                </p>
              </button>
            </div>
          </div>

          {/* Asset Selection */}
          <div className="p-4 rounded-2xl bg-[#fdfbf9] border border-[#f0e6de] space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Target Hardware Item
            </label>
            {preselectedAsset ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{preselectedAsset.name}</div>
                  <div className="text-slate-500 font-mono text-xs">
                    Tag: <span className="text-[#c28551] font-bold">{preselectedAsset.assetTag}</span> • SN: {preselectedAsset.serialNumber}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                  {preselectedAsset.status}
                </span>
              </div>
            ) : (
              <select
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#c28551]/30 font-medium"
              >
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.assetTag} - {a.name} ({a.currentAssignment?.assignedToName || 'In IT Lab'})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date & Inspector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Scheduled Inspection Date *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="date"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#c28551]/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Assigned Inspector / Tech Lead
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={inspector}
                  onChange={(e) => setInspector(e.target.value)}
                  placeholder="e.g. Nuwan Bandara (Systems Lead)"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#c28551]/30 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Inspection Instructions / Checklist Focus
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Check for thermal throttling under load, test battery cycle wear, inspect MagSafe / USB-C ports for lint."
              className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#c28551]/30 leading-relaxed"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition cursor-pointer btn-press-sm"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#c28551] to-[#dfae85] hover:from-[#b07440] hover:to-[#cb8e5c] text-white font-bold shadow-md shadow-[#c28551]/20 flex items-center gap-2 transition cursor-pointer btn-press disabled:opacity-50"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>{submitting ? 'Scheduling...' : 'Confirm Maintenance Booking'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
