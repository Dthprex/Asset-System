'use client';

import React, { useState } from 'react';
import { 
  Laptop, 
  Smartphone, 
  Tablet, 
  Camera, 
  Calendar, 
  MapPin, 
  Tag, 
  ShieldCheck, 
  Clock, 
  UserCheck, 
  Building2, 
  AlertTriangle, 
  History, 
  ArrowRightLeft, 
  RotateCcw, 
  Copy, 
  Check, 
  Eye, 
  QrCode,
  Sparkles
} from 'lucide-react';
import { Asset } from '@/types/asset';
import { formatLKR, formatDate, getWarrantyInfo, calculateDuration } from '@/lib/utils';

interface AssetCardProps {
  asset: Asset;
  onViewDetails: (asset: Asset) => void;
  onAssign: (asset: Asset) => void;
  onReturn: (asset: Asset) => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  onViewDetails,
  onAssign,
  onReturn,
}) => {
  const [copiedTag, setCopiedTag] = useState(false);
  const warranty = getWarrantyInfo(asset.warrantyEndDate);

  const handleCopyTag = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(asset.assetTag);
    setCopiedTag(true);
    setTimeout(() => setCopiedTag(false), 2000);
  };

  // Determine custody styling
  const isBorrowed = asset.status === 'BORROWED_TEMPORARY';
  const isAvailable = asset.status === 'AVAILABLE';
  const isRepair = asset.status === 'UNDER_REPAIR';
  const isPermanent = asset.status === 'ALLOCATED_PERMANENT';

  // Condition color
  const getConditionBadge = (condition: string) => {
    if (condition.includes('New')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (condition.includes('Good') || condition.includes('Like New')) return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    if (condition.includes('Fair')) return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  };

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-pink-500/40 hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300 overflow-hidden backdrop-blur-md">
      
      {/* Top Media & Tags */}
      <div className="relative">
        <div className="h-44 w-full bg-slate-950 overflow-hidden relative">
          <img
            src={asset.images[0] || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80'}
            alt={asset.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent"></div>

          {/* Category Tag */}
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-950/80 text-pink-300 border border-pink-500/30 backdrop-blur-md shadow-sm">
              {asset.category}
            </span>
          </div>

          {/* Condition Tag */}
          <div className="absolute top-3 right-3">
            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-lg border backdrop-blur-md ${getConditionBadge(asset.condition)}`}>
              {asset.condition}
            </span>
          </div>

          {/* Asset Tag & Copy */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
            <button
              onClick={handleCopyTag}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-700/80 text-slate-200 text-xs font-mono hover:bg-slate-800 transition"
              title="Click to copy Asset Tag"
            >
              <Tag className="w-3 h-3 text-pink-400" />
              <span>{asset.assetTag}</span>
              {copiedTag ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
            </button>

            <span className="text-[11px] text-slate-300 font-medium">
              SN: <span className="font-mono text-slate-400">{asset.serialNumber}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Body Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
        
        {/* Device Title & Brand */}
        <div>
          <div className="text-[11px] font-medium text-pink-400/90 uppercase tracking-wider">
            {asset.brand} {asset.modelNumber ? `• ${asset.modelNumber}` : ''}
          </div>
          <h3 
            onClick={() => onViewDetails(asset)}
            className="text-base font-bold text-white group-hover:text-pink-300 transition cursor-pointer line-clamp-1"
          >
            {asset.name}
          </h3>
        </div>

        {/* Dual SIM IMEIs if present */}
        {asset.hasSim && (
          <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] space-y-1">
            <div className="flex items-center gap-1 text-slate-400 font-semibold">
              <Smartphone className="w-3 h-3 text-indigo-400" />
              <span>Cellular Device (Dual SIM Tracking):</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-[10px]">
              <div className="truncate">SIM 1: {asset.imei1 || 'Unspecified'}</div>
              <div className="truncate">SIM 2: {asset.imei2 || 'Unspecified'}</div>
            </div>
          </div>
        )}

        {/* Current Custody / Assignment Card */}
        <div className={`p-3 rounded-xl border text-xs transition ${
          isBorrowed
            ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
            : isRepair
            ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
            : isPermanent
            ? 'bg-blue-950/30 border-blue-500/40 text-blue-200'
            : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
        }`}>
          <div className="flex items-center justify-between mb-1.5 font-semibold">
            <div className="flex items-center gap-1.5">
              {isBorrowed && <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />}
              {isRepair && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
              {isPermanent && <Building2 className="w-3.5 h-3.5 text-blue-400" />}
              {isAvailable && <UserCheck className="w-3.5 h-3.5 text-emerald-400" />}
              
              <span>
                {isBorrowed && 'Temporary Loan (Borrowed)'}
                {isRepair && 'Under Repair / Service Center'}
                {isPermanent && 'Permanent Deployment'}
                {isAvailable && 'Available in IT Inventory'}
              </span>
            </div>

            {/* Custody Duration */}
            {asset.currentAssignment && (
              <span className="text-[10px] opacity-80 font-mono">
                {calculateDuration(asset.currentAssignment.assignedDate)}
              </span>
            )}
          </div>

          {asset.currentAssignment ? (
            <div className="space-y-1 text-[11px] opacity-90">
              <div className="font-semibold text-white truncate">
                {asset.currentAssignment.assignedToName}
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="truncate">{asset.currentAssignment.locationOrBranch}</span>
                {asset.currentAssignment.expectedReturnDate && (
                  <span className="text-amber-400 font-semibold font-mono text-[10px]">
                    Due: {formatDate(asset.currentAssignment.expectedReturnDate)}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400">
              Stored in IT Staging Area. Ready for immediate deployment.
            </div>
          )}
        </div>

        {/* Financial & Warranty Info */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800/80">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wide">Purchase Price</div>
            <div className="font-bold text-slate-100 text-sm">{formatLKR(asset.purchaseAmount)}</div>
            <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
              <MapPin className="w-2.5 h-2.5 text-pink-400" />
              <span>{asset.purchaseLocation}</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wide">Warranty</div>
            <div className="mt-0.5">
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${warranty.badgeClass}`}>
                {warranty.statusText}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Until: {formatDate(asset.warrantyEndDate)}
            </div>
          </div>
        </div>

      </div>

      {/* Action Footer */}
      <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <button
          onClick={() => onViewDetails(asset)}
          className="flex-1 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-800 transition flex items-center justify-center gap-1.5"
        >
          <History className="w-3.5 h-3.5 text-pink-400" />
          <span>Timeline</span>
        </button>

        {asset.currentAssignment ? (
          <button
            onClick={() => onReturn(asset)}
            className="flex-1 py-1.5 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Return</span>
          </button>
        ) : (
          <button
            onClick={() => onAssign(asset)}
            className="flex-1 py-1.5 px-3 rounded-lg bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 border border-pink-500/40 text-xs font-semibold transition flex items-center justify-center gap-1.5"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Assign / Loan</span>
          </button>
        )}
      </div>

    </div>
  );
};
