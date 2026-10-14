'use client';

import React from 'react';
import { 
  History, 
  ArrowRightLeft, 
  RotateCcw, 
  Building2, 
  Clock, 
  Smartphone, 
  Tag, 
  Eye, 
  MapPin 
} from 'lucide-react';
import { Asset } from '@/types/asset';
import { formatLKR, formatDate, getWarrantyInfo, calculateDuration } from '@/lib/utils';

interface AssetTableViewProps {
  assets: Asset[];
  onViewDetails: (asset: Asset) => void;
  onAssign: (asset: Asset) => void;
  onReturn: (asset: Asset) => void;
}

export const AssetTableView: React.FC<AssetTableViewProps> = ({
  assets,
  onViewDetails,
  onAssign,
  onReturn,
}) => {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
      <table className="w-full text-left text-xs text-slate-300">
        <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
          <tr>
            <th className="py-3.5 px-4 font-semibold">Asset Tag & Category</th>
            <th className="py-3.5 px-4 font-semibold">Device & Specs</th>
            <th className="py-3.5 px-4 font-semibold">Serial / Dual IMEI</th>
            <th className="py-3.5 px-4 font-semibold">Current Custody / Location</th>
            <th className="py-3.5 px-4 font-semibold">Purchase & Price (LKR)</th>
            <th className="py-3.5 px-4 font-semibold">Warranty</th>
            <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/80 font-normal">
          {assets.map((asset) => {
            const warranty = getWarrantyInfo(asset.warrantyEndDate);
            const isBorrowed = asset.status === 'BORROWED_TEMPORARY';
            const isRepair = asset.status === 'UNDER_REPAIR';
            const isPermanent = asset.status === 'ALLOCATED_PERMANENT';

            return (
              <tr 
                key={asset.id} 
                className="hover:bg-slate-800/40 transition group"
              >
                {/* Asset Tag & Category */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="font-mono font-bold text-pink-400">{asset.assetTag}</div>
                  <div className="text-[11px] text-slate-400">{asset.category}</div>
                </td>

                {/* Device & Specs */}
                <td className="py-3.5 px-4 max-w-xs">
                  <div 
                    onClick={() => onViewDetails(asset)}
                    className="font-bold text-white group-hover:text-pink-300 transition cursor-pointer truncate"
                  >
                    {asset.name}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {asset.brand} {asset.modelNumber ? `• ${asset.modelNumber}` : ''}
                  </div>
                </td>

                {/* Serial / Dual IMEI */}
                <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px]">
                  <div className="text-slate-300">SN: {asset.serialNumber}</div>
                  {asset.hasSim && (
                    <div className="text-[10px] text-indigo-400">
                      IMEI: {asset.imei1?.slice(0, 8)}...
                    </div>
                  )}
                </td>

                {/* Current Custody */}
                <td className="py-3.5 px-4 max-w-xs">
                  {asset.currentAssignment ? (
                    <div>
                      <div className="font-semibold text-white truncate flex items-center gap-1.5">
                        {isBorrowed && <Clock className="w-3 h-3 text-amber-400" />}
                        {isRepair && <span className="w-2 h-2 rounded-full bg-rose-500"></span>}
                        {isPermanent && <Building2 className="w-3 h-3 text-blue-400" />}
                        <span className="truncate">{asset.currentAssignment.assignedToName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {asset.currentAssignment.locationOrBranch}
                      </div>
                      {asset.currentAssignment.expectedReturnDate && (
                        <div className="text-[10px] text-amber-400 font-semibold font-mono">
                          Due: {formatDate(asset.currentAssignment.expectedReturnDate)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-emerald-400 text-[11px] font-medium">Ready in IT Lab</span>
                  )}
                </td>

                {/* Purchase & Price */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="font-bold text-white">{formatLKR(asset.purchaseAmount)}</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 text-pink-400" />
                    <span className="truncate">{asset.purchaseLocation}</span>
                  </div>
                </td>

                {/* Warranty */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${warranty.badgeClass}`}>
                    {warranty.statusText}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {formatDate(asset.warrantyEndDate)}
                  </div>
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onViewDetails(asset)}
                      title="View Timeline & Audit Trail"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    >
                      <History className="w-3.5 h-3.5 text-pink-400" />
                    </button>

                    {asset.currentAssignment ? (
                      <button
                        onClick={() => onReturn(asset)}
                        title="Return and Inspect Damages"
                        className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onAssign(asset)}
                        title="Assign or Loan"
                        className="p-1.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 transition"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
