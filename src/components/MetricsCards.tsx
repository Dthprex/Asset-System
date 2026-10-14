'use client';

import React from 'react';
import { 
  Laptop, 
  Coins, 
  Building2, 
  ClockAlert, 
  Wrench, 
  ShieldAlert, 
  CheckCircle2, 
  Layers
} from 'lucide-react';
import { formatLKR } from '@/lib/utils';

interface MetricsCardsProps {
  stats: {
    totalAssets: number;
    totalValueLKR: number;
    availableCount: number;
    allocatedCount: number;
    borrowedCount: number;
    repairCount: number;
    expiringWarrantyCount: number;
    expiredWarrantyCount: number;
    totalBranches: number;
    totalDepartments: number;
  };
  onSelectFilterStatus: (status: string) => void;
  selectedStatus: string;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  stats,
  onSelectFilterStatus,
  selectedStatus,
}) => {
  const cards = [
    {
      id: 'ALL',
      title: 'Total Fleet Value',
      value: formatLKR(stats.totalValueLKR),
      subtext: `${stats.totalAssets} active company assets`,
      icon: Coins,
      gradient: 'from-pink-500/20 via-rose-500/10 to-transparent',
      borderColor: 'border-pink-500/30',
      iconColor: 'text-pink-400',
      statusTarget: 'ALL',
    },
    {
      id: 'AVAILABLE',
      title: 'Ready in IT Lab',
      value: stats.availableCount,
      subtext: 'In stock & unassigned',
      icon: CheckCircle2,
      gradient: 'from-emerald-500/20 via-emerald-500/10 to-transparent',
      borderColor: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
      statusTarget: 'AVAILABLE',
    },
    {
      id: 'ALLOCATED_PERMANENT',
      title: 'Permanent Deployments',
      value: stats.allocatedCount,
      subtext: `${stats.totalBranches} branches & ${stats.totalDepartments} depts`,
      icon: Building2,
      gradient: 'from-blue-500/20 via-indigo-500/10 to-transparent',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-400',
      statusTarget: 'ALLOCATED_PERMANENT',
    },
    {
      id: 'BORROWED_TEMPORARY',
      title: 'Temporary Loans',
      value: stats.borrowedCount,
      subtext: 'Shoots & short-term tasks',
      icon: ClockAlert,
      gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
      borderColor: 'border-amber-500/30',
      iconColor: 'text-amber-400',
      statusTarget: 'BORROWED_TEMPORARY',
    },
    {
      id: 'UNDER_REPAIR',
      title: 'Under Repair / Damaged',
      value: stats.repairCount,
      subtext: 'Service center tickets',
      icon: Wrench,
      gradient: 'from-rose-500/20 via-red-500/10 to-transparent',
      borderColor: 'border-rose-500/30',
      iconColor: 'text-rose-400',
      statusTarget: 'UNDER_REPAIR',
    },
    {
      id: 'WARRANTY_ALERT',
      title: 'Warranty Status',
      value: `${stats.expiringWarrantyCount} Expiring`,
      subtext: `${stats.expiredWarrantyCount} expired warranties`,
      icon: ShieldAlert,
      gradient: 'from-purple-500/20 via-indigo-500/10 to-transparent',
      borderColor: 'border-purple-500/30',
      iconColor: 'text-purple-400',
      statusTarget: 'ALL',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = selectedStatus === card.statusTarget && card.statusTarget !== 'ALL';

        return (
          <button
            key={card.id}
            onClick={() => onSelectFilterStatus(card.statusTarget)}
            className={`text-left p-4 rounded-2xl bg-slate-900/60 backdrop-blur-md border transition-all duration-200 group relative overflow-hidden flex flex-col justify-between ${
              isSelected 
                ? 'border-pink-500 shadow-lg shadow-pink-500/20 bg-slate-800/80 ring-1 ring-pink-500' 
                : `${card.borderColor} hover:border-slate-600 hover:bg-slate-900/90`
            }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-50 group-hover:opacity-80 transition duration-300 pointer-events-none`}></div>

            <div className="relative z-10 flex items-center justify-between w-full mb-3">
              <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-200 transition">
                {card.title}
              </span>
              <div className={`p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 ${card.iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="relative z-10">
              <div className="text-xl font-bold tracking-tight text-white mb-0.5">
                {card.value}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {card.subtext}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
