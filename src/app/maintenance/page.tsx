'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { AppShell, useApp } from '@/components/AppShell';
import {
  CalendarCheck,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  BatteryCharging,
  Flame,
  Cpu,
  Monitor,
  Sparkles,
  Plus,
  RotateCcw,
  User,
  Filter
} from 'lucide-react';
import { MaintenanceRecord, MaintenanceType, MaintenanceStatus } from '@/types/asset';
import { formatDate, formatLKR } from '@/lib/utils';
import { ScheduleMaintenanceModal } from '@/components/ScheduleMaintenanceModal';
import { CompleteInspectionModal } from '@/components/CompleteInspectionModal';

function MaintenanceContent() {
  const { assets, refreshData, showToast, openDetail } = useApp();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'due' | 'routine' | 'spot' | 'completed'>('all');

  // Modals state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleDefaultType, setScheduleDefaultType] = useState<MaintenanceType>('BIANNUAL_ROUTINE');
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/maintenance');
      const data = await res.json();
      if (data.success && data.data) {
        setRecords(data.data);
      }
    } catch (err) {
      console.error('Failed to load maintenance records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduled = (newRecord: MaintenanceRecord) => {
    showToast(`Scheduled ${newRecord.type === 'BIANNUAL_ROUTINE' ? 'Biannual routine' : 'Spot check'} for ${newRecord.assetName}!`);
    fetchRecords();
    refreshData();
  };

  const handleCompleted = (updated: MaintenanceRecord, nextRoutine?: MaintenanceRecord) => {
    if (nextRoutine) {
      showToast(`Certified ${updated.assetName}! Next 6-month checkup scheduled for ${formatDate(nextRoutine.scheduledDate)}.`);
    } else {
      showToast(`Inspection signed off for ${updated.assetName}!`);
    }
    fetchRecords();
    refreshData();
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  const dueAndOverdueCount = records.filter(
    (r) => r.status === 'OVERDUE' || (r.status === 'SCHEDULED' && r.scheduledDate <= todayStr)
  ).length;

  const routineCount = records.filter((r) => r.type === 'BIANNUAL_ROUTINE').length;
  const spotCount = records.filter((r) => r.type === 'RANDOM_SPOT_CHECK').length;
  const completedCount = records.filter((r) => r.status === 'COMPLETED').length;

  const filteredRecords = records.filter((r) => {
    if (activeTab === 'due') {
      return r.status === 'OVERDUE' || (r.status === 'SCHEDULED' && r.scheduledDate <= todayStr);
    }
    if (activeTab === 'routine') return r.type === 'BIANNUAL_ROUTINE';
    if (activeTab === 'spot') return r.type === 'RANDOM_SPOT_CHECK';
    if (activeTab === 'completed') return r.status === 'COMPLETED';
    return true;
  });

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-[#fbf5ef] border border-[#f0e6de] luxury-card-shadow flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#faece2] text-[#c28551] border border-[#ead7c7]">
              Preventive Protocol
            </span>
            <span className="text-xs text-slate-500 font-mono">
              • Biannual (Every 6 Months) + Random Spot Audits
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Equipment Maintenance & Health Inspections
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
            Automate semi-annual hardware overhauls (cooling thermals, battery cycles, S.M.A.R.T. health, sanitization) every 6 months across all showrooms and staff, backed by random unannounced spot audits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-3.5 py-2 rounded-2xl bg-white border border-[#c28551]/30 shadow-xs text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Due / Overdue</span>
            <span className={`text-base font-extrabold ${dueAndOverdueCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              {dueAndOverdueCount} Checkups
            </span>
          </div>

          <button
            onClick={() => {
              setScheduleDefaultType('BIANNUAL_ROUTINE');
              setIsScheduleOpen(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#c28551] to-[#dfae85] hover:from-[#b07440] hover:to-[#cb8e5c] text-white text-xs font-bold shadow-md shadow-[#c28551]/20 flex items-center gap-2 transition cursor-pointer btn-press"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Schedule Routine (6-Mo)</span>
          </button>

          <button
            onClick={() => {
              setScheduleDefaultType('RANDOM_SPOT_CHECK');
              setIsScheduleOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-2xl bg-white border border-amber-300 hover:bg-amber-50 text-amber-900 text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer btn-press-sm"
          >
            <Zap className="w-4 h-4 text-amber-600" />
            <span>Spot Audit Sweep</span>
          </button>
        </div>
      </div>

      {/* Cadence Visual Pill Strip */}
      <div className="p-4 rounded-2xl bg-white border border-[#f0e6de] shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#faece2] text-[#c28551] flex items-center justify-center font-bold">
            2×
          </div>
          <div>
            <div className="font-bold text-slate-800">Semi-Annual Maintenance Mandate</div>
            <div className="text-[11px] text-slate-500">Every piece of company hardware undergoes full diagnostic overhaul twice each year.</div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
            ✓ 6-Point Safety Checklist
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 font-semibold">
            ⚡ Surprise Spot Checks
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 font-semibold">
            🔄 Auto 6-Mo Recurrence
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/90 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer btn-press-sm ${
            activeTab === 'all'
              ? 'bg-[#fbf5ef] text-[#a66c3b] border border-[#c28551]/40 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          All Inspections ({records.length})
        </button>

        <button
          onClick={() => setActiveTab('due')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 btn-press-sm ${
            activeTab === 'due'
              ? 'bg-rose-50 text-rose-900 border border-rose-300 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-rose-600" />
          <span>Due & Overdue ({dueAndOverdueCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('routine')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 btn-press-sm ${
            activeTab === 'routine'
              ? 'bg-[#faece2] text-[#844c1d] border border-[#c28551] shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <CalendarCheck className="w-3.5 h-3.5 text-[#c28551]" />
          <span>Biannual Routine ({routineCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('spot')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 btn-press-sm ${
            activeTab === 'spot'
              ? 'bg-amber-50 text-amber-900 border border-amber-300 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-600" />
          <span>Random Spot Checks ({spotCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 btn-press-sm ${
            activeTab === 'completed'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Certified Log ({completedCount})</span>
        </button>
      </div>

      {/* Records Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredRecords.map((rec) => {
          const isRoutine = rec.type === 'BIANNUAL_ROUTINE';
          const isOverdue = rec.status === 'OVERDUE';
          const isCompleted = rec.status === 'COMPLETED';

          const checklistCount = Object.values(rec.checklist).filter(Boolean).length;

          return (
            <div
              key={rec.id}
              className={`p-6 rounded-3xl bg-white border ${
                isOverdue
                  ? 'border-rose-300 shadow-rose-100/50 shadow-md'
                  : isCompleted
                  ? 'border-slate-200'
                  : 'border-[#f0e6de] luxury-card-shadow'
              } space-y-4 flex flex-col justify-between`}
            >
              <div>
                {/* Top Row: Asset Tag & Badges */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#c28551] bg-[#fbf5ef] px-2.5 py-0.5 rounded-md border border-[#c28551]/20">
                        {rec.assetTag}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isRoutine
                            ? 'bg-[#faece2] text-[#844c1d] border-[#ead7c7]'
                            : 'bg-amber-50 text-amber-900 border-amber-200'
                        }`}
                      >
                        {isRoutine ? <CalendarCheck className="w-3 h-3 text-[#c28551]" /> : <Zap className="w-3 h-3 text-amber-600" />}
                        <span>{isRoutine ? 'Biannual (6-Mo)' : 'Random Spot Check'}</span>
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mt-1.5 line-clamp-1">
                      {rec.assetName}
                    </h3>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : isOverdue
                        ? 'bg-rose-50 text-rose-800 border-rose-300 animate-pulse'
                        : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isCompleted ? 'bg-emerald-500' : isOverdue ? 'bg-rose-500' : 'bg-indigo-500'
                      }`}
                    />
                    <span>{isCompleted ? 'Certified & Passed' : isOverdue ? 'Overdue Checkup' : 'Scheduled'}</span>
                  </span>
                </div>

                {/* Health Classification Grade if Completed */}
                {isCompleted && rec.healthGrade && (
                  <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between text-xs my-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="font-bold text-emerald-950">
                          {rec.healthGrade === 'EXCELLENT' ? 'Grade A - Mint' : rec.healthGrade}
                        </span>
                        <div className="text-[10px] text-emerald-700">6 of 6 Safety Benchmarks Verified</div>
                      </div>
                    </div>
                    {rec.batteryHealthPercent && (
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase text-emerald-700 block">Battery Health</span>
                        <span className="text-xs font-mono font-bold text-emerald-900">{rec.batteryHealthPercent}%</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Checklist Preview */}
                <div className="py-2.5 px-3 rounded-2xl bg-[#fdfbf9] border border-[#f0e6de] text-xs space-y-2 my-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                    <span>6-Point Diagnostic Protocol:</span>
                    <span className="font-mono text-[#c28551] font-bold">{checklistCount}/6 Checked</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                    <span className={`p-1 rounded text-center truncate ${rec.checklist.thermalAndCooling ? 'bg-emerald-100 text-emerald-800 font-semibold' : 'bg-slate-100 text-slate-400'}`}>
                      Thermals
                    </span>
                    <span className={`p-1 rounded text-center truncate ${rec.checklist.batteryHealth ? 'bg-emerald-100 text-emerald-800 font-semibold' : 'bg-slate-100 text-slate-400'}`}>
                      Battery
                    </span>
                    <span className={`p-1 rounded text-center truncate ${rec.checklist.portsAndConnectivity ? 'bg-emerald-100 text-emerald-800 font-semibold' : 'bg-slate-100 text-slate-400'}`}>
                      Ports
                    </span>
                    <span className={`p-1 rounded text-center truncate ${rec.checklist.displayAndChassis ? 'bg-emerald-100 text-emerald-800 font-semibold' : 'bg-slate-100 text-slate-400'}`}>
                      Chassis
                    </span>
                    <span className={`p-1 rounded text-center truncate ${rec.checklist.softwareAndSecurity ? 'bg-emerald-100 text-emerald-800 font-semibold' : 'bg-slate-100 text-slate-400'}`}>
                      S.M.A.R.T.
                    </span>
                    <span className={`p-1 rounded text-center truncate ${rec.checklist.sanitization ? 'bg-emerald-100 text-emerald-800 font-semibold' : 'bg-slate-100 text-slate-400'}`}>
                      Sanitized
                    </span>
                  </div>
                </div>

                {/* Notes or Findings */}
                <div className="text-xs text-slate-600 space-y-1">
                  {rec.findings ? (
                    <p className="line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px]">
                      <span className="font-semibold text-slate-700">Findings: </span>
                      {rec.findings}
                    </p>
                  ) : rec.notes ? (
                    <p className="line-clamp-2 text-slate-500 text-[11px] italic">
                      <span className="font-semibold text-slate-600 not-italic">Notes: </span>
                      {rec.notes}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Card Footer: Metadata & Actions */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate max-w-[150px]">{rec.inspector.split(' ')[0]}</span>
                  </div>

                  <div>
                    {isCompleted ? (
                      <span className="font-semibold text-slate-700">Certified {formatDate(rec.completedDate || rec.scheduledDate)}</span>
                    ) : (
                      <span>Due: <span className="font-bold text-slate-800 font-mono">{formatDate(rec.scheduledDate)}</span></span>
                    )}
                  </div>
                </div>

                {/* Next Routine Indicator */}
                {isRoutine && rec.nextScheduledDate && (
                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Recurrence: Every 6 Months</span>
                    <span>Next Due: <span className="font-mono font-bold text-[#c28551]">{formatDate(rec.nextScheduledDate)}</span></span>
                  </div>
                )}

                {/* Action Button */}
                <div className="pt-1 flex items-center justify-end">
                  <button
                    onClick={() => {
                      setSelectedRecord(rec);
                      setIsCompleteOpen(true);
                    }}
                    className={`w-full py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer btn-press-sm ${
                      isCompleted
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : 'bg-[#1d2939] hover:bg-[#c28551] text-white shadow-xs'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#dfae85]" />
                    <span>{isCompleted ? 'View Inspection Certificate' : 'Perform Checkup & Sign Off'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <ScheduleMaintenanceModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onSuccess={handleScheduled}
        assets={assets}
        defaultType={scheduleDefaultType}
      />

      <CompleteInspectionModal
        isOpen={isCompleteOpen}
        onClose={() => {
          setIsCompleteOpen(false);
          setSelectedRecord(null);
        }}
        onSuccess={handleCompleted}
        record={selectedRecord}
      />

    </div>
  );
}

export default function MaintenancePage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading maintenance schedule...</div>}>
        <MaintenanceContent />
      </Suspense>
    </AppShell>
  );
}
