'use client';

import React, { useState, useMemo } from 'react';
import { 
  X, 
  Printer, 
  Layers, 
  CheckSquare, 
  Square, 
  Settings2, 
  Eye, 
  Smartphone, 
  HelpCircle,
  Copy,
  Tag
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Asset } from '@/types/asset';

interface StickerSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
}

export type StickerLayout = 'avery-10' | 'avery-24' | 'roll';

export const StickerSheetModal: React.FC<StickerSheetModalProps> = ({
  isOpen,
  onClose,
  assets,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => assets.map(a => a.id));
  const [layout, setLayout] = useState<StickerLayout>('avery-10');
  const [copiesPerAsset, setCopiesPerAsset] = useState<1 | 2>(1);
  const [showHelpline, setShowHelpline] = useState(true);
  const [showIMEI, setShowIMEI] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  // Selected assets list (multiplied by copies)
  const printableAssets = useMemo(() => {
    const chosen = assets.filter(a => selectedIds.includes(a.id));
    if (copiesPerAsset === 1) return chosen;
    const doubled: Asset[] = [];
    chosen.forEach(a => {
      doubled.push(a);
      doubled.push(a);
    });
    return doubled;
  }, [assets, selectedIds, copiesPerAsset]);

  // Total pages calculation
  const labelsPerPage = layout === 'avery-10' ? 10 : layout === 'avery-24' ? 24 : 1;
  const totalPages = Math.ceil(printableAssets.length / labelsPerPage);

  const toggleSelectAll = () => {
    if (selectedIds.length === assets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(assets.map(a => a.id));
    }
  };

  const toggleItem = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredSelectionList = useMemo(() => {
    if (!searchFilter.trim()) return assets;
    const q = searchFilter.toLowerCase();
    return assets.filter(
      a =>
        a.assetTag.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.serialNumber.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
    );
  }, [assets, searchFilter]);

  if (!isOpen) return null;

  return (
    <>
      {/* SCREEN UI MODAL (Hidden when printing via CSS) */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200 print:hidden">
        <div 
          className="relative w-full max-w-4xl bg-white border border-[#f0e6de] rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 bg-[#fbf5ef]/90 border-b border-[#f0e6de] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white border border-[#c28551]/30 flex items-center justify-center text-[#c28551] shadow-xs">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Hardware Sticker Sheet Generator</span>
                  <span className="text-[10px] uppercase font-bold text-[#c28551] bg-[#faece2] px-2 py-0.5 rounded-full border border-[#c28551]/30">
                    A4 & Thermal
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Batch print physical QR stickers with cosmetics.lk branding, serials, and return helpline
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

          {/* Config Bar */}
          <div className="p-4 bg-[#fdfbf9] border-b border-[#f0e6de] flex flex-wrap items-center justify-between gap-4 text-xs shrink-0">
            
            {/* Format Selector */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Sheet Format:</span>
              <div className="flex items-center p-1 rounded-xl bg-white border border-[#ead7c7] shadow-2xs">
                <button
                  type="button"
                  onClick={() => setLayout('avery-10')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer btn-press-sm ${
                    layout === 'avery-10' ? 'bg-[#faece2] text-[#c28551] shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  2x5 Grid (10 Large Labels)
                </button>

                <button
                  type="button"
                  onClick={() => setLayout('avery-24')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer btn-press-sm ${
                    layout === 'avery-24' ? 'bg-[#faece2] text-[#c28551] shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  3x8 Grid (24 Mini Labels)
                </button>

                <button
                  type="button"
                  onClick={() => setLayout('roll')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer btn-press-sm ${
                    layout === 'roll' ? 'bg-[#faece2] text-[#c28551] shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Thermal Roll Tape
                </button>
              </div>
            </div>

            {/* Copies & Toggles */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={copiesPerAsset === 2}
                  onChange={(e) => setCopiesPerAsset(e.target.checked ? 2 : 1)}
                  className="rounded text-[#c28551] focus:ring-[#c28551]"
                />
                <span>2x Copies (Box + Device)</span>
              </label>

              <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showHelpline}
                  onChange={(e) => setShowHelpline(e.target.checked)}
                  className="rounded text-[#c28551] focus:ring-[#c28551]"
                />
                <span>Helpline Footer</span>
              </label>

              <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showIMEI}
                  onChange={(e) => setShowIMEI(e.target.checked)}
                  className="rounded text-[#c28551] focus:ring-[#c28551]"
                />
                <span>Include IMEIs</span>
              </label>
            </div>

          </div>

          {/* Dual Column Workspace: Left Selection Sidebar, Right WYSIWYG Print Preview */}
          <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
            
            {/* Left Column: Asset Selection Drawer */}
            <div className="w-full md:w-80 border-r border-[#f0e6de] bg-white flex flex-col shrink-0">
              <div className="p-3 border-b border-[#f0e6de] flex items-center justify-between text-xs bg-slate-50">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="font-bold text-[#c28551] hover:text-[#a66c3b] flex items-center gap-1 btn-press-sm"
                >
                  {selectedIds.length === assets.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  <span>{selectedIds.length === assets.length ? 'Deselect All' : 'Select All'} ({assets.length})</span>
                </button>

                <span className="text-[11px] text-slate-500 font-medium">
                  {selectedIds.length} Selected
                </span>
              </div>

              <div className="p-2 border-b border-[#f0e6de]">
                <input
                  type="text"
                  placeholder="Filter selection list..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:ring-1 focus:ring-[#c28551]"
                />
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1">
                {filteredSelectionList.map((asset) => {
                  const isChecked = selectedIds.includes(asset.id);
                  return (
                    <div
                      key={asset.id}
                      onClick={() => toggleItem(asset.id)}
                      className={`p-2.5 rounded-xl cursor-pointer transition flex items-center gap-2.5 text-xs ${
                        isChecked ? 'bg-[#fbf5ef] text-slate-900' : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded text-[#c28551] focus:ring-[#c28551]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-[#c28551] text-[11px]">{asset.assetTag}</span>
                          <span className="text-[10px] text-slate-400">{asset.category}</span>
                        </div>
                        <div className="font-semibold truncate text-[11px]">{asset.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">SN: {asset.serialNumber}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Live Sheet Preview */}
            <div className="flex-1 bg-slate-100/90 p-6 overflow-y-auto flex flex-col items-center">
              
              {/* Sheet Header Badge */}
              <div className="mb-4 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-[#c28551]" />
                <span>
                  {printableAssets.length} Labels Prepared • {totalPages} {totalPages === 1 ? 'A4 Sheet' : 'A4 Sheets'}
                </span>
              </div>

              {/* Virtual A4 Sheet Container */}
              <div className="w-full max-w-[620px] bg-white rounded-2xl shadow-xl border border-slate-200 p-5 space-y-4">
                
                {layout === 'avery-10' && (
                  <div className="grid grid-cols-2 gap-3.5">
                    {printableAssets.slice(0, 10).map((asset, idx) => (
                      <div 
                        key={idx} 
                        className="p-3.5 rounded-xl border border-slate-300 bg-white flex flex-col justify-between shadow-2xs relative overflow-hidden"
                      >
                        {/* Header bar */}
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 mb-2">
                          <span className="text-[9px] font-black tracking-wider text-[#c28551] uppercase">
                            COSMETICS.LK
                          </span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                            IT ASSET TAG
                          </span>
                        </div>

                        {/* Middle body: QR + Details */}
                        <div className="flex items-center gap-3">
                          <div className="p-1 rounded-lg border border-slate-200 bg-white shrink-0">
                            <QRCodeSVG
                              value={`https://inventory.cosmetics.lk/assets/${asset.assetTag}`}
                              size={64}
                              level="M"
                              includeMargin={false}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-xs font-extrabold text-slate-900 tracking-tight leading-none mb-1">
                              {asset.assetTag}
                            </div>
                            <div className="text-[10px] font-bold text-slate-800 truncate leading-snug">
                              {asset.name}
                            </div>
                            <div className="text-[9px] text-slate-500 font-mono truncate">
                              SN: {asset.serialNumber}
                            </div>
                            {showIMEI && asset.hasSim && asset.imei1 && (
                              <div className="text-[8px] text-[#c28551] font-mono truncate">
                                IMEI: {asset.imei1}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Footer */}
                        {showHelpline && (
                          <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[7px] text-slate-400 font-semibold tracking-tight">
                            <span>PROPERTY OF COSMETICS.LK</span>
                            <span>HELPLINE: +94 11 234 5678</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {layout === 'avery-24' && (
                  <div className="grid grid-cols-3 gap-2">
                    {printableAssets.slice(0, 24).map((asset, idx) => (
                      <div 
                        key={idx} 
                        className="p-2 rounded-lg border border-slate-300 bg-white flex items-center gap-2 shadow-2xs"
                      >
                        <div className="shrink-0 p-0.5 border border-slate-100 rounded">
                          <QRCodeSVG
                            value={`https://inventory.cosmetics.lk/assets/${asset.assetTag}`}
                            size={42}
                            level="L"
                          />
                        </div>
                        <div className="flex-1 min-w-0 leading-tight">
                          <div className="text-[7px] font-black text-[#c28551] uppercase">cosmetics.lk</div>
                          <div className="font-mono text-[9px] font-bold text-slate-900 truncate">{asset.assetTag}</div>
                          <div className="text-[8px] font-semibold text-slate-700 truncate">{asset.name}</div>
                          <div className="text-[7px] font-mono text-slate-400 truncate">SN: {asset.serialNumber}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {layout === 'roll' && (
                  <div className="flex flex-col items-center gap-3">
                    {printableAssets.slice(0, 4).map((asset, idx) => (
                      <div 
                        key={idx} 
                        className="w-full max-w-[280px] p-3 rounded-xl border border-slate-300 bg-white shadow-2xs flex items-center gap-3"
                      >
                        <QRCodeSVG
                          value={`https://inventory.cosmetics.lk/assets/${asset.assetTag}`}
                          size={54}
                          level="M"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-[8px] font-black text-[#c28551]">COSMETICS.LK IT INFRASTRUCTURE</div>
                          <div className="font-mono text-xs font-bold text-slate-900">{asset.assetTag}</div>
                          <div className="text-[10px] font-semibold text-slate-700 truncate">{asset.name}</div>
                          <div className="text-[8px] font-mono text-slate-400 truncate">SN: {asset.serialNumber}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {printableAssets.length > labelsPerPage && (
                  <div className="text-center py-2 text-[11px] text-slate-400 italic">
                    + {printableAssets.length - labelsPerPage} more labels will flow across subsequent A4 pages during printing
                  </div>
                )}

              </div>
            </div>

          </div>

          {/* Footer Controls */}
          <div className="p-4 bg-white border-t border-[#f0e6de] flex items-center justify-between shrink-0">
            <div className="text-xs text-slate-500">
              Ready to print <span className="font-bold text-slate-900">{printableAssets.length} physical stickers</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition btn-press-sm cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handlePrint}
                disabled={printableAssets.length === 0}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#c28551] to-[#dfae85] hover:from-[#b07440] hover:to-[#cb8e5c] text-white text-xs font-semibold shadow-md shadow-[#c28551]/20 transition flex items-center gap-2 cursor-pointer btn-press disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                <span>Print Sticker Sheet Now</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* DEDICATED PRINT CONTAINER (Visible ONLY when window.print() is called) */}
      <div className="hidden print:block print-area">
        {layout === 'avery-10' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', padding: '8px' }}>
            {printableAssets.map((asset, idx) => (
              <div 
                key={idx} 
                style={{ 
                  border: '1.5px solid #111', 
                  borderRadius: '8px', 
                  padding: '12px', 
                  breakInside: 'avoid',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '180px',
                  boxSizing: 'border-box',
                  background: 'white'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '900', color: '#000', letterSpacing: '0.05em' }}>
                    COSMETICS.LK
                  </span>
                  <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#666' }}>
                    IT HARDWARE ASSET
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ border: '1px solid #000', padding: '3px', borderRadius: '4px', background: 'white' }}>
                    <QRCodeSVG
                      value={`https://inventory.cosmetics.lk/assets/${asset.assetTag}`}
                      size={80}
                      level="M"
                      includeMargin={false}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '15px', fontWeight: '900', color: '#000', marginBottom: '3px' }}>
                      {asset.assetTag}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#111', lineHeight: '1.2' }}>
                      {asset.name}
                    </div>
                    <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#444', marginTop: '2px' }}>
                      SN: {asset.serialNumber}
                    </div>
                    {showIMEI && asset.hasSim && asset.imei1 && (
                      <div style={{ fontSize: '9px', fontFamily: 'monospace', color: '#333' }}>
                        IMEI: {asset.imei1}
                      </div>
                    )}
                  </div>
                </div>

                {showHelpline && (
                  <div style={{ marginTop: '6px', paddingTop: '4px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#555', fontWeight: '600' }}>
                    <span>PROPERTY OF COSMETICS.LK</span>
                    <span>HELPLINE: +94 11 234 5678</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {layout === 'avery-24' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '6px' }}>
            {printableAssets.map((asset, idx) => (
              <div 
                key={idx} 
                style={{ 
                  border: '1.5px solid #222', 
                  borderRadius: '6px', 
                  padding: '8px', 
                  breakInside: 'avoid',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  height: '92px',
                  boxSizing: 'border-box',
                  background: 'white'
                }}
              >
                <div style={{ border: '1px solid #333', padding: '2px', borderRadius: '3px', background: 'white' }}>
                  <QRCodeSVG
                    value={`https://inventory.cosmetics.lk/assets/${asset.assetTag}`}
                    size={52}
                    level="L"
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0, lineHeight: '1.15' }}>
                  <div style={{ fontSize: '8px', fontWeight: '900', color: '#000' }}>COSMETICS.LK</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold', color: '#000' }}>{asset.assetTag}</div>
                  <div style={{ fontSize: '9px', fontWeight: '600', color: '#222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{asset.name}</div>
                  <div style={{ fontSize: '8px', fontFamily: 'monospace', color: '#555' }}>SN: {asset.serialNumber}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {layout === 'roll' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px' }}>
            {printableAssets.map((asset, idx) => (
              <div 
                key={idx} 
                style={{ 
                  border: '2px solid #000', 
                  borderRadius: '8px', 
                  padding: '10px', 
                  breakInside: 'avoid',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '320px',
                  margin: '0 auto',
                  background: 'white'
                }}
              >
                <QRCodeSVG
                  value={`https://inventory.cosmetics.lk/assets/${asset.assetTag}`}
                  size={70}
                  level="M"
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '9px', fontWeight: '900' }}>COSMETICS.LK IT INFRASTRUCTURE</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 'bold' }}>{asset.assetTag}</div>
                  <div style={{ fontSize: '10px', fontWeight: '600' }}>{asset.name}</div>
                  <div style={{ fontSize: '9px', fontFamily: 'monospace', color: '#444' }}>SN: {asset.serialNumber}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
