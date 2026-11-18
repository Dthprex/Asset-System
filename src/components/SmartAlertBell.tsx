'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  Clock,
  ShieldAlert,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  RotateCcw,
  Phone,
  Building2,
  X,
  CalendarClock,
} from 'lucide-react';
import { Asset } from '@/types/asset';
import { formatDate, getWarrantyInfo } from '@/lib/utils';

export type AlertCategory = 'ALL' | 'LOAN' | 'REPAIR' | 'WARRANTY' | 'MAINTENANCE';
export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface FleetAlertItem {
  id: string;
  asset: Asset;
  category: Exclude<AlertCategory, 'ALL'>;
  severity: AlertSeverity;
  title: string;
  subtitle: string;
  meta?: string;
  custodianName?: string;
  custodianContact?: string;
  branchName?: string;
  daysMetric?: number;
}

interface SmartAlertBellProps {
  assets: Asset[];
  onSelectAsset?: (asset: Asset) => void;
  onOpenReturn?: (asset: Asset) => void;
}

export const SmartAlertBell: React.FC<SmartAlertBellProps> = ({
  assets,
  onSelectAsset,
  onOpenReturn,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AlertCategory>('ALL');
  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Compute all live fleet alerts from assets
  const alerts = useMemo<FleetAlertItem[]>(() => {
    const list: FleetAlertItem[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const asset of assets) {
      if (asset.status === 'RETIRED') continue;

      const ca = asset.currentAssignment;

      // 1. Temporary Loans (Overdue / Due Soon / Active)
      if (asset.status === 'BORROWED_TEMPORARY' && ca) {
        if (ca.expectedReturnDate) {
          const due = new Date(ca.expectedReturnDate);
          due.setHours(0, 0, 0, 0);
          const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            list.push({
              id: `loan-overdue-${asset.id}`,
              asset,
              category: 'LOAN',
              severity: 'CRITICAL',
              title: `Overdue Loan (${Math.abs(diffDays)}d late): ${asset.name}`,
              subtitle: `Borrowed by ${ca.assignedToName} (${ca.assignedToRole || 'Staff'})`,
              meta: `Due Date: ${formatDate(ca.expectedReturnDate)}`,
              custodianName: ca.assignedToName,
              custodianContact: ca.assignedToContact,
              branchName: ca.locationOrBranch,
              daysMetric: diffDays,
            });
          } else if (diffDays <= 5) {
            list.push({
              id: `loan-due-soon-${asset.id}`,
              asset,
              category: 'LOAN',
              severity: 'WARNING',
              title:
                diffDays === 0
                  ? `Loan Return Due Today: ${asset.name}`
                  : `Loan Return in ${diffDays}d: ${asset.name}`,
              subtitle: `Custodian: ${ca.assignedToName} • ${ca.department || 'General'}`,
              meta: `Expected Return: ${formatDate(ca.expectedReturnDate)}`,
              custodianName: ca.assignedToName,
              custodianContact: ca.assignedToContact,
              branchName: ca.locationOrBranch,
              daysMetric: diffDays,
            });
          } else {
            list.push({
              id: `loan-active-${asset.id}`,
              asset,
              category: 'LOAN',
              severity: 'INFO',
              title: `Active Temporary Loan: ${asset.name}`,
              subtitle: `Custodian: ${ca.assignedToName} (${diffDays}d remaining)`,
              meta: `Expected Return: ${formatDate(ca.expectedReturnDate)}`,
              custodianName: ca.assignedToName,
              custodianContact: ca.assignedToContact,
              branchName: ca.locationOrBranch,
              daysMetric: diffDays,
            });
          }
        } else {
          // No expected return date set on temporary loan
          const start = new Date(ca.assignedDate);
          start.setHours(0, 0, 0, 0);
          const borrowedDays = Math.max(
            0,
            Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
          );
          list.push({
            id: `loan-open-${asset.id}`,
            asset,
            category: 'LOAN',
            severity: borrowedDays > 14 ? 'CRITICAL' : 'WARNING',
            title:
              borrowedDays > 14
                ? `Long Temporary Loan (${borrowedDays}d elapsed): ${asset.name}`
                : `Temporary Loan (No Return Date): ${asset.name}`,
            subtitle: `Custodian: ${ca.assignedToName} • Since ${formatDate(ca.assignedDate)}`,
            meta: 'No expected return date specified',
            custodianName: ca.assignedToName,
            custodianContact: ca.assignedToContact,
            branchName: ca.locationOrBranch,
          });
        }
      }

      // 2. Active Vendor Repairs / RMA
      if (asset.status === 'UNDER_REPAIR') {
        const updatedDate = new Date(asset.updatedAt || asset.createdAt);
        updatedDate.setHours(0, 0, 0, 0);
        const daysInRepair = Math.max(
          0,
          Math.floor((today.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24))
        );
        list.push({
          id: `repair-status-${asset.id}`,
          asset,
          category: 'REPAIR',
          severity: daysInRepair > 10 ? 'CRITICAL' : 'WARNING',
          title:
            daysInRepair > 10
              ? `Prolonged Vendor Repair (${daysInRepair}d): ${asset.name}`
              : `Under Vendor Repair: ${asset.name}`,
          subtitle: `Tag: ${asset.assetTag} • Vendor: ${asset.purchaseLocation}`,
          meta: `In Repair Lab (${daysInRepair}d elapsed)`,
          daysMetric: daysInRepair,
        });
      }

      // 3. Warranty Expiring Soon (<= 45 days) or Recently Expired (within last 90 days)
      if (
        asset.warrantyEndDate &&
        asset.warrantyEndDate !== '1970-01-01' &&
        asset.warrantyEndDate !== 'UNKNOWN'
      ) {
        const wInfo = getWarrantyInfo(asset.warrantyEndDate, today);
        if (!wInfo.isExpired && wInfo.daysLeft <= 45) {
          list.push({
            id: `warranty-expiring-${asset.id}`,
            asset,
            category: 'WARRANTY',
            severity: wInfo.daysLeft <= 14 ? 'CRITICAL' : 'WARNING',
            title: `Warranty Expiring in ${wInfo.daysLeft}d: ${asset.name}`,
            subtitle: `Vendor: ${asset.purchaseLocation} • Ends ${formatDate(asset.warrantyEndDate)}`,
            meta: ca ? `Held by ${ca.assignedToName} (${ca.locationOrBranch})` : 'In Central IT Lab',
            custodianName: ca?.assignedToName,
            custodianContact: ca?.assignedToContact,
            branchName: ca?.locationOrBranch,
            daysMetric: wInfo.daysLeft,
          });
        } else if (wInfo.isExpired && Math.abs(wInfo.daysLeft) <= 90) {
          list.push({
            id: `warranty-expired-${asset.id}`,
            asset,
            category: 'WARRANTY',
            severity: 'INFO',
            title: `Warranty Expired (${Math.abs(wInfo.daysLeft)}d ago): ${asset.name}`,
            subtitle: `Vendor: ${asset.purchaseLocation} • Ended ${formatDate(asset.warrantyEndDate)}`,
            meta: ca ? `Held by ${ca.assignedToName}` : 'In Central IT Lab',
            custodianName: ca?.assignedToName,
            branchName: ca?.locationOrBranch,
          });
        }
      }

      // 4. Hardware Condition Alerts (Damaged / Needs Repair or Used - Fair)
      const effectiveCondition = String(ca?.conditionAtHandover || asset.condition || '');
      if (
        effectiveCondition === 'Damaged / Needs Repair' ||
        effectiveCondition.toLowerCase().includes('damaged') ||
        effectiveCondition === 'Used - Fair'
      ) {
        const isDamaged =
          effectiveCondition === 'Damaged / Needs Repair' ||
          effectiveCondition.toLowerCase().includes('damaged');
        list.push({
          id: `condition-${asset.id}`,
          asset,
          category: 'MAINTENANCE',
          severity: isDamaged ? 'CRITICAL' : 'WARNING',
          title: `${effectiveCondition}: ${asset.name}`,
          subtitle: ca
            ? `Currently with ${ca.assignedToName} (${ca.locationOrBranch})`
            : 'In Central IT Lab Staging',
          meta: `Tag: ${asset.assetTag} • ${
            isDamaged ? 'Immediate IT inspection advised' : 'Monitor hardware wear & service'
          }`,
          custodianName: ca?.assignedToName,
          custodianContact: ca?.assignedToContact,
          branchName: ca?.locationOrBranch,
        });
      }
    }

    // Sort: CRITICAL first, then WARNING, then INFO
    const severityRank: Record<AlertSeverity, number> = {
      CRITICAL: 0,
      WARNING: 1,
      INFO: 2,
    };

    return list.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
  }, [assets]);

  const unacknowledgedCount = useMemo(() => {
    return alerts.filter((a) => !acknowledgedIds.includes(a.id)).length;
  }, [alerts, acknowledgedIds]);

  const criticalCount = useMemo(() => {
    return alerts.filter((a) => a.severity === 'CRITICAL').length;
  }, [alerts]);

  const categoryCounts = useMemo(() => {
    return {
      ALL: alerts.length,
      LOAN: alerts.filter((a) => a.category === 'LOAN').length,
      REPAIR: alerts.filter((a) => a.category === 'REPAIR').length,
      WARRANTY: alerts.filter((a) => a.category === 'WARRANTY').length,
      MAINTENANCE: alerts.filter((a) => a.category === 'MAINTENANCE').length,
    };
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    if (activeTab === 'ALL') return alerts;
    return alerts.filter((a) => a.category === activeTab);
  }, [alerts, activeTab]);

  const handleMarkAllReviewed = () => {
    setAcknowledgedIds(alerts.map((a) => a.id));
  };

  const getSeverityStyles = (severity: AlertSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          badge: 'bg-rose-100 text-rose-800 border-rose-200',
          border: 'border-l-4 border-l-rose-500 bg-rose-50/30 hover:bg-rose-50/70',
          label: 'Urgent',
        };
      case 'WARNING':
        return {
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          border: 'border-l-4 border-l-amber-500 bg-amber-50/20 hover:bg-amber-50/60',
          label: 'Attention',
        };
      case 'INFO':
        return {
          badge: 'bg-blue-50 text-blue-700 border-blue-200',
          border: 'border-l-4 border-l-blue-400 bg-white hover:bg-slate-50',
          label: 'Notice',
        };
    }
  };

  const getCategoryIcon = (category: Exclude<AlertCategory, 'ALL'>, severity: AlertSeverity) => {
    const colorClass =
      severity === 'CRITICAL'
        ? 'text-rose-600 bg-rose-100'
        : severity === 'WARNING'
        ? 'text-amber-600 bg-amber-100'
        : 'text-blue-600 bg-blue-100';

    switch (category) {
      case 'LOAN':
        return (
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
            <Clock className="w-4 h-4" />
          </div>
        );
      case 'REPAIR':
        return (
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
            <Wrench className="w-4 h-4" />
          </div>
        );
      case 'WARRANTY':
        return (
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
            <ShieldAlert className="w-4 h-4" />
          </div>
        );
      case 'MAINTENANCE':
        return (
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
            <AlertTriangle className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        title="Smart Fleet Alerts (Overdue Loans, Warranties, Active Repairs & Condition)"
        className={`relative p-2.5 rounded-xl border transition cursor-pointer btn-press-sm ${
          isOpen
            ? 'border-[#c28551] bg-[#fbf5ef] text-[#c28551]'
            : criticalCount > 0 && unacknowledgedCount > 0
            ? 'border-rose-200 bg-rose-50/70 text-rose-700 hover:bg-rose-100/80'
            : 'border-[#f0e6de] text-slate-600 hover:text-[#c28551] hover:bg-[#fbf5ef]'
        }`}
      >
        <Bell className="w-4 h-4" />

        {/* Notification Count Badge */}
        {alerts.length > 0 && (
          <span
            className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-extrabold flex items-center justify-center shadow-xs ${
              unacknowledgedCount === 0
                ? 'bg-slate-400 text-white'
                : criticalCount > 0
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-[#c28551] text-white'
            }`}
          >
            {unacknowledgedCount > 0 ? unacknowledgedCount : alerts.length}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-[380px] sm:w-[440px] max-h-[82vh] bg-white rounded-2xl border border-[#e6d6c6] shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-[#1d2939] to-[#2c3d55] text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#c28551]/25 border border-[#c28551]/40 flex items-center justify-center text-[#eab382]">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-extrabold tracking-wide uppercase">
                    Smart Fleet Watchtower
                  </h3>
                  {criticalCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/90 text-white text-[9px] font-extrabold uppercase">
                      {criticalCount} Urgent
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-300 mt-0.5">
                  Live Loans, Warranties, Vendor Repairs &amp; Condition Alerts
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {unacknowledgedCount > 0 && (
                <button
                  onClick={handleMarkAllReviewed}
                  className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-semibold text-slate-200 transition cursor-pointer"
                  title="Clear unread badge pulse"
                >
                  Mark Reviewed
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="px-3 py-2 bg-[#faf7f3] border-b border-[#f0e6de] flex items-center gap-1 overflow-x-auto">
            {(
              [
                { id: 'ALL', label: 'All' },
                { id: 'LOAN', label: 'Loans' },
                { id: 'REPAIR', label: 'Repairs' },
                { id: 'WARRANTY', label: 'Warranty' },
                { id: 'MAINTENANCE', label: 'Condition' },
              ] as { id: AlertCategory; label: string }[]
            ).map((tab) => {
              const count = categoryCounts[tab.id];
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                    active
                      ? 'bg-[#1d2939] text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-[#f0e6de]/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${
                      active ? 'bg-[#c28551] text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Alert Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[420px]">
            {filteredAlerts.length === 0 ? (
              <div className="py-12 px-6 text-center">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-[#1d2939]">All Clear in This Category!</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  No overdue loans, critical warranty expirations, or repair bottlenecks detected.
                </p>
              </div>
            ) : (
              filteredAlerts.map((item) => {
                const styles = getSeverityStyles(item.severity);
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 transition flex items-start gap-3 ${styles.border}`}
                  >
                    {getCategoryIcon(item.category, item.severity)}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] font-extrabold text-[#c28551] bg-[#faece2] px-1.5 py-0.5 rounded border border-[#ead7c7]">
                          {item.asset.assetTag}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border ${styles.badge}`}
                        >
                          {styles.label}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-[#1d2939] mt-1 leading-snug">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-600 mt-0.5">{item.subtitle}</p>

                      {item.meta && (
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                          <CalendarClock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{item.meta}</span>
                        </p>
                      )}

                      {/* Custodian Contact & Branch Quick Info */}
                      {(item.custodianContact || item.branchName) && (
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] text-slate-500">
                          {item.custodianContact && (
                            <span className="inline-flex items-center gap-1 font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                              <Phone className="w-2.5 h-2.5 text-[#c28551]" />
                              {item.custodianContact}
                            </span>
                          )}
                          {item.branchName && (
                            <span className="inline-flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                              <Building2 className="w-2.5 h-2.5 text-slate-400" />
                              {item.branchName}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Quick Action Buttons */}
                      <div className="flex items-center gap-2 mt-2.5">
                        {onSelectAsset && (
                          <button
                            onClick={() => {
                              setIsOpen(false);
                              onSelectAsset(item.asset);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#1d2939] hover:bg-slate-800 text-white text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                          >
                            <span>Inspect Hardware</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}

                        {item.category === 'LOAN' && onOpenReturn && (
                          <button
                            onClick={() => {
                              setIsOpen(false);
                              onOpenReturn(item.asset);
                            }}
                            className="px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Check-In Return</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Quick Links */}
          <div className="px-4 py-2.5 bg-[#faf7f3] border-t border-[#f0e6de] flex items-center justify-between text-[11px]">
            <Link
              href="/loans"
              onClick={() => setIsOpen(false)}
              className="font-bold text-[#c28551] hover:underline flex items-center gap-1"
            >
              <span>Temporary Loans</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
            <Link
              href="/repairs"
              onClick={() => setIsOpen(false)}
              className="font-bold text-slate-600 hover:text-[#1d2939] hover:underline flex items-center gap-1"
            >
              <span>Vendor Repairs &amp; Warranty</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
