'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Smartphone, 
  Tag, 
  Calendar, 
  MapPin, 
  Coins, 
  Building2, 
  Laptop, 
  FileText, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { Asset, AssetCategory, AssetCondition, Branch, Department } from '@/types/asset';
import { formatLKR } from '@/lib/utils';
import { CATEGORIES } from './AssetFilters';

interface NewAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newAsset: Asset) => void;
  branches: Branch[];
  departments: Department[];
}

const COMMON_VENDORS = [
  'Future World Colombo 03',
  'CameraLK Colombo 05',
  'Singer Mega Colombo 04',
  'Softlogic Information Tech',
  'Redline Technologies',
  'Abans PLC',
  'Barcodes.lk'
];

export const NewAssetModal: React.FC<NewAssetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  branches,
  departments,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AssetCategory>('Laptop');
  const [brand, setBrand] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [hasSim, setHasSim] = useState(false);
  const [imei1, setImei1] = useState('');
  const [imei2, setImei2] = useState('');
  const [condition, setCondition] = useState<AssetCondition>('Brand New');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [warrantyEndDate, setWarrantyEndDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (!purchaseDate) {
        setPurchaseDate(new Date().toISOString().slice(0, 10));
      }
      if (!warrantyEndDate) {
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 2);
        setWarrantyEndDate(nextYear.toISOString().slice(0, 10));
      }
    }
  }, [isOpen, purchaseDate, warrantyEndDate]);
  const [purchaseLocation, setPurchaseLocation] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState<number | ''>(150000);
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80');

  // Immediate Assignment Option
  const [assignImmediately, setAssignImmediately] = useState(false);
  const [assignmentType, setAssignmentType] = useState<'LOCATION_SHOWROOM' | 'DEPARTMENT_SHARED' | 'PERMANENT_EMPLOYEE' | 'TEMPORARY_BORROW'>('LOCATION_SHOWROOM');
  const [assignedToName, setAssignedToName] = useState('');
  const [assignedToRole, setAssignedToRole] = useState('');
  const [assignedToContact, setAssignedToContact] = useState('');
  const [locationOrBranch, setLocationOrBranch] = useState(branches[0]?.name || 'Colombo Flagship Showroom (Galle Rd)');
  const [department, setDepartment] = useState(departments[0]?.name || 'Retail Showrooms & Operations');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [purpose, setPurpose] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide a name for the device');
      return;
    }
    if (!serialNumber.trim()) {
      setError('Serial number is required for asset inventory audit');
      return;
    }
    if (!purchaseAmount || Number(purchaseAmount) <= 0) {
      setError('Please specify a valid purchase price in LKR');
      return;
    }

    setSubmitting(true);

    try {
      const payload: any = {
        name,
        category,
        brand: brand || 'Standard',
        modelNumber,
        serialNumber,
        hasSim,
        imei1: hasSim ? imei1 : '',
        imei2: hasSim ? imei2 : '',
        condition,
        purchaseDate,
        warrantyEndDate,
        purchaseLocation: purchaseLocation || 'Colombo Authorized Vendor',
        purchaseAmount: Number(purchaseAmount),
        images: [imageUrl],
      };

      if (assignImmediately) {
        payload.currentAssignment = {
          assignmentType,
          assignedToName: assignedToName || locationOrBranch,
          assignedToRole,
          assignedToContact,
          assignedDate: purchaseDate,
          expectedReturnDate: assignmentType === 'TEMPORARY_BORROW' ? expectedReturnDate : '',
          locationOrBranch,
          department,
          purpose,
        };
      }

      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save asset');
      }

      onSuccess(data.data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred during asset intake');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">New Asset Intake (Procurement)</h2>
              <p className="text-xs text-slate-400">Register newly purchased hardware for cosmetics.lk IT inventory</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Section 1: Basic Identification */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-2">
              <Laptop className="w-4 h-4" />
              <span>Device Specifications</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Device Name / Title <span className="text-pink-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. MacBook Pro 14 M2, Galaxy Tab S9, Dell OptiPlex"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Category <span className="text-pink-400">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    const cat = e.target.value as AssetCategory;
                    setCategory(cat);
                    if (cat === 'Tablet' || cat === 'Mobile Phone') {
                      setHasSim(true);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                >
                  {CATEGORIES.filter(c => c.value !== 'ALL').map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Brand / Manufacturer
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Apple, Dell, Samsung, Sony, HP"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Model / Part Number
                </label>
                <input
                  type="text"
                  value={modelNumber}
                  onChange={(e) => setModelNumber(e.target.value)}
                  placeholder="e.g. A2779, SM-X516B, OptiPlex 7090 MFF"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Serial Number (Hardware Barcode) <span className="text-pink-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g. C02GN0AAQ6L4, R52X40098PL"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Condition at Purchase
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as AssetCondition)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                >
                  <option value="Brand New">Brand New (Factory Sealed)</option>
                  <option value="Used - Like New">Used - Like New (Mint)</option>
                  <option value="Used - Good">Used - Good Condition</option>
                  <option value="Used - Fair">Used - Fair Condition</option>
                  <option value="Damaged / Needs Repair">Refurbished / Serviced</option>
                </select>
              </div>

            </div>

            {/* Cellular / Dual-SIM Toggle */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-200">
                    Cellular SIM Card Support (Tablets / Mobile Phones)
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasSim}
                    onChange={(e) => setHasSim(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-500"></div>
                </label>
              </div>

              {hasSim && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      IMEI Slot 1 (15 digits)
                    </label>
                    <input
                      type="text"
                      value={imei1}
                      onChange={(e) => setImei1(e.target.value)}
                      placeholder="e.g. 354891104829103"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-mono text-xs focus:ring-1 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      IMEI Slot 2 (Dual SIM slot)
                    </label>
                    <input
                      type="text"
                      value={imei2}
                      onChange={(e) => setImei2(e.target.value)}
                      placeholder="e.g. 354891104829104"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-mono text-xs focus:ring-1 focus:ring-pink-500"
                    />
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Section 2: Procurement & Financials */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-2">
              <Coins className="w-4 h-4" />
              <span>Procurement & Warranty Details (Sri Lankan Rupees)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Purchase Amount (LKR) <span className="text-pink-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 195000"
                    className="w-full pl-3 pr-24 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-bold text-pink-400">
                    {formatLKR(Number(purchaseAmount) || 0)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Purchase Date <span className="text-pink-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Warranty Expiry Date
                </label>
                <input
                  type="date"
                  value={warrantyEndDate}
                  onChange={(e) => setWarrantyEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Vendor / Purchase Location
                </label>
                <input
                  type="text"
                  value={purchaseLocation}
                  onChange={(e) => setPurchaseLocation(e.target.value)}
                  placeholder="e.g. Future World, CameraLK, Singer Mega"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                />
              </div>

            </div>

            {/* Quick Vendor Tags */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[11px] text-slate-400 mr-1">Quick Select Vendor:</span>
              {COMMON_VENDORS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setPurchaseLocation(v)}
                  className="px-2 py-0.5 rounded-lg bg-slate-950 text-slate-300 hover:text-pink-300 border border-slate-800 hover:border-pink-500/40 text-[10px] transition"
                >
                  {v}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Item Photo URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50"
              />
            </div>

          </div>

          {/* Section 3: Initial Assignment (Optional) */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-200">Immediate Deployment / Assignment</h4>
                <p className="text-[11px] text-slate-400">Deploy directly to a showroom, department, or loan immediately</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={assignImmediately}
                  onChange={(e) => setAssignImmediately(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-500"></div>
              </label>
            </div>

            {assignImmediately && (
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Assignment Type
                    </label>
                    <select
                      value={assignmentType}
                      onChange={(e) => setAssignmentType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs"
                    >
                      <option value="LOCATION_SHOWROOM">Permanent Showroom Deployment</option>
                      <option value="DEPARTMENT_SHARED">Department Shared Asset</option>
                      <option value="PERMANENT_EMPLOYEE">Permanent Employee Allocation</option>
                      <option value="TEMPORARY_BORROW">Temporary Borrow / Loan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Branch / Showroom Location
                    </label>
                    <select
                      value={locationOrBranch}
                      onChange={(e) => setLocationOrBranch(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs"
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Custodian / Holder Name
                    </label>
                    <input
                      type="text"
                      value={assignedToName}
                      onChange={(e) => setAssignedToName(e.target.value)}
                      placeholder="e.g. Senuri Wickramasinghe, POS Counter 1"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs"
                    />
                  </div>

                  {assignmentType === 'TEMPORARY_BORROW' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-amber-400 mb-1">
                        Expected Return Date (Due Date)
                      </label>
                      <input
                        type="date"
                        value={expectedReturnDate}
                        onChange={(e) => setExpectedReturnDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-200 text-xs"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Purpose / Deployment Notes
                  </label>
                  <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="e.g. 4K campaign video shoots, Colombo flagship cashier counter"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-xs font-semibold shadow-lg shadow-pink-500/25 transition disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <span>Registering Item...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Complete Intake</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
