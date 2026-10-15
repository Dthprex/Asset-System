'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Smartphone, 
  ShieldCheck, 
  Clock, 
  History, 
  AlertTriangle, 
  QrCode as QrIcon, 
  FileText,
  Printer,
  Copy,
  Check,
  RotateCcw,
  ArrowRightLeft,
  FileCheck2,
  Wrench,
  CalendarCheck,
  Zap,
  BatteryCharging
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Asset, CustodyRecord, MaintenanceRecord } from '@/types/asset';
import { formatLKR, formatDate, getWarrantyInfo, calculateDuration } from '@/lib/utils';

interface AssetDetailDrawerProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  onAssign: (asset: Asset) => void;
  onReturn: (asset: Asset) => void;
  onOpenVoucher?: (asset: Asset) => void;
  onDispatchRepair?: (asset: Asset) => void;
}

export const AssetDetailDrawer: React.FC<AssetDetailDrawerProps> = ({
  asset,
  isOpen,
  onClose,
  onAssign,
  onReturn,
  onOpenVoucher,
  onDispatchRepair,
}) => {
  const [history, setHistory] = useState<CustodyRecord[]>([]);
  const [maintenanceList, setMaintenanceList] = useState<MaintenanceRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'specs' | 'qr' | 'maintenance'>('timeline');
  const [copiedTag, setCopiedTag] = useState(false);

  useEffect(() => {
    if (asset && isOpen) {
      fetchHistory(asset.id);
      fetchMaintenance(asset.id);
    }
  }, [asset, isOpen]);

  const fetchHistory = async (assetId: string) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/assets/${assetId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setHistory(data.data.history || []);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchMaintenance = async (assetId: string) => {
    try {
      const res = await fetch(`/api/maintenance?assetId=${assetId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setMaintenanceList(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load maintenance records:', err);
    }
  };

  if (!isOpen || !asset) return null;

  const warranty = getWarrantyInfo(asset.warrantyEndDate);
  const isBorrowed = asset.status === 'BORROWED_TEMPORARY';
  const isRepair = asset.status === 'UNDER_REPAIR';
  const isPermanent = asset.status === 'ALLOCATED_PERMANENT';

  const handleCopyTag = () => {
    navigator.clipboard.writeText(asset.assetTag);
    setCopiedTag(true);
    setTimeout(() => setCopiedTag(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col border-l border-[#f0e6de] animate-drawer-spring">
          
          {/* Drawer Header */}
          <div className="p-6 bg-[#fbf5ef]/90 backdrop-blur-md border-b border-[#f0e6de] flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white border border-[#f0e6de] shadow-xs shrink-0">
                <img
                  src={asset.images[0] || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80'}
                  alt={asset.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#faece2] text-[#c28551] border border-[#ead7c7] shadow-2xs">
                    {asset.category}
                  </span>
                  <button
                    onClick={handleCopyTag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-[#ead7c7] text-[#1d2939] text-[11px] font-mono hover:bg-[#fbf5ef] transition cursor-pointer btn-press-sm"
                    title="Click to copy asset tag"
                  >
                    <span>{asset.assetTag}</span>
                    {copiedTag ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                  </button>
                </div>

                <h2 className="text-base font-bold text-[#1d2939] mt-1 line-clamp-1">
                  {asset.name}
                </h2>
                <p className="text-xs text-slate-500">
                  {asset.brand} {asset.modelNumber ? `• ${asset.modelNumber}` : ''} • SN: <span className="font-mono text-[#1d2939]">{asset.serialNumber}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-[#faece2]/50 transition cursor-pointer btn-press-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="px-6 bg-white border-b border-[#f0e6de] flex items-center gap-6 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-3.5 border-b-2 flex items-center gap-2 transition cursor-pointer btn-press-sm ${
                activeTab === 'timeline'
                  ? 'border-[#c28551] text-[#c28551] font-bold'
                  : 'border-transparent text-slate-500 hover:text-[#1d2939]'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Custody Audit Trail ({history.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('specs')}
              className={`py-3.5 border-b-2 flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'specs'
                  ? 'border-[#c28551] text-[#c28551]'
                  : 'border-transparent text-slate-500 hover:text-[#1d2939]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Hardware & Procurement</span>
            </button>

            <button
              onClick={() => setActiveTab('qr')}
              className={`py-3.5 border-b-2 flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'qr'
                  ? 'border-[#c28551] text-[#c28551]'
                  : 'border-transparent text-slate-500 hover:text-[#1d2939]'
              }`}
            >
              <QrIcon className="w-4 h-4" />
              <span>QR Hardware Label</span>
            </button>

            <button
              onClick={() => setActiveTab('maintenance')}
              className={`py-3.5 border-b-2 flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'maintenance'
                  ? 'border-[#c28551] text-[#c28551] font-bold'
                  : 'border-transparent text-slate-500 hover:text-[#1d2939]'
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Health & 6-Mo Checks ({maintenanceList.length})</span>
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
            
            {/* TAB 1: AUDIT TRAIL */}
            {activeTab === 'timeline' && (
              <div className="space-y-6">
                
                {/* Current Custody Banner */}
                <div className={`p-4 rounded-2xl border ${
                  isBorrowed
                    ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                    : isRepair
                    ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                    : isPermanent
                    ? 'bg-[#fbf5ef] border-[#ead7c7] text-[#1d2939]'
                    : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span>Current Holder</span>
                    {asset.currentAssignment && (
                      <span className="font-mono text-[11px] opacity-80">
                        {calculateDuration(asset.currentAssignment.assignedDate)}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm font-bold">
                    {asset.currentAssignment 
                      ? asset.currentAssignment.assignedToName
                      : 'Central IT Lab (Available for deployment)'}
                  </div>
                  
                  {asset.currentAssignment && (
                    <div className="text-xs opacity-90 mt-1">
                      <span>{asset.currentAssignment.locationOrBranch} • {asset.currentAssignment.department}</span>
                      {asset.currentAssignment.expectedReturnDate && (
                        <div className="font-semibold text-amber-700 mt-0.5">
                          Scheduled Due Date: {formatDate(asset.currentAssignment.expectedReturnDate)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Audit Trail List */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                    <History className="w-4 h-4 text-[#c28551]" />
                    <span>Chronological Custody Timeline</span>
                  </h4>

                  {loadingHistory ? (
                    <div className="py-8 text-center text-slate-400 text-xs">Loading audit records...</div>
                  ) : history.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">No handover history available.</div>
                  ) : (
                    <div className="relative pl-5 space-y-5 before:absolute before:inset-0 before:left-2 before:w-0.5 before:bg-[#f0e6de]">
                      {history.map((record) => {
                        const isDamage = record.action === 'DAMAGE_REPORTED' || (record.damages && record.damages.length > 0);
                        const isReturn = record.action === 'RETURNED';
                        const isAssign = record.action === 'ASSIGNED' || record.action === 'TRANSFERRED';

                        return (
                          <div key={record.id} className="relative group">
                            <div className={`absolute -left-5 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                              isDamage ? 'bg-rose-500 ring-2 ring-rose-200' : isReturn ? 'bg-blue-500' : isAssign ? 'bg-[#c28551]' : 'bg-emerald-500'
                            }`} />

                            <div className={`p-4 rounded-2xl border text-xs ${
                              isDamage 
                                ? 'bg-rose-50/70 border-rose-200 text-rose-900' 
                                : 'bg-[#fdfbf9] border-[#f0e6de] text-slate-700'
                            }`}>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  isDamage ? 'bg-rose-100 text-rose-800' : isReturn ? 'bg-blue-100 text-blue-800' : 'bg-[#faece2] text-[#c28551]'
                                }`}>
                                  {record.action.replace('_', ' ')}
                                </span>
                                <span className="font-mono text-slate-500 text-[11px]">{formatDate(record.date)}</span>
                              </div>

                              <div className="font-semibold text-[#1d2939] mb-1">
                                {record.previousHolder} &rarr; {record.newHolder}
                              </div>

                              {record.duration && (
                                <div className="text-slate-600 font-mono text-[11px] mb-1.5 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Held for: {record.duration}</span>
                                </div>
                              )}

                              {record.damages && (
                                <div className="p-2.5 my-2 rounded-xl bg-rose-100/80 border border-rose-200 text-rose-900 font-medium">
                                  <div className="flex items-center gap-1 font-bold text-[11px] mb-0.5">
                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Damages Reported at Return:</span>
                                  </div>
                                  <p>{record.damages}</p>
                                </div>
                              )}

                              {record.notes && (
                                <p className="italic text-slate-500 mt-1">"{record.notes}"</p>
                              )}
                              <div className="text-[10px] text-slate-400 mt-1">
                                Inspector: {record.performedBy || 'IT Admin'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB 2: SPECS & PROCUREMENT */}
            {activeTab === 'specs' && (
              <div className="space-y-6 text-xs">
                
                {/* Financial Summary */}
                <div className="p-4 rounded-2xl bg-[#fbf5ef] border border-[#ead7c7] space-y-3">
                  <h4 className="font-bold text-[#1d2939] text-xs">Procurement Record (LKR)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Purchase Price:</span>
                      <span className="font-bold text-[#c28551] text-base">{formatLKR(asset.purchaseAmount)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Purchase Date:</span>
                      <span className="font-semibold text-slate-800">{formatDate(asset.purchaseDate)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Vendor / Store:</span>
                      <span className="font-semibold text-slate-800">{asset.purchaseLocation}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Warranty Status:</span>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${warranty.badgeClass}`}>
                        {warranty.statusText}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hardware Properties */}
                <div className="p-4 rounded-2xl bg-[#fdfbf9] border border-[#f0e6de] space-y-3">
                  <h4 className="font-bold text-[#1d2939] text-xs">Technical Identifiers</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Brand:</span>
                      <span className="font-semibold text-slate-800">{asset.brand}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Model:</span>
                      <span className="font-semibold text-slate-800">{asset.modelNumber || 'Standard'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Serial Number:</span>
                      <span className="font-mono font-semibold text-[#1d2939]">{asset.serialNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Condition at Intake:</span>
                      <span className="font-semibold text-slate-800">{asset.condition}</span>
                    </div>
                  </div>

                  {/* Cellular Dual SIM info */}
                  {asset.hasSim && (
                    <div className="pt-3 border-t border-[#f0e6de]">
                      <div className="flex items-center gap-1.5 font-bold text-[#1d2939] mb-2">
                        <Smartphone className="w-3.5 h-3.5 text-[#c28551]" />
                        <span>Cellular Tracking (Dual SIM IMEIs)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                        <div className="p-2.5 rounded-xl bg-white border border-[#f0e6de]">
                          <span className="text-[10px] text-slate-400 block">SLOT 1 IMEI</span>
                          <span className="text-[#1d2939]">{asset.imei1 || 'Not specified'}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-[#f0e6de]">
                          <span className="text-[10px] text-slate-400 block">SLOT 2 IMEI</span>
                          <span className="text-[#1d2939]">{asset.imei2 || 'Not specified'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB 3: QR LABEL */}
            {activeTab === 'qr' && (
              <div className="p-6 text-center space-y-6 bg-[#fdfbf9] rounded-2xl border border-[#f0e6de] flex flex-col items-center justify-center">
                <div className="p-5 bg-white rounded-2xl shadow-sm border border-[#f0e6de]">
                  <QRCodeSVG
                    value={`https://inventory.cosmetics.lk/assets/${asset.assetTag}`}
                    size={180}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-base font-bold font-mono text-[#1d2939]">{asset.assetTag}</div>
                  <p className="text-xs text-slate-500">{asset.name} • {asset.serialNumber}</p>
                  <p className="text-[11px] font-semibold text-[#c28551]">cosmetics.lk IT Infrastructure</p>
                </div>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-[#1d2939] hover:bg-[#c28551] text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[#dfae85]" />
                  <span>Print Physical QR Sticker</span>
                </button>
              </div>
            )}

            {/* TAB 4: MAINTENANCE & HEALTH */}
            {activeTab === 'maintenance' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#fbf5ef] border border-[#f0e6de] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-xs">Biannual 6-Month Protocol</div>
                    <p className="text-[11px] text-slate-500">Semi-annual preventative overhaul & impromptu spot checks</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-[#c28551] border border-[#ead7c7]">
                    2× Yearly
                  </span>
                </div>

                {maintenanceList.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 text-xs space-y-2">
                    <CalendarCheck className="w-8 h-8 mx-auto text-slate-300" />
                    <div>No maintenance logs recorded yet for this asset.</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {maintenanceList.map((m) => {
                      const isRoutine = m.type === 'BIANNUAL_ROUTINE';
                      const isCompleted = m.status === 'COMPLETED';

                      return (
                        <div
                          key={m.id}
                          className="p-4 rounded-2xl bg-[#fdfbf9] border border-[#f0e6de] space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              {isRoutine ? (
                                <CalendarCheck className="w-3.5 h-3.5 text-[#c28551]" />
                              ) : (
                                <Zap className="w-3.5 h-3.5 text-amber-600" />
                              )}
                              <span>{isRoutine ? 'Biannual Routine' : 'Spot Check'}</span>
                            </span>

                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isCompleted
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : m.status === 'OVERDUE'
                                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                  : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                              }`}
                            >
                              {m.status}
                            </span>
                          </div>

                          {m.findings && (
                            <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100">
                              {m.findings}
                            </p>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                            <span>Inspector: {m.inspector.split(' ')[0]}</span>
                            <span>Date: <span className="font-mono text-slate-600 font-semibold">{formatDate(m.completedDate || m.scheduledDate)}</span></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 bg-[#fdfbf9]/90 backdrop-blur-md border-t border-[#f0e6de] flex items-center justify-between gap-3">
            <div>
              {onDispatchRepair && (
                <button
                  onClick={() => {
                    onClose();
                    onDispatchRepair(asset);
                  }}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer btn-press-sm ${
                    isRepair
                      ? 'border-[#c28551]/30 bg-[#fbf5ef] hover:bg-[#faece2] text-[#c28551]'
                      : 'border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700'
                  }`}
                  title="Dispatch to authorized service center"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>{isRepair ? 'Service Info / RMA' : 'Vendor Repair'}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-white text-xs font-semibold transition cursor-pointer btn-press-sm"
              >
                Close
              </button>

              {asset.currentAssignment ? (
                <div className="flex items-center gap-2">
                  {onOpenVoucher && (
                    <button
                      onClick={() => onOpenVoucher(asset)}
                      className="px-3.5 py-2 rounded-xl border border-[#c28551]/30 hover:bg-[#fbf5ef] text-[#c28551] text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer btn-press-sm"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Handover Voucher</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onClose();
                      onReturn(asset);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#c28551] hover:bg-[#a66c3b] text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer btn-press"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Return & Inspect Damage</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    onAssign(asset);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#c28551] to-[#dfae85] hover:from-[#b07440] hover:to-[#cb8e5c] text-white text-xs font-semibold shadow-md shadow-[#c28551]/20 transition flex items-center gap-1.5 cursor-pointer btn-press"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Deploy / Loan Item</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
