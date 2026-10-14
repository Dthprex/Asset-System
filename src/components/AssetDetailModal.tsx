'use client';

import React, { useEffect, useState } from 'react';
import { 
  X, 
  Tag, 
  Calendar, 
  MapPin, 
  Building2, 
  Smartphone, 
  ShieldCheck, 
  Wrench, 
  User, 
  Clock, 
  History, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  QrCode as QrIcon, 
  FileText,
  Printer
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Asset, CustodyRecord } from '@/types/asset';
import { formatLKR, formatDate, formatDateTime, getWarrantyInfo, calculateDuration } from '@/lib/utils';

interface AssetDetailModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  onAssign: (asset: Asset) => void;
  onReturn: (asset: Asset) => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  isOpen,
  onClose,
  onAssign,
  onReturn,
}) => {
  const [history, setHistory] = useState<CustodyRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'specs' | 'qr'>('timeline');

  useEffect(() => {
    if (asset && isOpen) {
      fetchHistory(asset.id);
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

  if (!isOpen || !asset) return null;

  const warranty = getWarrantyInfo(asset.warrantyEndDate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Bar */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">{asset.name}</h2>
                <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-slate-800 text-pink-300 border border-slate-700">
                  {asset.assetTag}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {asset.brand} {asset.modelNumber ? `• ${asset.modelNumber}` : ''} • Serial No: <span className="font-mono text-slate-300">{asset.serialNumber}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 bg-slate-950/40 border-b border-slate-800 flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'timeline'
                ? 'border-pink-500 text-pink-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Custody History & Audit Trail ({history.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('specs')}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'specs'
                ? 'border-pink-500 text-pink-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Hardware & Purchase Details</span>
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`py-3.5 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'qr'
                ? 'border-pink-500 text-pink-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrIcon className="w-4 h-4" />
            <span>Asset Barcode / QR Label</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          
          {/* TAB 1: CUSTODY TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              
              {/* Current Status Box */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-400 font-medium">Current Assignment Status</div>
                  <div className="text-base font-bold text-white mt-0.5 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping"></span>
                    <span>
                      {asset.currentAssignment 
                        ? `${asset.currentAssignment.assignedToName} (${asset.currentAssignment.locationOrBranch})`
                        : 'Available in Central IT Lab Inventory'}
                    </span>
                  </div>
                  {asset.currentAssignment && (
                    <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>Assigned: {formatDate(asset.currentAssignment.assignedDate)}</span>
                      <span>•</span>
                      <span>Duration: {calculateDuration(asset.currentAssignment.assignedDate)}</span>
                      {asset.currentAssignment.expectedReturnDate && (
                        <>
                          <span>•</span>
                          <span className="text-amber-400 font-semibold">
                            Due Back: {formatDate(asset.currentAssignment.expectedReturnDate)}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {asset.currentAssignment ? (
                    <button
                      onClick={() => {
                        onClose();
                        onReturn(asset);
                      }}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold transition"
                    >
                      Process Return & Damage Check
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onClose();
                        onAssign(asset);
                      }}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold shadow-lg shadow-pink-500/20 transition"
                    >
                      Assign or Loan Item
                    </button>
                  )}
                </div>
              </div>

              {/* Chronological Audit Trail */}
              <div>
                <h4 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                  <History className="w-4 h-4 text-pink-400" />
                  <span>Item Handover & Custody Log (Chronological Audit Trail)</span>
                </h4>

                {loadingHistory ? (
                  <div className="py-8 text-center text-slate-400 text-sm">Loading audit trail...</div>
                ) : history.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-sm">No custody records found.</div>
                ) : (
                  <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:left-2.5 before:w-0.5 before:bg-slate-800">
                    {history.map((record, idx) => {
                      const isDamage = record.action === 'DAMAGE_REPORTED' || (record.damages && record.damages.length > 0);
                      const isReturn = record.action === 'RETURNED';
                      const isAssign = record.action === 'ASSIGNED' || record.action === 'TRANSFERRED';

                      return (
                        <div key={record.id || idx} className="relative group">
                          
                          {/* Dot indicator */}
                          <div className={`absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 border-slate-900 ${
                            isDamage 
                              ? 'bg-rose-500 shadow-md shadow-rose-500/50' 
                              : isReturn 
                              ? 'bg-blue-500 shadow-md shadow-blue-500/50'
                              : isAssign
                              ? 'bg-pink-500 shadow-md shadow-pink-500/50'
                              : 'bg-emerald-500 shadow-md shadow-emerald-500/50'
                          }`}></div>

                          {/* Record Card */}
                          <div className={`p-4 rounded-2xl border transition ${
                            isDamage 
                              ? 'bg-rose-950/20 border-rose-500/40 text-rose-100' 
                              : 'bg-slate-950/70 border-slate-800 text-slate-200 hover:border-slate-700'
                          }`}>
                            
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  isDamage
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                    : isReturn
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                    : 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                                }`}>
                                  {record.action.replace('_', ' ')}
                                </span>
                                <span className="text-xs font-semibold text-white">
                                  {record.previousHolder} &rarr; {record.newHolder}
                                </span>
                              </div>

                              <span className="text-xs font-mono text-slate-400">
                                {formatDate(record.date)}
                              </span>
                            </div>

                            {/* Duration Held Info */}
                            {record.duration && (
                              <div className="text-xs text-indigo-300 mb-2 font-mono flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Custody Period: {record.duration}</span>
                              </div>
                            )}

                            {/* Damage Details Banner if any */}
                            {record.damages && (
                              <div className="p-3 mb-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 space-y-1">
                                <div className="font-bold flex items-center gap-1.5 text-rose-400">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>Damages Reported Upon Return:</span>
                                </div>
                                <p>{record.damages}</p>
                              </div>
                            )}

                            {/* Notes and Inspector */}
                            <div className="text-xs text-slate-400 space-y-1">
                              {record.conditionUponReturn && (
                                <div>Condition logged: <span className="text-slate-200 font-medium">{record.conditionUponReturn}</span></div>
                              )}
                              {record.notes && <p className="italic">"{record.notes}"</p>}
                              <div className="text-[11px] text-slate-500">Authorized By: {record.performedBy || 'IT Admin'}</div>
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
            <div className="space-y-6">
              
              {/* Image Preview & Gallery */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 h-52">
                  <img
                    src={asset.images[0]}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="md:col-span-2 p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <h4 className="text-sm font-bold text-white">Purchase & Vendor Record</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400">Purchased Amount:</span>
                      <div className="text-lg font-bold text-pink-400 mt-0.5">{formatLKR(asset.purchaseAmount)}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Purchase Date:</span>
                      <div className="font-semibold text-white mt-0.5">{formatDate(asset.purchaseDate)}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Purchase Location / Vendor:</span>
                      <div className="font-semibold text-white mt-0.5">{asset.purchaseLocation}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Warranty Expiration:</span>
                      <div className="mt-0.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${warranty.badgeClass}`}>
                          {warranty.statusText} ({formatDate(asset.warrantyEndDate)})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hardware Specifications */}
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                <h4 className="text-sm font-bold text-white">Technical Identifiers</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400">Category:</span>
                    <div className="font-semibold text-white mt-0.5">{asset.category}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Brand:</span>
                    <div className="font-semibold text-white mt-0.5">{asset.brand}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Model Number:</span>
                    <div className="font-semibold text-white mt-0.5">{asset.modelNumber || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Serial Number:</span>
                    <div className="font-mono font-semibold text-pink-300 mt-0.5">{asset.serialNumber}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Initial Condition:</span>
                    <div className="font-semibold text-white mt-0.5">{asset.condition}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Sim Slot Support:</span>
                    <div className="font-semibold text-white mt-0.5">{asset.hasSim ? 'Yes (Cellular Enabled)' : 'No (Wi-Fi / Standalone)'}</div>
                  </div>
                </div>

                {/* Cellular Details */}
                {asset.hasSim && (
                  <div className="pt-3 border-t border-slate-800/80">
                    <span className="text-xs font-bold text-slate-300 mb-2 block">Dual IMEI Numbers:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 text-[10px] block">IMEI SLOT 1</span>
                        <span className="text-slate-200">{asset.imei1 || 'Not registered'}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 text-[10px] block">IMEI SLOT 2</span>
                        <span className="text-slate-200">{asset.imei2 || 'Not registered'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: ASSET QR & PRINTABLE LABEL */}
          {activeTab === 'qr' && (
            <div className="p-8 flex flex-col items-center justify-center text-center space-y-6 bg-slate-950/60 rounded-2xl border border-slate-800">
              <div className="p-5 bg-white rounded-2xl shadow-xl">
                <QRCodeSVG
                  value={`https://inventory.cosmetics.lk/assets/${asset.assetTag}`}
                  size={180}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="space-y-1">
                <div className="text-lg font-bold font-mono text-white tracking-wider">
                  {asset.assetTag}
                </div>
                <p className="text-xs text-slate-400">
                  {asset.name} • {asset.serialNumber}
                </p>
                <p className="text-[11px] text-pink-400">
                  cosmetics.lk IT Asset Tracking System
                </p>
              </div>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 transition"
              >
                <Printer className="w-4 h-4 text-pink-400" />
                <span>Print Hardware Label</span>
              </button>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
