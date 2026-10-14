'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Laptop, 
  Store, 
  ClockAlert, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeLoanCount?: number;
  expiringWarrantyCount?: number;
  totalAssetsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  activeLoanCount = 0,
  expiringWarrantyCount = 0,
  totalAssetsCount = 0,
}) => {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      active: pathname === '/',
    },
    {
      label: 'Fleet Inventory',
      href: '/inventory',
      icon: Laptop,
      badge: totalAssetsCount > 0 ? String(totalAssetsCount) : undefined,
      active: pathname === '/inventory',
    },
    {
      label: 'Showrooms & Branches',
      href: '/branches',
      icon: Store,
      active: pathname === '/branches',
    },
    {
      label: 'Temporary Loans',
      href: '/loans',
      icon: ClockAlert,
      badge: activeLoanCount > 0 ? String(activeLoanCount) : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      active: pathname === '/loans',
    },
    {
      label: 'Warranties & Repairs',
      href: '/warranty',
      icon: ShieldCheck,
      badge: expiringWarrantyCount > 0 ? String(expiringWarrantyCount) : undefined,
      badgeColor: 'bg-[#faece2] text-[#c28551] border-[#ead7c7]',
      active: pathname === '/warranty',
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen bg-white border-r border-[#f0e6de] transition-all duration-300 flex flex-col justify-between ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header with Official cosmetics.lk Logo */}
      <div>
        <div className="h-20 flex items-center justify-between px-4 border-b border-[#f4ebe4]">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            {!isCollapsed ? (
              <div className="flex flex-col">
                <img
                  src="/cosmetics-logo.png"
                  alt="cosmetics.lk"
                  className="h-8 w-auto object-contain"
                />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#c28551] mt-0.5 ml-0.5">
                  IT Fleet Portal
                </span>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-[#faece2] border border-[#ead7c7] flex items-center justify-center text-[#c28551] shrink-0 font-bold text-sm">
                C
              </div>
            )}
          </Link>

          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-[#fbf5ef] transition cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  item.active
                    ? 'bg-[#fbf5ef] text-[#c28551] border border-[#ead7c7] shadow-xs'
                    : 'text-slate-600 hover:text-[#1d2939] hover:bg-[#faf7f3]'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${item.active ? 'text-[#c28551]' : 'text-slate-400'}`} />
                
                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${item.badgeColor || 'bg-[#faece2] text-[#c28551] border-[#ead7c7]'}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Box */}
      <div className="p-3 border-t border-[#f4ebe4]">
        {!isCollapsed ? (
          <div className="p-3 rounded-2xl bg-[#fbf5ef]/80 border border-[#ead7c7] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Live Inventory</span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Connected
              </span>
            </div>
            <p className="text-[11px] text-[#1d2939] leading-snug font-medium">
              Head Office Nawala • 8 Showrooms synced
            </p>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="System Online"></span>
          </div>
        )}
      </div>
    </aside>
  );
};
