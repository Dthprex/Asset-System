'use client';

import React, { useRef } from 'react';
import { 
  X, 
  Printer, 
  FileCheck2, 
  Building2, 
  Calendar, 
  User, 
  ShieldCheck, 
  Smartphone, 
  Clock, 
  CheckSquare, 
  Download
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Asset, CurrentAssignment } from '@/types/asset';
import { formatLKR, formatDate } from '@/lib/utils';

interface HandoverVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null;
  assignment?: CurrentAssignment | null;
}

export const HandoverVoucherModal: React.FC<HandoverVoucherModalProps> = ({
  isOpen,
  onClose,
  asset,
  assignment: passedAssignment,
}) => {
  if (!isOpen || !asset) return null;

  // Use either the passed assignment record or the asset's current assignment
  const currentAssignment = passedAssignment || asset.currentAssignment;
  const voucherNumber = `VCH-${asset.assetTag}-${(currentAssignment?.assignedDate || new Date().toISOString().slice(0, 10)).replace(/-/g, '')}`;
  const assignedDate = currentAssignment?.assignedDate || new Date().toISOString().slice(0, 10);
  const isTemporary = currentAssignment?.assignmentType === 'TEMPORARY_BORROW';

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* SCREEN PREVIEW MODAL (Hidden in print) */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200 print:hidden">
        <div 
          className="relative w-full max-w-3xl bg-white border border-[#f0e6de] rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header Bar */}
          <div className="p-5 bg-[#fbf5ef]/90 border-b border-[#f0e6de] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white border border-[#c28551]/30 flex items-center justify-center text-[#c28551] shadow-xs">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Equipment Custody Handover Voucher</span>
                  <span className="text-[10px] uppercase font-bold text-[#c28551] bg-[#faece2] px-2 py-0.5 rounded-full border border-[#c28551]/30">
                    Official Slip
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Document checkout receipt with employee signature & terms of hardware custody
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/80 transition btn-press-sm cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body: Scrollable Voucher Document Preview */}
          <div className="flex-1 bg-slate-100/90 p-4 sm:p-6 overflow-y-auto flex justify-center">
            
            {/* The Document Sheet */}
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8 space-y-6 text-slate-800">
              
              {/* Slip Header */}
              <div className="flex items-start justify-between pb-4 border-b-2 border-slate-900">
                <div>
                  <div className="text-lg font-black tracking-wider text-[#c28551] uppercase">
                    COSMETICS.LK
                  </div>
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-widest mt-0.5">
                    Information Technology & Digital Infrastructure
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Headquarters: Nawala, Sri Lanka • Tel: +94 11 234 5678 • it-helpdesk@cosmetics.lk
                  </p>
                </div>

                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-[#fbf5ef] text-[#c28551] border border-[#c28551]/30">
                    {voucherNumber}
                  </span>
                  <div className="text-[11px] font-mono text-slate-500 mt-1">Date: {formatDate(assignedDate)}</div>
                </div>
              </div>

              {/* Title & Assignment Type */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Handover Type</span>
                  <span className="text-sm font-bold text-slate-900">
                    {currentAssignment?.assignmentType ? currentAssignment.assignmentType.replace(/_/g, ' ') : 'INTERNAL DEPLOYMENT'}
                  </span>
                </div>

                <div className="sm:text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Deploy Location</span>
                  <span className="font-semibold text-slate-800">
                    {currentAssignment?.locationOrBranch || 'Colombo Central IT Lab'}
                  </span>
                </div>
              </div>

              {/* Custodian Details & Device Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                {/* Custodian Box */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <User className="w-4 h-4 text-[#c28551]" />
                    <span>Custodian / Receiver Details</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Full Name:</span>
                      <span className="font-bold text-slate-900">{currentAssignment?.assignedToName || 'Unassigned'}</span>
                    </div>
                    {currentAssignment?.assignedToRole && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Designation:</span>
                        <span className="text-slate-700">{currentAssignment.assignedToRole}</span>
                      </div>
                    )}
                    {currentAssignment?.department && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Department:</span>
                        <span className="text-slate-700">{currentAssignment.department}</span>
                      </div>
                    )}
                    {currentAssignment?.assignedToContact && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Contact / Ext:</span>
                        <span className="font-mono text-slate-700">{currentAssignment.assignedToContact}</span>
                      </div>
                    )}
                    {isTemporary && currentAssignment?.expectedReturnDate && (
                      <div className="flex justify-between pt-1 border-t border-slate-100 text-amber-900 font-bold">
                        <span>Expected Return Date:</span>
                        <span className="font-mono">{formatDate(currentAssignment.expectedReturnDate)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Device Box */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <ShieldCheck className="w-4 h-4 text-[#c28551]" />
                    <span>Hardware Specifications</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Asset Tag:</span>
                      <span className="font-mono font-bold text-[#c28551]">{asset.assetTag}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Equipment Name:</span>
                      <span className="font-bold text-slate-900 truncate max-w-[140px]">{asset.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Serial Number:</span>
                      <span className="font-mono text-slate-800">{asset.serialNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Intake Condition:</span>
                      <span className="font-semibold text-slate-800">{asset.condition}</span>
                    </div>
                    {asset.hasSim && (
                      <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                        <span>SIM 1 IMEI:</span>
                        <span>{asset.imei1 || 'N/A'}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1 border-t border-slate-100">
                      <span className="text-slate-500">Asset Value:</span>
                      <span className="font-bold text-slate-900">{formatLKR(asset.purchaseAmount)}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Handover Purpose & Checklist */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Checklist & Issued Accessories
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-700">
                  <span className="flex items-center gap-1">☑ Original Charger Brick</span>
                  <span className="flex items-center gap-1">☑ Power / USB-C Cable</span>
                  <span className="flex items-center gap-1">☑ Protective Case / Sleeve</span>
                  <span className="flex items-center gap-1">☑ Clean Display & Bezel</span>
                </div>
                {currentAssignment?.purpose && (
                  <div className="pt-1.5 text-[11px] text-slate-600 border-t border-slate-200">
                    <span className="font-semibold text-slate-800">Deployment Purpose:</span> "{currentAssignment.purpose}"
                  </div>
                )}
              </div>

              {/* Terms of Custody */}
              <div className="space-y-1 text-[10px] text-slate-500 leading-relaxed border-t border-slate-200 pt-3">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                  Company Custody Agreement & Terms
                </div>
                <p>
                  1. The equipment listed above remains the exclusive property of cosmetics.lk and is issued solely for corporate retail operations or authorized company duties.
                </p>
                <p>
                  2. The custodian agrees to exercise all reasonable care in safeguarding the device from liquid spills, physical impact, drop damage, or unauthorized modifications.
                </p>
                <p>
                  3. In the event of theft, malfunction, or damage, the custodian must notify the IT Helpdesk within 24 hours. The device must be surrendered upon departure or IT audit request.
                </p>
              </div>

              {/* Signature Blocks */}
              <div className="pt-6 border-t-2 border-slate-300 grid grid-cols-2 gap-8 text-xs">
                
                {/* Issued By */}
                <div className="space-y-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Handed Over By (IT Dept):
                  </div>
                  <div className="h-10 border-b border-dashed border-slate-300 flex items-end pb-1 font-signature text-slate-400 italic">
                    {(currentAssignment as any)?.performedBy || 'IT Asset Administrator'}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Signature & Stamp / Date: {formatDate(assignedDate)}
                  </div>
                </div>

                {/* Received By */}
                <div className="space-y-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Received & Acknowledged By:
                  </div>
                  <div className="h-10 border-b border-dashed border-slate-300" />
                  <div className="text-[11px] text-slate-600">
                    Custodian Signature / NIC: ___________________
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* Modal Footer Controls */}
          <div className="p-4 bg-white border-t border-[#f0e6de] flex items-center justify-between shrink-0">
            <div className="text-xs text-slate-500 font-mono">
              Slip Reference: <span className="font-bold text-slate-800">{voucherNumber}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition btn-press-sm cursor-pointer"
              >
                Close Preview
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#c28551] to-[#dfae85] hover:from-[#b07440] hover:to-[#cb8e5c] text-white text-xs font-semibold shadow-md shadow-[#c28551]/20 transition flex items-center gap-2 cursor-pointer btn-press"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Voucher (A4)</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* DEDICATED PRINT CONTAINER (Visible ONLY when window.print() is called) */}
      <div className="hidden print:block print-area">
        <div style={{ padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#111', background: 'white' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2.5px solid #000', paddingBottom: '12px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '0.05em', color: '#000' }}>
                COSMETICS.LK
              </div>
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '2px' }}>
                Information Technology & Digital Infrastructure Department
              </div>
              <div style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>
                Corporate HQ: Nawala, Sri Lanka • Hotline: +94 11 234 5678 • it-helpdesk@cosmetics.lk
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '12px', border: '1px solid #000', padding: '3px 8px', borderRadius: '4px' }}>
                {voucherNumber}
              </div>
              <div style={{ fontSize: '10px', marginTop: '4px', color: '#444' }}>
                Issue Date: {formatDate(assignedDate)}
              </div>
            </div>
          </div>

          {/* Title */}
          <div style={{ textAlign: 'center', margin: '14px 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <h1 style={{ fontSize: '15px', fontWeight: '900', margin: '0' }}>EQUIPMENT CUSTODY HANDOVER VOUCHER</h1>
            <p style={{ fontSize: '10px', color: '#555', margin: '2px 0 0 0' }}>
              Official checkout record & custody acknowledgment form
            </p>
          </div>

          {/* Meta Banner */}
          <div style={{ background: '#f5f5f5', border: '1px solid #ccc', borderRadius: '6px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: '#666', display: 'block' }}>Handover Mode</span>
              <span style={{ fontWeight: '800' }}>{currentAssignment?.assignmentType ? currentAssignment.assignmentType.replace(/_/g, ' ') : 'INTERNAL ALLOCATION'}</span>
            </div>
            <div>
              <span style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: '#666', display: 'block' }}>Assigned Branch / Showroom</span>
              <span style={{ fontWeight: '800' }}>{currentAssignment?.locationOrBranch || 'Colombo Central IT Lab'}</span>
            </div>
            {isTemporary && currentAssignment?.expectedReturnDate && (
              <div>
                <span style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: '#666', display: 'block' }}>Scheduled Return Date</span>
                <span style={{ fontWeight: '800', color: '#b91c1c' }}>{formatDate(currentAssignment.expectedReturnDate)}</span>
              </div>
            )}
          </div>

          {/* Custodian & Hardware Tables */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            
            {/* Custodian Box */}
            <div style={{ border: '1px solid #222', borderRadius: '6px', padding: '12px', fontSize: '11px' }}>
              <div style={{ fontWeight: 'bold', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '8px', textTransform: 'uppercase', fontSize: '10px' }}>
                Custodian / Receiver Information
              </div>
              <table style={{ width: '100%', lineHeight: '1.6' }}>
                <tbody>
                  <tr>
                    <td style={{ color: '#555', width: '38%' }}>Custodian Name:</td>
                    <td style={{ fontWeight: 'bold' }}>{currentAssignment?.assignedToName || 'Unassigned'}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#555' }}>Designation:</td>
                    <td>{currentAssignment?.assignedToRole || 'Retail Staff / Operation'}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#555' }}>Department:</td>
                    <td>{currentAssignment?.department || 'Retail Showrooms'}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#555' }}>Contact Phone:</td>
                    <td style={{ fontFamily: 'monospace' }}>{currentAssignment?.assignedToContact || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Hardware Box */}
            <div style={{ border: '1px solid #222', borderRadius: '6px', padding: '12px', fontSize: '11px' }}>
              <div style={{ fontWeight: 'bold', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '8px', textTransform: 'uppercase', fontSize: '10px' }}>
                Hardware Specifications
              </div>
              <table style={{ width: '100%', lineHeight: '1.6' }}>
                <tbody>
                  <tr>
                    <td style={{ color: '#555', width: '38%' }}>Asset Tag:</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{asset.assetTag}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#555' }}>Device Name:</td>
                    <td style={{ fontWeight: 'bold' }}>{asset.name}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#555' }}>Serial Number:</td>
                    <td style={{ fontFamily: 'monospace' }}>{asset.serialNumber}</td>
                  </tr>
                  {asset.hasSim && asset.imei1 && (
                    <tr>
                      <td style={{ color: '#555' }}>Cellular IMEI:</td>
                      <td style={{ fontFamily: 'monospace' }}>{asset.imei1}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ color: '#555' }}>Replacement Value:</td>
                    <td style={{ fontWeight: 'bold' }}>{formatLKR(asset.purchaseAmount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

          {/* Accessories Checklist */}
          <div style={{ border: '1px solid #ccc', borderRadius: '6px', padding: '10px 14px', fontSize: '10px', marginBottom: '14px', background: '#fafafa' }}>
            <div style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px', fontSize: '9px', color: '#444' }}>
              Handover Accessories Checklist & Initial Condition Grade: {asset.condition}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              <span>[ ✓ ] Power Adapter / Brick</span>
              <span>[ ✓ ] Original Cable</span>
              <span>[ ✓ ] Carrying Bag / Sleeve</span>
              <span>[ ✓ ] Clean Screen & Hardware</span>
            </div>
            {currentAssignment?.purpose && (
              <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #ccc', color: '#444' }}>
                <strong>Authorized Purpose:</strong> "{currentAssignment.purpose}"
              </div>
            )}
          </div>

          {/* Terms */}
          <div style={{ fontSize: '9px', color: '#444', lineHeight: '1.4', marginBottom: '24px', borderTop: '1px solid #ddd', paddingTop: '10px' }}>
            <div style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px', color: '#000' }}>
              Terms of Hardware Custody & Responsibility
            </div>
            <p style={{ margin: '0 0 3px 0' }}>
              1. The listed hardware remains the property of cosmetics.lk. Custody is temporary and conditional upon active employment and adherence to IT security standards.
            </p>
            <p style={{ margin: '0 0 3px 0' }}>
              2. The custodian is responsible for physical and liquid protection. Any loss or physical defect must be reported to the IT Helpdesk within 24 hours.
            </p>
            <p style={{ margin: '0' }}>
              3. Upon resignation, transfer, or IT audit request, the custodian must return this hardware with all issued accessories in good order.
            </p>
          </div>

          {/* Signatures */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '20px', paddingTop: '16px', borderTop: '2px solid #000' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#555', marginBottom: '32px' }}>
                Issued by (IT Administrator):
              </div>
              <div style={{ borderTop: '1px dashed #777', paddingTop: '4px', fontSize: '10px' }}>
                Authorized Signature & Date / Stamp
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#555', marginBottom: '32px' }}>
                Received & Acknowledged by (Custodian):
              </div>
              <div style={{ borderTop: '1px dashed #777', paddingTop: '4px', fontSize: '10px' }}>
                Custodian Signature, NIC & Date
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};
