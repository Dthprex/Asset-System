'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Smartphone, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { Asset, AssetCategory, AssetCondition, Branch, Department } from '@/types/asset';
import { formatLKR } from '@/lib/utils';
import { CATEGORIES } from './AssetFilters';
import { MediaUploadField } from '@/components/MediaUploadField';

interface NewAssetWizardModalProps {
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

export const NewAssetWizardModal: React.FC<NewAssetWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  branches,
  departments,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
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
  
  // Procurement
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

  const [purchaseLocation, setPurchaseLocation] = useState('Future World Colombo 03');
  const [purchaseAmount, setPurchaseAmount] = useState<number | ''>(150000);
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80');
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80'
  ]);
  const [invoiceDoc, setInvoiceDoc] = useState<string>('/uploads/sample-invoice-macbook.svg');

  // Deployment
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

  const validateStep1 = () => {
    if (!name.trim()) {
      setError('Please provide a name for the hardware device');
      return false;
    }
    if (!serialNumber.trim()) {
      setError('Serial number is required for asset barcode registration');
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = () => {
    if (!purchaseAmount || Number(purchaseAmount) <= 0) {
      setError('Please enter a valid purchase price in LKR');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    setError(null);
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
        purchaseLocation: purchaseLocation || 'Colombo Vendor',
        purchaseAmount: Number(purchaseAmount),
        images: images.length > 0 ? images : [imageUrl],
        invoiceDoc: invoiceDoc || '',
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
        throw new Error(data.error || 'Failed to register hardware asset');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-white border border-[#f0e6de] rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header with Step Indicators */}
        <div className="p-6 bg-[#fbf5ef]/80 border-b border-[#f0e6de] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#faece2] border border-[#ead7c7] flex items-center justify-center text-[#c28551]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1d2939]">New Hardware Procurement Intake</h2>
              <p className="text-xs text-slate-500">Step {step} of 3: {step === 1 ? 'Hardware Specifications' : step === 2 ? 'Procurement & Financials' : 'Initial Deployment'}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-[#faece2]/50 transition btn-press-sm cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Line */}
        <div className="grid grid-cols-3 bg-[#f7f0e9] h-1">
          <div className={`h-full bg-[#c28551] transition-all duration-300 ${step >= 1 ? 'w-full' : 'w-0'}`} />
          <div className={`h-full bg-[#c28551] transition-all duration-300 ${step >= 2 ? 'w-full' : 'w-0'}`} />
          <div className={`h-full bg-[#c28551] transition-all duration-300 ${step >= 3 ? 'w-full' : 'w-0'}`} />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
          
          {/* STEP 1: SPECS */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Device Name / Title <span className="text-[#c28551]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. MacBook Pro 14 M2, Galaxy Tab S9 FE"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#fdfbf9] border border-[#f0e6de] text-[#1d2939] text-xs focus:ring-2 focus:ring-[#c28551]/20 focus:border-[#c28551] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category <span className="text-[#c28551]">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const cat = e.target.value as AssetCategory;
                      setCategory(cat);
                      if (cat === 'Tablet' || cat === 'Mobile Phone') setHasSim(true);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#fdfbf9] border border-[#f0e6de] text-[#1d2939] text-xs focus:ring-2 focus:ring-[#c28551]/20 focus:border-[#c28551] focus:bg-white transition cursor-pointer"
                  >
                    {CATEGORIES.filter(c => c.value !== 'ALL').map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Brand / Manufacturer
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Apple, Dell, Samsung, Sony"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#fdfbf9] border border-[#f0e6de] text-[#1d2939] text-xs focus:ring-2 focus:ring-[#c28551]/20 focus:border-[#c28551] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Model / Part Number
                  </label>
                  <input
                    type="text"
                    value={modelNumber}
                    onChange={(e) => setModelNumber(e.target.value)}
                    placeholder="e.g. MPHE3LL/A, SM-X516B"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#fdfbf9] border border-[#f0e6de] text-[#1d2939] text-xs focus:ring-2 focus:ring-[#c28551]/20 focus:border-[#c28551] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Serial Number <span className="text-[#c28551]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="e.g. C02GN0AAQ6L4"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#fdfbf9] border border-[#f0e6de] text-[#1d2939] font-mono text-xs focus:ring-2 focus:ring-[#c28551]/20 focus:border-[#c28551] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Condition at Intake
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as AssetCondition)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#fdfbf9] border border-[#f0e6de] text-[#1d2939] text-xs focus:ring-2 focus:ring-[#c28551]/20 focus:border-[#c28551] focus:bg-white transition cursor-pointer"
                  >
                    <option value="Brand New">Brand New (Factory Sealed)</option>
                    <option value="Used - Like New">Used - Like New (Mint)</option>
                    <option value="Used - Good">Used - Good</option>
                    <option value="Used - Fair">Used - Fair</option>
                    <option value="Damaged / Needs Repair">Refurbished / Serviced</option>
                  </select>
                </div>

              </div>

              {/* Cellular Dual SIM Toggle */}
              <div className="p-4 rounded-2xl bg-[#fdfbf9] border border-[#f0e6de] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#c28551]" />
                    <span className="text-xs font-semibold text-[#1d2939]">
                      Cellular SIM Support (Tablets & Mobile Phones)
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasSim}
                      onChange={(e) => setHasSim(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#c28551]"></div>
                  </label>
                </div>

                {hasSim && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#f0e6de]">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        IMEI Slot 1 (15 digits)
                      </label>
                      <input
                        type="text"
                        value={imei1}
                        onChange={(e) => setImei1(e.target.value)}
                        placeholder="354891104829103"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#f0e6de] text-[#1d2939] font-mono text-xs focus:ring-1 focus:ring-[#c28551]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        IMEI Slot 2 (Dual SIM)
                      </label>
                      <input
                        type="text"
                        value={imei2}
                        onChange={(e) => setImei2(e.target.value)}
                        placeholder="354891104829104"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#f0e6de] text-[#1d2939] font-mono text-xs focus:ring-1 focus:ring-[#c28551]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: PROCUREMENT & FINANCIALS */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Purchase Price in LKR <span className="text-[#c28551]">*</span>
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
                      className="w-full pl-3 pr-24 py-2.5 rounded-xl bg-[#fdfbf9] border border-[#f0e6de] text-[#1d2939] text-xs focus:ring-2 focus:ring-[#c28551]/20 focus:border-[#c28551] focus:bg-white transition"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-bold text-[#c28551]">
                      {formatLKR(Number(purchaseAmount) || 0)}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Purchase Date <span className="text-[#c28551]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#fdfbf9] border border-[#f0e6de] text-[#1d2939] text-xs focus:ring-2 focus:ring-[#c28551]/20 focus:border-[#c28551] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Warranty Expiry Date
                  </label>
                  <input
                    type="date"
                    value={warrantyEndDate}
                    onChange={(e) => setWarrantyEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#fdfbf9] border border-[#f0e6de] text-[#1d2939] text-xs focus:ring-2 focus:ring-[#c28551]/20 focus:border-[#c28551] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vendor / Purchase Location
                  </label>
                  <input
                    type="text"
                    value={purchaseLocation}
                    onChange={(e) => setPurchaseLocation(e.target.value)}
                    placeholder="e.g. Future World, CameraLK, Singer"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#fdfbf9] border border-[#f0e6de] text-[#1d2939] text-xs focus:ring-2 focus:ring-[#c28551]/20 focus:border-[#c28551] focus:bg-white transition"
                  />
                </div>

              </div>

              {/* Vendor suggestions */}
              <div className="flex flex-wrap gap-1.5 items-center pt-1">
                <span className="text-[11px] text-slate-400 mr-1">Frequent Vendors:</span>
                {COMMON_VENDORS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setPurchaseLocation(v)}
                    className="px-2 py-0.5 rounded-lg bg-[#fbf5ef] hover:bg-[#faece2] hover:text-[#c28551] border border-[#ead7c7] text-[10px] text-slate-700 transition cursor-pointer"
                  >
                    {v}
                  </button>
                ))}
              </div>

              {/* Media & Invoices Upload Dropzones */}
              <div className="pt-2 border-t border-[#f0e6de] space-y-4">
                <MediaUploadField
                  label="Purchased Item Photos"
                  sublabel="Upload photos of the purchased hardware (unboxed item, serial barcode sticker, ports)"
                  multiple={true}
                  accept="image/*"
                  values={images}
                  onChange={setImages}
                  maxFiles={6}
                  samplePresets={[
                    { name: 'MacBook M2 Photos', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80' },
                    { name: 'Sony Camera Photos', url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80' }
                  ]}
                />

                <MediaUploadField
                  label="Official Purchase Invoice / Bill Document"
                  sublabel="Upload vendor tax invoice, delivery bill, or store purchase receipt (PNG, JPG, or PDF)"
                  multiple={false}
                  accept="image/*,application/pdf"
                  values={invoiceDoc ? [invoiceDoc] : []}
                  onChange={(urls) => setInvoiceDoc(urls[0] || '')}
                  samplePresets={[
                    { name: 'Future World Tax Invoice (Sample)', url: '/uploads/sample-invoice-macbook.svg' }
                  ]}
                />
              </div>
            </div>
          )}

          {/* STEP 3: INITIAL DEPLOYMENT */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#fdfbf9] border border-[#f0e6de] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#1d2939]">Deploy Hardware Immediately</h4>
                    <p className="text-[11px] text-slate-500">Deploy directly to a showroom, department, or temporary loan</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assignImmediately}
                      onChange={(e) => setAssignImmediately(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#c28551]"></div>
                  </label>
                </div>

                {assignImmediately && (
                  <div className="pt-3 border-t border-[#f0e6de] space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Deployment Mode</label>
                        <select
                          value={assignmentType}
                          onChange={(e) => setAssignmentType(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-[#f0e6de] text-[#1d2939] text-xs"
                        >
                          <option value="LOCATION_SHOWROOM">Permanent Showroom Deployment</option>
                          <option value="DEPARTMENT_SHARED">Department Shared Asset</option>
                          <option value="PERMANENT_EMPLOYEE">Permanent Employee Allocation</option>
                          <option value="TEMPORARY_BORROW">Temporary Borrow / Loan</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Location / Branch</label>
                        <select
                          value={locationOrBranch}
                          onChange={(e) => setLocationOrBranch(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-[#f0e6de] text-[#1d2939] text-xs"
                        >
                          {branches.map(b => (
                            <option key={b.id} value={b.name}>{b.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Custodian / Holder Name</label>
                        <input
                          type="text"
                          value={assignedToName}
                          onChange={(e) => setAssignedToName(e.target.value)}
                          placeholder="e.g. Senuri Wickramasinghe, POS 1"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-[#f0e6de] text-[#1d2939] text-xs"
                        />
                      </div>

                      {assignmentType === 'TEMPORARY_BORROW' && (
                        <div>
                          <label className="block text-[11px] font-semibold text-amber-700 mb-1">Scheduled Return Date</label>
                          <input
                            type="date"
                            value={expectedReturnDate}
                            onChange={(e) => setExpectedReturnDate(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Deployment Notes</label>
                      <input
                        type="text"
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        placeholder="e.g. Colombo flagship showroom cashier stand"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#f0e6de] text-[#1d2939] text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Wizard Footer Controls */}
        <div className="p-6 bg-[#fbf5ef]/80 border-t border-[#f0e6de] flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition btn-press-sm cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {step < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && validateStep1()) setStep(2);
                  if (step === 2 && validateStep2()) setStep(3);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#1d2939] hover:bg-[#c28551] text-white text-xs font-semibold flex items-center gap-1.5 transition btn-press-sm cursor-pointer"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#c28551] to-[#dfae85] hover:from-[#b07440] hover:to-[#cb8e5c] text-white text-xs font-semibold shadow-md shadow-[#c28551]/20 transition flex items-center gap-2 disabled:opacity-50 btn-press-sm cursor-pointer"
              >
                {submitting ? (
                  <span>Registering...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Complete Intake</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
