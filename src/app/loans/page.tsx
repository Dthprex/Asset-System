'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { AppShell, useApp } from '@/components/AppShell';
import { 
  ClockAlert, 
  RotateCcw, 
  User, 
  Phone, 
  Calendar, 
  Tag, 
  History, 
  AlertTriangle, 
  CheckCircle2,
  FileCheck2
} from 'lucide-react';
import { formatDate, calculateDuration } from '@/lib/utils';

function LoansContent() {
  const { assets, openDetail, openReturn, openHandoverVoucher } = useApp();
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setCurrentDate(today);
  }, []);

  const activeLoans = assets.filter(
    (a) => a.status === 'BORROWED_TEMPORARY' || a.currentAssignment?.assignmentType === 'TEMPORARY_BORROW'
  );

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-[#fbf5ef] border border-[#f0e6de] luxury-card-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
              Active Custody Loans
            </span>
            <span className="text-xs text-slate-400 font-mono">• Temporary Dispatch</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Equipment Loan & Borrowing Desk
          </h1>
          <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
            Monitor temporary borrowings for video shoots, digital marketing campaigns, and branch store pop-ups. Return inspections check for physical or liquid damages.
          </p>
        </div>

        <div className="px-4 py-2 rounded-2xl bg-white border border-[#c28551]/30 shadow-xs text-xs font-semibold text-[#844c1d] shrink-0">
          <span className="font-extrabold text-[#c28551] text-sm mr-1">{activeLoans.length}</span> Active {activeLoans.length === 1 ? 'Loan' : 'Loans'}
        </div>
      </div>

      {/* Active Loans List */}
      {activeLoans.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200/90 luxury-card-shadow p-6">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">All loaned items returned!</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            There are currently no outstanding temporary loans. All fleet equipment is either deployed or ready in the IT Lab.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {activeLoans.map((asset) => {
            const assignment = asset.currentAssignment!;
            const dueDate = assignment.expectedReturnDate ? new Date(assignment.expectedReturnDate) : null;
            const isOverdue = dueDate && currentDate && dueDate < currentDate;

            return (
              <div
                key={asset.id}
                className="bg-white rounded-2xl border border-slate-200/90 luxury-card-shadow luxury-card-hover p-5 flex flex-col justify-between space-y-4"
              >
                {/* Device Info */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 shrink-0">
                    <img src={asset.images[0]} alt={asset.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-[#c28551] bg-[#fbf5ef] px-2 py-0.5 rounded border border-[#c28551]/20">
                        {asset.assetTag}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{asset.category}</span>
                    </div>
                    <h3 
                      onClick={() => openDetail(asset)}
                      className="text-xs font-bold text-slate-900 truncate mt-1 hover:text-[#c28551] transition cursor-pointer"
                    >
                      {asset.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">SN: {asset.serialNumber}</p>
                  </div>
                </div>

                {/* Custody & Due Details */}
                <div className="p-3.5 rounded-xl bg-[#fdfbf9] border border-[#f0e6de] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Borrower:</span>
                    <span className="font-bold text-slate-900">{assignment.assignedToName}</span>
                  </div>

                  {assignment.assignedToRole && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Designation:</span>
                      <span className="text-slate-700">{assignment.assignedToRole}</span>
                    </div>
                  )}

                  {assignment.assignedToContact && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Contact:</span>
                      <span className="text-slate-700 font-mono">{assignment.assignedToContact}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#f0e6de] flex items-center justify-between">
                    <span className="text-slate-500">Scheduled Due Date:</span>
                    <span className={`font-bold font-mono px-2 py-0.5 rounded text-[11px] ${
                      isOverdue ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {assignment.expectedReturnDate ? formatDate(assignment.expectedReturnDate) : 'Not Specified'}
                    </span>
                  </div>

                  {assignment.purpose && (
                    <div className="pt-1 text-[11px] text-slate-500 italic">
                      "{assignment.purpose}"
                    </div>
                  )}
                </div>

                {/* Action Footer */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => openHandoverVoucher(asset)}
                    title="Print Official Custody Voucher Slip"
                    className="py-2.5 px-3 rounded-xl border border-[#c28551]/30 hover:bg-[#fbf5ef] text-[#c28551] text-xs font-semibold flex items-center justify-center gap-1.5 transition btn-press-sm cursor-pointer"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>Voucher Slip</span>
                  </button>

                  <button
                    onClick={() => openDetail(asset)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200/90 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition btn-press-sm cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5 text-[#c28551]" />
                    <span>View Dossier</span>
                  </button>

                  <button
                    onClick={() => openReturn(asset)}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#c28551] to-[#dfae85] hover:from-[#b07440] hover:to-[#cb8e5c] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition btn-press-sm cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Check-in Return</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

export default function LoansPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading loan desk...</div>}>
        <LoansContent />
      </Suspense>
    </AppShell>
  );
}
