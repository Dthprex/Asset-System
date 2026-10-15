'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  Scan, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Search, 
  ArrowRight, 
  RotateCcw, 
  ArrowRightLeft, 
  ExternalLink,
  Laptop
} from 'lucide-react';
import { Asset } from '@/types/asset';
import { formatLKR, getWarrantyInfo } from '@/lib/utils';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  onSelectAsset: (asset: Asset) => void;
  onOpenAssign?: (asset: Asset) => void;
  onOpenReturn?: (asset: Asset) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  assets,
  onSelectAsset,
  onOpenAssign,
  onOpenReturn,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [matchedAsset, setMatchedAsset] = useState<Asset | null>(null);
  const [manualQuery, setManualQuery] = useState('');
  const scannerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Play gentle affirmative audio chime
  const playSuccessChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.12); // E6
      gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.16);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.16);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 30, 60]);
      }
    } catch {}
  };

  // Match raw scanned string against fleet assets
  const processDecodedString = (decodedText: string) => {
    if (!decodedText) return;
    const cleanText = decodedText.trim();
    setScannedCode(cleanText);

    // Look for match by Asset Tag, Serial Number, IMEI 1/2, or embedded JSON
    let found = assets.find((a) => {
      if (a.assetTag.toLowerCase() === cleanText.toLowerCase()) return true;
      if (a.serialNumber.toLowerCase() === cleanText.toLowerCase()) return true;
      if (a.imei1 && cleanText.includes(a.imei1)) return true;
      if (a.imei2 && cleanText.includes(a.imei2)) return true;
      return false;
    });

    // Check if scanned QR was a full JSON object from sticker generator
    if (!found) {
      try {
        const parsed = JSON.parse(cleanText);
        if (parsed.tag || parsed.assetTag) {
          const tag = parsed.tag || parsed.assetTag;
          found = assets.find(a => a.assetTag.toLowerCase() === String(tag).toLowerCase());
        }
      } catch {}
    }

    if (found) {
      setMatchedAsset(found);
      playSuccessChime();
    } else {
      setMatchedAsset(null);
    }
  };

  // Initialize html5-qrcode camera scanner
  useEffect(() => {
    let html5QrCode: any = null;
    let isMounted = true;

    if (isOpen && activeTab === 'camera') {
      setCameraError(null);

      import('html5-qrcode')
        .then(({ Html5Qrcode }) => {
          if (!isMounted) return;
          const element = document.getElementById('reader');
          if (!element) return;

          html5QrCode = new Html5Qrcode('reader');
          scannerRef.current = html5QrCode;

          const config = {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          };

          html5QrCode
            .start(
              { facingMode },
              config,
              (decodedText: string) => {
                processDecodedString(decodedText);
              },
              () => {
                // Scanning frame tick (silent)
              }
            )
            .then(() => {
              if (isMounted) setCameraActive(true);
            })
            .catch((err: any) => {
              console.warn('Camera scan initialization notice:', err);
              if (isMounted) {
                setCameraActive(false);
                setCameraError('Camera access unavailable or blocked. You can upload a photo of the sticker or search manually.');
              }
            });
        })
        .catch((err) => {
          if (isMounted) {
            setCameraError('Unable to load barcode reader engine.');
          }
        });
    }

    return () => {
      isMounted = false;
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {});
      }
    };
  }, [isOpen, activeTab, facingMode]);

  // Handle image file scan
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const tempScanner = new Html5Qrcode('temp-file-reader');
      const result = await tempScanner.scanFile(file, true);
      tempScanner.clear();
      processDecodedString(result);
    } catch (err: any) {
      setCameraError('No barcode or QR code recognized in this photo. Please try a clearer angle.');
    }
  };

  // Reset scanner for next item
  const handleScanAnother = () => {
    setScannedCode(null);
    setMatchedAsset(null);
  };

  // Manual query matches
  const manualMatches = manualQuery.trim()
    ? assets.filter(
        a =>
          a.assetTag.toLowerCase().includes(manualQuery.toLowerCase()) ||
          a.name.toLowerCase().includes(manualQuery.toLowerCase()) ||
          a.serialNumber.toLowerCase().includes(manualQuery.toLowerCase()) ||
          (a.imei1 && a.imei1.includes(manualQuery))
      )
    : [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white border border-[#f0e6de] rounded-3xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-[#fbf5ef]/90 border-b border-[#f0e6de] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-[#c28551]/30 flex items-center justify-center text-[#c28551] shadow-xs">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Hardware Tag Scanner</span>
                <span className="text-[10px] uppercase font-bold text-[#c28551] bg-[#faece2] px-2 py-0.5 rounded-full border border-[#c28551]/30">
                  QR & Barcode
                </span>
              </h2>
              <p className="text-xs text-slate-500">Scan physical asset tags, retail barcodes, or serial numbers</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/80 transition btn-press-sm cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Mode Selector */}
        <div className="px-6 pt-3 bg-white border-b border-[#f0e6de] flex items-center gap-3 text-xs font-semibold">
          <button
            onClick={() => { setActiveTab('camera'); handleScanAnother(); }}
            className={`py-2.5 border-b-2 flex items-center gap-1.5 transition btn-press-sm cursor-pointer ${
              activeTab === 'camera'
                ? 'border-[#c28551] text-[#c28551] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Live Camera</span>
          </button>

          <button
            onClick={() => { setActiveTab('upload'); handleScanAnother(); }}
            className={`py-2.5 border-b-2 flex items-center gap-1.5 transition btn-press-sm cursor-pointer ${
              activeTab === 'upload'
                ? 'border-[#c28551] text-[#c28551] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Photo</span>
          </button>

          <button
            onClick={() => { setActiveTab('manual'); handleScanAnother(); }}
            className={`py-2.5 border-b-2 flex items-center gap-1.5 transition btn-press-sm cursor-pointer ${
              activeTab === 'manual'
                ? 'border-[#c28551] text-[#c28551] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Search / Manual</span>
          </button>
        </div>

        {/* Main Body */}
        <div className="p-6 space-y-4">

          {/* TAB 1: LIVE CAMERA */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              <div className="relative w-full aspect-square max-w-[340px] mx-auto rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center">
                
                {/* HTML5 QR Code Mount Target */}
                <div id="reader" className="w-full h-full object-cover overflow-hidden" />

                {/* Laser Scanning Overlay Animation */}
                {cameraActive && !matchedAsset && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                    {/* Corner Target Markers */}
                    <div className="w-full h-full relative border border-white/20 rounded-2xl">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-[#c28551] rounded-tl-xl" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-[#c28551] rounded-tr-xl" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-[#c28551] rounded-bl-xl" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-[#c28551] rounded-br-xl" />
                      
                      {/* Laser Bar */}
                      <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-[#c28551] to-transparent animate-pulse shadow-lg shadow-[#c28551]/60 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                )}

                {/* Camera Fallback / Error Message */}
                {cameraError && (
                  <div className="absolute inset-0 p-6 bg-slate-900/90 text-white flex flex-col items-center justify-center text-center">
                    <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
                    <p className="text-xs text-slate-300 max-w-xs">{cameraError}</p>
                    <button
                      onClick={() => setActiveTab('manual')}
                      className="mt-4 px-4 py-2 rounded-xl bg-[#c28551] text-white text-xs font-semibold btn-press-sm"
                    >
                      Use Manual Tag Lookup
                    </button>
                  </div>
                )}
              </div>

              {/* Camera Switcher Controls */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Hold tag inside the frame</span>
                <button
                  type="button"
                  onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1.5 transition btn-press-sm cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#c28551]" />
                  <span>Switch Camera ({facingMode === 'environment' ? 'Back' : 'Front'})</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD PHOTO */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-12 px-6 rounded-3xl border-2 border-dashed border-[#ead7c7] bg-[#fdfbf9] hover:bg-[#faece2]/40 transition cursor-pointer text-center flex flex-col items-center justify-center space-y-2 btn-press"
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-[#c28551]/30 flex items-center justify-center text-[#c28551] shadow-xs">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-slate-800">
                  Select or take photo of asset sticker
                </div>
                <p className="text-[11px] text-slate-500 max-w-xs">
                  Supports QR code sticker images, barcode photos, or screenshot receipts (.png, .jpg, .webp)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Hidden file reader mount */}
              <div id="temp-file-reader" className="hidden" />
            </div>
          )}

          {/* TAB 3: MANUAL SEARCH */}
          {activeTab === 'manual' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  placeholder="Type tag (e.g. CLK-2026-001), serial, or IMEI..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#c28551]/20 focus:border-[#c28551] transition"
                />
              </div>

              {manualMatches.length > 0 && (
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
                  {manualMatches.map((asset) => (
                    <div
                      key={asset.id}
                      onClick={() => {
                        onSelectAsset(asset);
                        onClose();
                      }}
                      className="p-3 hover:bg-[#fbf5ef] transition cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          <img src={asset.images[0]} alt={asset.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{asset.name}</div>
                          <div className="text-[11px] font-mono text-[#c28551]">{asset.assetTag} • SN: {asset.serialNumber}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUCCESSFUL MATCH PRESENTATION CARD */}
          {matchedAsset && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#fbf5ef] to-white border border-[#c28551]/40 shadow-md space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Hardware Tag Verified</span>
                </span>
                <span className="font-mono text-xs font-bold text-[#c28551]">{matchedAsset.assetTag}</span>
              </div>

              <div className="flex items-start gap-3 pt-1">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-[#f0e6de] shrink-0">
                  <img src={matchedAsset.images[0]} alt={matchedAsset.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold text-slate-900 truncate">{matchedAsset.name}</h3>
                  <p className="text-[11px] text-slate-500 font-mono">SN: {matchedAsset.serialNumber}</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Custody: <span className="font-semibold">{matchedAsset.currentAssignment?.assignedToName || 'Ready in IT Lab'}</span>
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-2 border-t border-[#f0e6de] flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSelectAsset(matchedAsset);
                    onClose();
                  }}
                  className="flex-1 py-2 rounded-xl bg-[#1d2939] hover:bg-[#c28551] text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 btn-press-sm cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Dossier</span>
                </button>

                {onOpenAssign && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAssign(matchedAsset);
                      onClose();
                    }}
                    className="flex-1 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1.5 btn-press-sm cursor-pointer"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-[#c28551]" />
                    <span>Assign</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleScanAnother}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition btn-press-sm cursor-pointer"
                >
                  Scan Next
                </button>
              </div>
            </div>
          )}

          {/* SCANNED CODE WITH NO MATCH */}
          {scannedCode && !matchedAsset && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Code Scanned: "{scannedCode}"</span>
              </div>
              <p className="text-[11px] text-amber-800">
                No matching hardware device in inventory corresponds to this tag. Check if this item has been intaken yet.
              </p>
              <button
                type="button"
                onClick={handleScanAnother}
                className="mt-1 px-3 py-1.5 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-semibold btn-press-sm"
              >
                Scan Another Code
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
