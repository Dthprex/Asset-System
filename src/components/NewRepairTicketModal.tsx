'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Wrench,
  Building2,
  Phone,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { Asset, RepairTicket } from '@/types/asset';
import { formatLKR } from '@/lib/utils';
import { MediaUploadField } from '@/components/MediaUploadField';

interface NewRepairTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (ticket: RepairTicket) => void;
  preselectedAsset?: Asset | null;
  assets?: Asset[];
}

const COMMON_VENDORS = [
  {
    name: 'Softlogic Information Technologies',
    contact: '011 555 7800 (Service Hotline)',
    location: 'Softlogic Tech Centre, Nawam Mawatha, Colombo 02',
  },
  {
    name: 'Future World Sri Lanka (Apple Authorized)',
    contact: '011 257 6666 | support@futureworld.lk',
    location: 'Future World Service Hub, Ananda Coomaraswamy Mawatha, Colombo 03',
  },
  {
    name: 'CameraLK Service Division',
    contact: '011 259 8811 | repair@cameralk.com',
    location: 'CameraLK Headquarters, High Level Rd, Colombo 05',
  },
  {
    name: 'Singer Mega / Singer Service Centre',
    contact: '011 230 4444',
    location: 'Singer Central Service Complex, Ratmalana',
  },
  {
    name: 'Redline Technologies Lab',
    contact: '011 744 5555 | support@redlinetech.lk',
    location: 'Majestic City Level 3, Colombo 04',
  },
  {
    name: 'Doctor Mobile Bambalapitiya',
    contact: '+94 77 789 1234',
    location: 'Galle Road, Bambalapitiya, Colombo 04',
  },
];

export const NewRepairTicketModal: React.FC<NewRepairTicketModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedAsset = null,
  assets = [],
}) => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [vendorName, setVendorName] = useState('');
  const [vendorContact, setVendorContact] = useState('');
  const [serviceCenterLocation, setServiceCenterLocation] = useState('');
  const [rmaNumber, setRmaNumber] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [estimatedCostLKR, setEstimatedCostLKR] = useState<number | ''>(0);
  const [isCoveredByWarranty, setIsCoveredByWarranty] = useState(true);
  const [dispatchedDate, setDispatchedDate] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [invoiceDoc, setInvoiceDoc] = useState('');
  const [notes, setNotes] = useState('');
  const [dispatchedBy, setDispatchedBy] = useState('IT Asset Admin');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize dates and default values
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().slice(0, 10);
      setDispatchedDate(today);

      const inTwoWeeks = new Date();
      inTwoWeeks.setDate(inTwoWeeks.getDate() + 14);
      setExpectedReturnDate(inTwoWeeks.toISOString().slice(0, 10));

      if (preselectedAsset) {
        setSelectedAssetId(preselectedAsset.id);
        if (preselectedAsset.purchaseLocation) {
          // match vendor name if similar
          const matched = COMMON_VENDORS.find(v => 
            v.name.toLowerCase().includes(preselectedAsset.purchaseLocation.toLowerCase()) ||
            preselectedAsset.purchaseLocation.toLowerCase().includes(v.name.toLowerCase())
          );
          if (matched) {
            setVendorName(matched.name);
            setVendorContact(matched.contact);
            setServiceCenterLocation(matched.location);
          } else {
            setVendorName(preselectedAsset.purchaseLocation);
          }
        }
      } else if (assets.length > 0 && !selectedAssetId) {
        setSelectedAssetId(assets[0].id);
      }
    }
  }, [isOpen, preselectedAsset, assets]);

  if (!isOpen) return null;

  const currentAsset = preselectedAsset || assets.find(a => a.id === selectedAssetId);

  const handleSelectVendorPreset = (v: typeof COMMON_VENDORS[0]) => {
    setVendorName(v.name);
    setVendorContact(v.contact);
    setServiceCenterLocation(v.location);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedAssetId && !preselectedAsset) {
      setError('Please select an asset to dispatch.');
      return;
    }

    if (!vendorName.trim()) {
      setError('Please enter a vendor / service provider name.');
      return;
    }

    if (!rmaNumber.trim()) {
      setError('Please enter the RMA or vendor job sheet number.');
      return;
    }

    if (!issueDescription.trim()) {
      setError('Please provide a description of the issue or damages.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/repairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: currentAsset?.id || selectedAssetId,
          assetTag: currentAsset?.assetTag || '',
          assetName: currentAsset?.name || '',
          vendorName,
          vendorContact,
          serviceCenterLocation,
          rmaNumber,
          issueDescription,
          estimatedCostLKR: Number(estimatedCostLKR) || 0,
          actualCostLKR: 0,
          isCoveredByWarranty,
          dispatchedDate,
          expectedReturnDate,
          status: 'DISPATCHED_TO_VENDOR',
          notes,
          invoiceDoc: invoiceDoc || undefined,
          dispatchedBy,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to dispatch repair ticket.');
      }

      onSuccess(data.data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating repair ticket.');
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
              <Wrench className="w-6 h-6 text-[#faece2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#faece2] text-[#c28551] border border-[#ead7c7]">
                  Vendor RMA Dispatch
                </span>
                <span className="text-xs text-slate-400 font-mono">• Service Desk</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                Dispatch Asset for Vendor Repair
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

          {/* Asset Selection or Preview */}
          <div className="p-4 rounded-2xl bg-[#fdfbf9] border border-[#f0e6de] space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Target Hardware Item
            </div>

            {preselectedAsset ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{preselectedAsset.name}</div>
                  <div className="text-slate-500 font-mono text-xs">
                    Tag: <span className="text-[#c28551] font-bold">{preselectedAsset.assetTag}</span> • SN: {preselectedAsset.serialNumber}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                  {preselectedAsset.condition}
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
                    {a.assetTag} - {a.name} ({a.condition})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Quick Presets for Vendors */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Authorized Service Provider / Vendor
              </label>
              <span className="text-[10px] text-slate-400">Select quick preset:</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {COMMON_VENDORS.map((v) => (
                <button
                  key={v.name}
                  type="button"
                  onClick={() => handleSelectVendorPreset(v)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer border ${
                    vendorName === v.name
                      ? 'bg-[#c28551] text-white border-[#c28551]'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-[#fbf5ef] hover:border-[#c28551]/40'
                  }`}
                >
                  {v.name.split(' ')[0]}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Vendor / Company Name *</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="e.g. Softlogic Information Technologies"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#c28551]/30 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Vendor Phone / Contact</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={vendorContact}
                    onChange={(e) => setVendorContact(e.target.value)}
                    placeholder="e.g. 011 555 7800 (Technician: Ruwan)"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#c28551]/30"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Service Center Facility Location</label>
              <input
                type="text"
                value={serviceCenterLocation}
                onChange={(e) => setServiceCenterLocation(e.target.value)}
                placeholder="e.g. Softlogic Tech Centre, Nawam Mawatha, Colombo 02"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#c28551]/30"
              />
            </div>
          </div>

          {/* RMA Number & Warranty Coverage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                RMA / Job Sheet Reference Number *
              </label>
              <input
                type="text"
                required
                value={rmaNumber}
                onChange={(e) => setRmaNumber(e.target.value)}
                placeholder="e.g. SRV-99812 or FW-COL-0842"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#c28551]/30"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Warranty Coverage Status
              </label>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCoveredByWarranty(true)}
                  className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    isCoveredByWarranty
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Covered (Free)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCoveredByWarranty(false)}
                  className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    !isCoveredByWarranty
                      ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Billable / Out of Warranty</span>
                </button>
              </div>
            </div>
          </div>

          {/* Issue Description */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Issue Diagnostics / Reported Damages *
            </label>
            <textarea
              required
              rows={3}
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              placeholder="e.g. Liquid spill over keyboard area. Spacebar, Enter key sticky and non-responsive. Trackpad cursor jumps intermittently."
              className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#c28551]/30 leading-relaxed"
            />
          </div>

          {/* Estimated Cost & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Est. Repair Cost (LKR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-[10px]">Rs.</span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={estimatedCostLKR}
                  onChange={(e) => setEstimatedCostLKR(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#c28551]/30"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {formatLKR(Number(estimatedCostLKR) || 0)}
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Dispatch Date
              </label>
              <input
                type="date"
                required
                value={dispatchedDate}
                onChange={(e) => setDispatchedDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#c28551]/30"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Expected Return Date
              </label>
              <input
                type="date"
                required
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#c28551]/30"
              />
            </div>
          </div>

          {/* Vendor Service Bill / Intake Job Sheet */}
          <MediaUploadField
            label="Vendor Job Sheet / Intake Invoice Bill"
            sublabel="Upload authorized vendor receipt or intake job sheet document (PDF or image)"
            multiple={false}
            accept="image/*,application/pdf"
            values={invoiceDoc ? [invoiceDoc] : []}
            onChange={(urls) => setInvoiceDoc(urls[0] || '')}
            samplePresets={[
              { name: 'Softlogic Service Job Sheet', url: '/uploads/sample-repair-bill-softlogic.svg' }
            ]}
          />

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Internal IT Notes / Parts Tracking
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Handed over with power adapter. Waiting for replacement keyboard from Singapore."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#c28551]/30"
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
              <Wrench className="w-4 h-4" />
              <span>{submitting ? 'Creating RMA Ticket...' : 'Confirm RMA & Dispatch Asset'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
