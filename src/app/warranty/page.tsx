'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { AppShell, useApp } from '@/components/AppShell';
import {
  ShieldCheck,
  ShieldAlert,
  Wrench,
  AlertTriangle,
  History,
  MapPin,
  Clock,
  Plus,
  Building2,
  Calendar,
  RotateCcw,
  CheckCircle2,
  Phone
} from 'lucide-react';
import { formatLKR, formatDate, getWarrantyInfo } from '@/lib/utils';
import { RepairTicket, RepairTicketStatus, Asset } from '@/types/asset';
import { NewRepairTicketModal } from '@/components/NewRepairTicketModal';
import { UpdateRepairTicketModal } from '@/components/UpdateRepairTicketModal';

function getStatusBadge(status: RepairTicketStatus) {
  switch (status) {
    case 'DISPATCHED_TO_VENDOR':
      return {
        label: 'Dispatched to Vendor',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        dotClass: 'bg-indigo-500',
      };
    case 'UNDER_DIAGNOSTICS':
      return {
        label: 'Under Diagnostics',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        dotClass: 'bg-amber-500',
      };
    case 'AWAITING_PARTS':
      return {
        label: 'Awaiting Spare Parts',
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
        dotClass: 'bg-rose-500',
      };
    case 'REPAIR_COMPLETED':
      return {
        label: 'Repair Completed',
        badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
        dotClass: 'bg-teal-500',
      };
    case 'RETURNED_TO_FLEET':
      return {
        label: 'Returned to Fleet',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dotClass: 'bg-emerald-500',
      };
    default:
      return {
        label: status,
        badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
        dotClass: 'bg-slate-400',
      };
  }
}

function WarrantyContent() {
  const { assets, openDetail, refreshData, showToast } = useApp();
  const [filterTab, setFilterTab] = useState<'all' | 'rma' | 'expiring' | 'repair' | 'expired'>('all');
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  // RMA tickets state
  const [repairTickets, setRepairTickets] = useState<RepairTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<RepairTicket | null>(null);
  const [isUpdateTicketOpen, setIsUpdateTicketOpen] = useState(false);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setCurrentDate(today);
    fetchRepairs();
  }, []);

  const fetchRepairs = async () => {
    setLoadingTickets(true);
    try {
      const res = await fetch('/api/repairs');
      const data = await res.json();
      if (data.success && data.data) {
        setRepairTickets(data.data);
      }
    } catch (err) {
      console.error('Failed to load repair tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleTicketCreated = (newTicket: RepairTicket) => {
    showToast(`RMA #${newTicket.rmaNumber} dispatched for ${newTicket.assetName}!`);
    fetchRepairs();
    refreshData();
  };

  const handleTicketUpdated = (updated: RepairTicket) => {
    showToast(`Updated RMA #${updated.rmaNumber} - Status: ${updated.status}`);
    fetchRepairs();
    refreshData();
  };

  const in30Days = currentDate ? new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000) : null;

  const categorized = assets.map((a) => {
    const wInfo = getWarrantyInfo(a.warrantyEndDate, currentDate || undefined);
    const isRepair = a.status === 'UNDER_REPAIR' || a.condition.toLowerCase().includes('damage');
    const wDate = a.warrantyEndDate ? new Date(a.warrantyEndDate) : null;
    const isExpiringSoon = currentDate && in30Days && wDate ? (wDate >= currentDate && wDate <= in30Days) : false;
    const isExpired = currentDate && wDate ? (wDate < currentDate) : false;

    return {
      ...a,
      warrantyInfo: wInfo,
      isRepair,
      isExpiringSoon,
      isExpired,
    };
  });

  const displayedAssets = categorized.filter((a) => {
    if (filterTab === 'expiring') return a.isExpiringSoon;
    if (filterTab === 'repair') return a.isRepair;
    if (filterTab === 'expired') return a.isExpired;
    return true;
  });

  const expiringCount = categorized.filter((a) => a.isExpiringSoon).length;
  const repairCount = categorized.filter((a) => a.isRepair).length;
  const expiredCount = categorized.filter((a) => a.isExpired).length;
  const activeRmaCount = repairTickets.filter((t) => t.status !== 'RETURNED_TO_FLEET').length;

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-[#fbf5ef] border border-[#f0e6de] luxury-card-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#f4e6d8] text-[#844c1d] border border-[#c28551]/30">
              Maintenance & Coverage
            </span>
            <span className="text-xs text-slate-400 font-mono">• Supplier SLA & RMA Tracking</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Warranty Alerts & RMA Service Desk
          </h1>
          <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
            Monitor supplier warranties (Future World, CameraLK, Singer Mega, Softlogic) and track service center job sheets, repair costs in LKR, and fleet re-integration.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="px-4 py-2.5 rounded-2xl bg-white border border-[#c28551]/30 shadow-xs text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Active RMA</span>
            <span className="text-base font-extrabold text-[#c28551]">{activeRmaCount} Open</span>
          </div>

          <button
            onClick={() => setIsNewTicketOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#c28551] to-[#dfae85] hover:from-[#b07440] hover:to-[#cb8e5c] text-white text-xs font-bold shadow-md shadow-[#c28551]/20 flex items-center gap-2 transition cursor-pointer btn-press"
          >
            <Plus className="w-4 h-4" />
            <span>Dispatch to Vendor</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/90 pb-2 overflow-x-auto">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer btn-press-sm ${
            filterTab === 'all'
              ? 'bg-[#fbf5ef] text-[#a66c3b] border border-[#c28551]/40 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          All Fleet Warranties ({assets.length})
        </button>

        <button
          onClick={() => setFilterTab('rma')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 btn-press-sm ${
            filterTab === 'rma'
              ? 'bg-[#faece2] text-[#844c1d] border border-[#c28551] shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Wrench className="w-3.5 h-3.5 text-[#c28551]" />
          <span>Vendor RMA Desk ({repairTickets.length})</span>
        </button>

        <button
          onClick={() => setFilterTab('expiring')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 btn-press-sm ${
            filterTab === 'expiring'
              ? 'bg-amber-50 text-amber-900 border border-amber-300 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>Expiring in 30 Days ({expiringCount})</span>
        </button>

        <button
          onClick={() => setFilterTab('repair')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 btn-press-sm ${
            filterTab === 'repair'
              ? 'bg-rose-50 text-rose-900 border border-rose-300 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          <span>Under Repair & Damaged ({repairCount})</span>
        </button>

        <button
          onClick={() => setFilterTab('expired')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer btn-press-sm ${
            filterTab === 'expired'
              ? 'bg-slate-100 text-slate-800 border border-slate-300 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Expired Coverage ({expiredCount})
        </button>
      </div>

      {/* VIEW: RMA Service Desk */}
      {filterTab === 'rma' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Showing all official vendor RMA job sheets and service dispatches</span>
            <span className="font-mono">{repairTickets.length} Total Records</span>
          </div>

          {repairTickets.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Wrench className="w-10 h-10 mx-auto text-slate-300" />
              <h3 className="text-base font-bold text-slate-700">No RMA Service Tickets Logged</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No equipment is currently dispatched to external service centers. Click "Dispatch to Vendor" to create an authorized RMA ticket.
              </p>
              <button
                onClick={() => setIsNewTicketOpen(true)}
                className="mt-2 px-4 py-2 rounded-xl bg-[#c28551] text-white text-xs font-bold shadow-xs hover:bg-[#a66c3b] transition"
              >
                Create First Repair Ticket
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {repairTickets.map((ticket) => {
                const badge = getStatusBadge(ticket.status);
                const isCompleted = ticket.status === 'RETURNED_TO_FLEET';

                return (
                  <div
                    key={ticket.id}
                    className={`p-6 rounded-3xl bg-white border ${
                      isCompleted ? 'border-slate-200 opacity-90' : 'border-[#f0e6de] luxury-card-shadow'
                    } space-y-5 flex flex-col justify-between`}
                  >
                    <div>
                      {/* Top Bar */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#c28551] bg-[#fbf5ef] px-2.5 py-0.5 rounded-md border border-[#c28551]/20">
                              {ticket.assetTag}
                            </span>
                            <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              RMA: {ticket.rmaNumber}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 mt-1.5">{ticket.assetName}</h3>
                        </div>

                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${badge.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                          <span>{badge.label}</span>
                        </span>
                      </div>

                      {/* Vendor Box */}
                      <div className="p-3.5 rounded-2xl bg-[#fdfbf9] border border-[#f0e6de] text-xs space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Building2 className="w-3.5 h-3.5 text-[#c28551]" />
                          <span>{ticket.vendorName}</span>
                        </div>
                        {ticket.serviceCenterLocation && (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="line-clamp-1">{ticket.serviceCenterLocation}</span>
                          </div>
                        )}
                        {ticket.vendorContact && (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{ticket.vendorContact}</span>
                          </div>
                        )}
                      </div>

                      {/* Issue Description */}
                      <div className="mt-3 text-xs space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Reported Issue & Diagnostics
                        </span>
                        <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                          {ticket.issueDescription}
                        </p>
                      </div>

                      {/* Internal Notes if any */}
                      {ticket.notes && (
                        <div className="mt-2 text-[11px] text-slate-500 italic">
                          <span className="font-semibold text-slate-600 not-italic">IT Notes:</span> {ticket.notes}
                        </div>
                      )}
                    </div>

                    {/* Metadata & Actions Footer */}
                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Repair Cost</span>
                          <div className="font-bold text-[#c28551] font-mono mt-0.5">
                            {ticket.actualCostLKR && ticket.actualCostLKR > 0
                              ? formatLKR(ticket.actualCostLKR)
                              : `${formatLKR(ticket.estimatedCostLKR)} (Est)`}
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {ticket.isCoveredByWarranty ? '• Under Supplier Warranty' : '• Billable / Out of Warranty'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Timeline</span>
                          <div className="text-[11px] text-slate-700 mt-0.5">
                            Dispatched: <span className="font-mono font-semibold">{formatDate(ticket.dispatchedDate)}</span>
                          </div>
                          {ticket.expectedReturnDate && (
                            <div className="text-[11px] text-slate-500">
                              Expected: <span className="font-mono">{formatDate(ticket.expectedReturnDate)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[10px] text-slate-400">
                          Dispatched by {ticket.dispatchedBy}
                        </span>

                        <button
                          onClick={() => {
                            setActiveTicket(ticket);
                            setIsUpdateTicketOpen(true);
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer btn-press-sm ${
                            isCompleted
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              : 'bg-[#1d2939] hover:bg-[#c28551] text-white shadow-xs'
                          }`}
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-[#dfae85]" />
                          <span>{isCompleted ? 'View / Edit History' : 'Update Status & Cost'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW: Assets Grid (Warranty Coverage Tabs) */}
      {filterTab !== 'rma' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedAssets.map((asset) => (
            <div
              key={asset.id}
              onClick={() => openDetail(asset)}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 luxury-card-shadow luxury-card-hover btn-press cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] font-bold text-[#c28551] bg-[#fbf5ef] px-2 py-0.5 rounded border border-[#c28551]/20">
                    {asset.assetTag}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${asset.warrantyInfo.badgeClass}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${asset.warrantyInfo.dotClass}`} />
                    <span>{asset.warrantyInfo.statusText}</span>
                  </span>
                </div>

                <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{asset.name}</h3>
                <p className="text-[11px] text-slate-500 font-mono">SN: {asset.serialNumber}</p>
              </div>

              {/* Repair / Damage notice if applicable */}
              {asset.isRepair && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
                  <div className="font-bold flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Service Ticket / Repair Status:</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-rose-800 line-clamp-2">
                    {asset.currentAssignment?.purpose || 'Sent to service center for inspection.'}
                  </p>
                </div>
              )}

              {/* Vendor & Price */}
              <div className="pt-2 border-t border-slate-100 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Vendor:</span>
                  <span className="font-semibold text-slate-800">{asset.purchaseLocation}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Warranty Expiration:</span>
                  <span className="font-semibold text-slate-800 font-mono">{formatDate(asset.warrantyEndDate)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Fleet Value:</span>
                  <span className="font-bold text-[#c28551] font-mono">{formatLKR(asset.purchaseAmount)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-[#c28551] font-semibold">
                <span>View Hardware Audit Dossier</span>
                <History className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <NewRepairTicketModal
        isOpen={isNewTicketOpen}
        onClose={() => setIsNewTicketOpen(false)}
        onSuccess={handleTicketCreated}
        assets={assets}
      />

      <UpdateRepairTicketModal
        isOpen={isUpdateTicketOpen}
        onClose={() => {
          setIsUpdateTicketOpen(false);
          setActiveTicket(null);
        }}
        onSuccess={handleTicketUpdated}
        ticket={activeTicket}
      />

    </div>
  );
}

export default function WarrantyPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading warranty desk...</div>}>
        <WarrantyContent />
      </Suspense>
    </AppShell>
  );
}
