'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Search,
  Eye,
  Download,
  Printer,
  ExternalLink,
  DollarSign,
  Building2,
  Calendar,
  Wrench,
  Camera,
  RotateCcw,
  Sparkles,
  Receipt
} from 'lucide-react';
import { Asset, CustodyRecord, RepairTicket } from '@/types/asset';
import { formatLKR, formatDate } from '@/lib/utils';

interface AllInvoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
}

interface InvoiceItem {
  id: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  type: 'PURCHASE_INVOICE' | 'REPAIR_BILL' | 'RETURN_PHOTO';
  title: string;
  vendorOrHolder: string;
  date: string;
  amountLKR?: number;
  url: string;
  notes?: string;
}

export const AllInvoicesModal: React.FC<AllInvoicesModalProps> = ({
  isOpen,
  onClose,
  assets,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'purchase' | 'repair' | 'returns'>('all');
  const [search, setSearch] = useState('');
  const [repairs, setRepairs] = useState<RepairTicket[]>([]);
  const [historyRecords, setHistoryRecords] = useState<CustodyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<InvoiceItem | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchRepairsAndHistory();
    }
  }, [isOpen]);

  const fetchRepairsAndHistory = async () => {
    setLoading(true);
    try {
      const [repairsRes, statsRes] = await Promise.all([
        fetch('/api/repairs'),
        fetch('/api/stats'),
      ]);
      const [repairsData, statsData] = await Promise.all([
        repairsRes.json(),
        statsRes.json(),
      ]);

      if (repairsData.success) {
        setRepairs(repairsData.data || []);
      }
      if (statsData.success && statsData.data?.recentHistory) {
        setHistoryRecords(statsData.data.recentHistory || []);
      }
    } catch (err) {
      console.error('Failed to load invoice records:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Build aggregated invoice & bill items
  const invoiceItems: InvoiceItem[] = [];

  // 1. Purchase Invoices from Assets
  assets.forEach((a) => {
    if (a.invoiceDoc) {
      invoiceItems.push({
        id: `INV-PURCHASE-${a.id}`,
        assetId: a.id,
        assetTag: a.assetTag,
        assetName: a.name,
        type: 'PURCHASE_INVOICE',
        title: `Procurement Tax Invoice - ${a.name}`,
        vendorOrHolder: a.purchaseLocation,
        date: a.purchaseDate,
        amountLKR: a.purchaseAmount,
        url: a.invoiceDoc,
        notes: `Initial fleet purchase invoice from ${a.purchaseLocation}.`,
      });
    }
  });

  // 2. Repair Invoices & Job Sheet Bills
  repairs.forEach((r) => {
    if (r.invoiceDoc) {
      invoiceItems.push({
        id: `INV-REPAIR-${r.id}`,
        assetId: r.assetId,
        assetTag: r.assetTag,
        assetName: r.assetName,
        type: 'REPAIR_BILL',
        title: `RMA #${r.rmaNumber} Service Bill - ${r.vendorName}`,
        vendorOrHolder: r.vendorName,
        date: r.completedDate || r.dispatchedDate,
        amountLKR: r.actualCostLKR || r.estimatedCostLKR,
        url: r.invoiceDoc,
        notes: `Authorized service center job bill. Issue: ${r.issueDescription}`,
      });
    }
  });

  // 3. Return Condition Inspection Photos
  historyRecords.forEach((h) => {
    if (h.returnPhotos && h.returnPhotos.length > 0) {
      const targetAsset = assets.find((a) => a.id === h.assetId);
      h.returnPhotos.forEach((photoUrl, pIdx) => {
        invoiceItems.push({
          id: `PHOTO-RETURN-${h.id}-${pIdx}`,
          assetId: h.assetId,
          assetTag: targetAsset?.assetTag || 'CLK-IT',
          assetName: targetAsset?.name || 'Fleet Hardware',
          type: 'RETURN_PHOTO',
          title: `Return Condition Proof #${pIdx + 1} (${h.action})`,
          vendorOrHolder: h.previousHolder || 'Returning Custodian',
          date: h.date,
          url: photoUrl,
          notes: h.damages ? `Damages logged: ${h.damages}` : 'Condition verified clean and sanitized.',
        });
      });
    }
  });

  // Filter items
  const filtered = invoiceItems.filter((item) => {
    if (activeTab === 'purchase' && item.type !== 'PURCHASE_INVOICE') return false;
    if (activeTab === 'repair' && item.type !== 'REPAIR_BILL') return false;
    if (activeTab === 'returns' && item.type !== 'RETURN_PHOTO') return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.assetTag.toLowerCase().includes(q) ||
        item.assetName.toLowerCase().includes(q) ||
        item.vendorOrHolder.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPurchaseValueLKR = invoiceItems
    .filter((i) => i.type === 'PURCHASE_INVOICE')
    .reduce((sum, i) => sum + (i.amountLKR || 0), 0);

  const totalRepairSpentLKR = invoiceItems
    .filter((i) => i.type === 'REPAIR_BILL')
    .reduce((sum, i) => sum + (i.amountLKR || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl bg-white border border-[#f0e6de] rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-[#fbf5ef] border-b border-[#f0e6de] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#c28551] text-white flex items-center justify-center shadow-md shadow-[#c28551]/20">
              <Receipt className="w-6 h-6 text-[#faece2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#faece2] text-[#c28551] border border-[#ead7c7]">
                  Document Vault
                </span>
                <span className="text-xs text-slate-400 font-mono">• Financial &amp; Physical Evidence</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                Fleet Invoices, Bills &amp; Return Photos Vault
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right hidden md:block">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Verified Invoices</span>
              <span className="text-xs font-mono font-bold text-[#c28551]">{invoiceItems.length} Documents</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white/80 transition cursor-pointer btn-press-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-white border-b border-[#f0e6de] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer btn-press-sm ${
                activeTab === 'all'
                  ? 'bg-[#faece2] text-[#844c1d] border border-[#c28551]'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              All Documents ({invoiceItems.length})
            </button>
            <button
              onClick={() => setActiveTab('purchase')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer btn-press-sm ${
                activeTab === 'purchase'
                  ? 'bg-[#faece2] text-[#844c1d] border border-[#c28551]'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Purchase Invoices
            </button>
            <button
              onClick={() => setActiveTab('repair')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer btn-press-sm ${
                activeTab === 'repair'
                  ? 'bg-[#faece2] text-[#844c1d] border border-[#c28551]'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Vendor Repair Bills
            </button>
            <button
              onClick={() => setActiveTab('returns')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer btn-press-sm ${
                activeTab === 'returns'
                  ? 'bg-[#faece2] text-[#844c1d] border border-[#c28551]'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Return Photos
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tag, vendor, or invoice #..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-[#fdfbf9] text-xs focus:outline-none focus:ring-2 focus:ring-[#c28551]/30 focus:bg-white"
            />
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="p-6 overflow-y-auto flex-1 text-xs space-y-4">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <FileText className="w-10 h-10 mx-auto text-slate-300" />
              <div className="font-bold text-slate-700">No invoices or receipts matched</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Upload procurement invoices during asset intake, attach service bills during RMA updates, or add return photos during returns.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((item) => {
                const isPdf = item.url.toLowerCase().endsWith('.pdf');
                const isPurchase = item.type === 'PURCHASE_INVOICE';
                const isRepair = item.type === 'REPAIR_BILL';

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-[#f0e6de] bg-white overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Document Preview Box */}
                      <div className="h-44 bg-[#fbf5ef] border-b border-[#f0e6de] relative overflow-hidden group">
                        {isPdf ? (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 space-y-1">
                            <FileText className="w-12 h-12 text-rose-500" />
                            <span className="font-bold font-mono text-xs uppercase tracking-wider">PDF Tax Invoice</span>
                          </div>
                        ) : (
                          <img
                            src={item.url}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        )}

                        {/* Top-Right Badge */}
                        <div className="absolute top-2.5 right-2.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xs border ${
                              isPurchase
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : isRepair
                                ? 'bg-sky-50 text-sky-800 border-sky-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            {isPurchase ? 'Purchase Invoice' : isRepair ? 'Vendor Repair Bill' : 'Return Photo'}
                          </span>
                        </div>

                        {/* Hover Overlay Button */}
                        <button
                          onClick={() => setSelectedDoc(item)}
                          className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 text-white transition backdrop-blur-2xs cursor-pointer font-bold text-xs"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Full Resolution</span>
                        </button>
                      </div>

                      {/* Card Content */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-bold text-[#c28551] bg-[#fbf5ef] px-2 py-0.5 rounded border border-[#c28551]/20">
                            {item.assetTag}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">{formatDate(item.date)}</span>
                        </div>

                        <h4 className="font-bold text-slate-900 text-xs line-clamp-1">{item.title}</h4>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{item.vendorOrHolder}</span>
                        </div>

                        {item.notes && (
                          <p className="text-[10px] text-slate-500 line-clamp-2 italic bg-[#fdfbf9] p-2 rounded-lg border border-slate-100">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="p-3.5 bg-[#fdfbf9] border-t border-slate-100 flex items-center justify-between">
                      <div>
                        {item.amountLKR !== undefined && (
                          <div className="font-mono font-bold text-[#c28551] text-xs">
                            {formatLKR(item.amountLKR)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-[#c28551] hover:bg-white transition cursor-pointer"
                          title="Open original file"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        <button
                          onClick={() => setSelectedDoc(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#1d2939] hover:bg-[#c28551] text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-[#dfae85]" />
                          <span>Inspect</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox / Document Full-Screen Inspector */}
      {selectedDoc && (
        <div
          className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedDoc(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="p-4 bg-[#fbf5ef] border-b border-[#f0e6de] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#c28551] bg-[#faece2] px-2 py-0.5 rounded">
                    {selectedDoc.assetTag}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">{selectedDoc.vendorOrHolder}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">{selectedDoc.title}</h3>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={selectedDoc.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-white text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>

                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Viewer Body */}
            <div className="p-4 overflow-y-auto flex-1 bg-slate-100 flex items-center justify-center min-h-[500px]">
              {selectedDoc.url.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={selectedDoc.url}
                  className="w-full h-[600px] rounded-xl border border-slate-300"
                  title={selectedDoc.title}
                />
              ) : (
                <img
                  src={selectedDoc.url}
                  alt={selectedDoc.title}
                  className="max-h-[75vh] w-auto object-contain rounded-xl shadow-lg border border-slate-200"
                />
              )}
            </div>

            {/* Lightbox Footer */}
            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div>
                Date: <span className="font-mono font-bold text-slate-800">{formatDate(selectedDoc.date)}</span>
              </div>
              {selectedDoc.amountLKR !== undefined && (
                <div>
                  Amount: <span className="font-mono font-bold text-[#c28551]">{formatLKR(selectedDoc.amountLKR)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
