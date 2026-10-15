'use client';

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Flame,
  BatteryCharging,
  Cpu,
  Monitor,
  ShieldCheck,
  Sparkles,
  DollarSign,
  CalendarCheck,
  Calendar
} from 'lucide-react';
import { MaintenanceRecord, MaintenanceHealthGrade, MaintenanceChecklist } from '@/types/asset';
import { formatLKR, formatDate, calculateNextBiannualDate } from '@/lib/utils';

interface CompleteInspectionModalProps {
  record: MaintenanceRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: MaintenanceRecord, nextRoutine?: MaintenanceRecord) => void;
}

const HEALTH_GRADES: { grade: MaintenanceHealthGrade; label: string; desc: string; color: string }[] = [
  {
    grade: 'EXCELLENT',
    label: 'Grade A - Mint Condition',
    desc: 'Flawless operation, optimal thermals, pristine chassis, 0 defects.',
    color: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  },
  {
    grade: 'GOOD',
    label: 'Grade B - Normal Wear',
    desc: 'Fully operational, light cosmetic wear, expected battery aging.',
    color: 'border-teal-300 bg-teal-50 text-teal-900',
  },
  {
    grade: 'NEEDS_ATTENTION',
    label: 'Grade C - Minor Degraded',
    desc: 'Thermals running warm, low battery health, or sticky port. Monitor closely.',
    color: 'border-amber-300 bg-amber-50 text-amber-900',
  },
  {
    grade: 'CRITICAL_RISK',
    label: 'Grade D - Critical Failure Risk',
    desc: 'Swollen battery, fan failure, or S.M.A.R.T. disk errors. Flags asset for immediate repair!',
    color: 'border-rose-300 bg-rose-50 text-rose-900',
  },
];

export const CompleteInspectionModal: React.FC<CompleteInspectionModalProps> = ({
  record,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [checklist, setChecklist] = useState<MaintenanceChecklist>(
    record?.checklist || {
      thermalAndCooling: true,
      batteryHealth: true,
      portsAndConnectivity: true,
      displayAndChassis: true,
      softwareAndSecurity: true,
      sanitization: true,
    }
  );

  const [healthGrade, setHealthGrade] = useState<MaintenanceHealthGrade>(
    record?.healthGrade || 'EXCELLENT'
  );
  const [batteryHealthPercent, setBatteryHealthPercent] = useState<number | ''>(
    record?.batteryHealthPercent || 95
  );
  const [completedDate, setCompletedDate] = useState(
    record?.completedDate || new Date().toISOString().slice(0, 10)
  );
  const [findings, setFindings] = useState(
    record?.findings || 'Hardware diagnostic passed all standard benchmarks. Thermals within nominal thresholds.'
  );
  const [actionTaken, setActionTaken] = useState(
    record?.actionTaken || 'Cleaned cooling heatsink with pressurized air, lubricated fan bearings, wiped exterior with 70% isopropyl alcohol.'
  );
  const [costLKR, setCostLKR] = useState<number | ''>(record?.costLKR || 0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !record) return null;

  const toggleChecklistItem = (key: keyof MaintenanceChecklist) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const nextSixMonthDate = calculateNextBiannualDate(completedDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/maintenance/${record.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checklist,
          healthGrade,
          batteryHealthPercent: batteryHealthPercent === '' ? undefined : Number(batteryHealthPercent),
          completedDate,
          findings,
          actionTaken,
          costLKR: Number(costLKR) || 0,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to complete inspection.');
      }

      onSuccess(data.data, data.nextRoutineRecord);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving inspection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white border border-[#f0e6de] rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-[#fbf5ef] border-b border-[#f0e6de] flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#c28551] text-white flex items-center justify-center shadow-md shadow-[#c28551]/20">
              <CheckCircle2 className="w-6 h-6 text-[#faece2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#faece2] text-[#c28551] border border-[#ead7c7]">
                  {record.id}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  • {record.type === 'BIANNUAL_ROUTINE' ? 'Biannual (6-Month) Overhaul' : 'Random Spot Audit'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                Complete Hardware Health Inspection
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

          {/* Asset Summary */}
          <div className="p-4 rounded-2xl bg-[#fdfbf9] border border-[#f0e6de] flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900 text-sm">{record.assetName}</div>
              <div className="text-slate-500 font-mono text-xs">
                Tag: <span className="text-[#c28551] font-bold">{record.assetTag}</span> • Category: {record.category}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Inspector</span>
              <span className="text-xs font-semibold text-slate-800">{record.inspector}</span>
            </div>
          </div>

          {/* 6-Point Hardware Health Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                6-Point Hardware Health & Safety Checklist
              </label>
              <span className="text-[10px] text-slate-500">Toggle each item to verify condition</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* 1. Thermal & Cooling */}
              <button
                type="button"
                onClick={() => toggleChecklistItem('thermalAndCooling')}
                className={`p-3 rounded-xl border flex items-center justify-between transition cursor-pointer text-left ${
                  checklist.thermalAndCooling
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Flame className={`w-4 h-4 ${checklist.thermalAndCooling ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <div>
                    <div className="font-bold text-[11px]">Thermals & Cooling Airflow</div>
                    <div className="text-[10px] opacity-80">Fans clear of dust, paste refreshed</div>
                  </div>
                </div>
                <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs ${
                  checklist.thermalAndCooling ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                }`}>
                  ✓
                </span>
              </button>

              {/* 2. Battery Health */}
              <button
                type="button"
                onClick={() => toggleChecklistItem('batteryHealth')}
                className={`p-3 rounded-xl border flex items-center justify-between transition cursor-pointer text-left ${
                  checklist.batteryHealth
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BatteryCharging className={`w-4 h-4 ${checklist.batteryHealth ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <div>
                    <div className="font-bold text-[11px]">Battery Health & Cells</div>
                    <div className="text-[10px] opacity-80">No swelling, cycle capacity stable</div>
                  </div>
                </div>
                <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs ${
                  checklist.batteryHealth ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                }`}>
                  ✓
                </span>
              </button>

              {/* 3. Ports & Connectivity */}
              <button
                type="button"
                onClick={() => toggleChecklistItem('portsAndConnectivity')}
                className={`p-3 rounded-xl border flex items-center justify-between transition cursor-pointer text-left ${
                  checklist.portsAndConnectivity
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Cpu className={`w-4 h-4 ${checklist.portsAndConnectivity ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <div>
                    <div className="font-bold text-[11px]">Ports & SIM Connectivity</div>
                    <div className="text-[10px] opacity-80">USB-C, MagSafe, Wi-Fi 6 inspected</div>
                  </div>
                </div>
                <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs ${
                  checklist.portsAndConnectivity ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                }`}>
                  ✓
                </span>
              </button>

              {/* 4. Display & Chassis */}
              <button
                type="button"
                onClick={() => toggleChecklistItem('displayAndChassis')}
                className={`p-3 rounded-xl border flex items-center justify-between transition cursor-pointer text-left ${
                  checklist.displayAndChassis
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Monitor className={`w-4 h-4 ${checklist.displayAndChassis ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <div>
                    <div className="font-bold text-[11px]">Display & Chassis Structure</div>
                    <div className="text-[10px] opacity-80">No dead pixels, hinge tension tight</div>
                  </div>
                </div>
                <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs ${
                  checklist.displayAndChassis ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                }`}>
                  ✓
                </span>
              </button>

              {/* 5. Software & Security */}
              <button
                type="button"
                onClick={() => toggleChecklistItem('softwareAndSecurity')}
                className={`p-3 rounded-xl border flex items-center justify-between transition cursor-pointer text-left ${
                  checklist.softwareAndSecurity
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className={`w-4 h-4 ${checklist.softwareAndSecurity ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <div>
                    <div className="font-bold text-[11px]">OS & S.M.A.R.T. Health</div>
                    <div className="text-[10px] opacity-80">Disk S.M.A.R.T. healthy, patched</div>
                  </div>
                </div>
                <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs ${
                  checklist.softwareAndSecurity ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                }`}>
                  ✓
                </span>
              </button>

              {/* 6. Sanitization */}
              <button
                type="button"
                onClick={() => toggleChecklistItem('sanitization')}
                className={`p-3 rounded-xl border flex items-center justify-between transition cursor-pointer text-left ${
                  checklist.sanitization
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className={`w-4 h-4 ${checklist.sanitization ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <div>
                    <div className="font-bold text-[11px]">Alcohol Sanitization</div>
                    <div className="text-[10px] opacity-80">Keyboard & glass wiped, sanitary</div>
                  </div>
                </div>
                <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs ${
                  checklist.sanitization ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                }`}>
                  ✓
                </span>
              </button>
            </div>
          </div>

          {/* Health Grade Selection */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Overall Health Classification Grade
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {HEALTH_GRADES.map((g) => (
                <label
                  key={g.grade}
                  className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition ${
                    healthGrade === g.grade
                      ? `${g.color} ring-2 ring-current shadow-xs`
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="healthGrade"
                    value={g.grade}
                    checked={healthGrade === g.grade}
                    onChange={() => setHealthGrade(g.grade)}
                    className="mt-0.5 text-[#c28551] focus:ring-[#c28551]"
                  />
                  <div>
                    <div className="font-bold text-xs">{g.label}</div>
                    <p className="text-[11px] opacity-80 mt-0.5 leading-snug">{g.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Battery Health % & Service Cost in LKR */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Battery Health Capacity %
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={batteryHealthPercent}
                  onChange={(e) => setBatteryHealthPercent(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 96"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#c28551]/30"
                />
                <span className="absolute right-3 top-2 text-slate-400 font-bold text-xs">%</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Maintenance Cost (LKR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-[10px]">Rs.</span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={costLKR}
                  onChange={(e) => setCostLKR(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#c28551]/30"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {formatLKR(Number(costLKR) || 0)}
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Inspection Date
              </label>
              <input
                type="date"
                required
                value={completedDate}
                onChange={(e) => setCompletedDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#c28551]/30"
              />
            </div>
          </div>

          {/* Diagnostic Findings */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Diagnostic Findings & Wear Analysis
            </label>
            <textarea
              rows={2}
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              placeholder="e.g. Minor thermal paste drying noted on CPU die, replaced with Arctic MX-6."
              className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#c28551]/30 leading-relaxed"
            />
          </div>

          {/* Action Taken */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Maintenance Actions Performed
            </label>
            <textarea
              rows={2}
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              placeholder="e.g. Air compressor dust extraction, SSD trim command, alcohol sanitization."
              className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#c28551]/30 leading-relaxed"
            />
          </div>

          {/* Automated Next 6-Month Routine Cycle Alert */}
          {record.type === 'BIANNUAL_ROUTINE' && (
            <div className="p-4 rounded-2xl bg-[#fbf5ef] border border-[#f0e6de] text-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CalendarCheck className="w-5 h-5 text-[#c28551] shrink-0" />
                <div>
                  <div className="font-bold text-slate-900 text-xs">Automated 6-Month Biannual Cycle</div>
                  <div className="text-[11px] text-slate-500">
                    Next routine inspection will automatically be booked for{' '}
                    <span className="font-bold text-[#c28551] font-mono">{formatDate(nextSixMonthDate)}</span>.
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-[#c28551] border border-[#ead7c7]">
                +6 Months Auto
              </span>
            </div>
          )}

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
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition cursor-pointer btn-press disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Signing off Inspection...' : 'Sign Off & Certify Inspection'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
