'use client';

import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';
import { AssetDetailDrawer } from '@/components/AssetDetailDrawer';
import { NewAssetWizardModal } from '@/components/NewAssetWizardModal';
import { AssignModal } from '@/components/AssignModal';
import { ReturnChecklistModal } from '@/components/ReturnChecklistModal';
import { BarcodeScannerModal } from '@/components/BarcodeScannerModal';
import { StickerSheetModal } from '@/components/StickerSheetModal';
import { HandoverVoucherModal } from '@/components/HandoverVoucherModal';
import { NewRepairTicketModal } from '@/components/NewRepairTicketModal';
import { Asset, Branch, Department, CurrentAssignment, RepairTicket } from '@/types/asset';
import { CheckCircle2 } from 'lucide-react';

interface AppContextType {
  assets: Asset[];
  branches: Branch[];
  departments: Department[];
  stats: any;
  loading: boolean;
  refreshing: boolean;
  refreshData: () => Promise<void>;
  openDetail: (asset: Asset) => void;
  openAssign: (asset: Asset) => void;
  openReturn: (asset: Asset) => void;
  openNewIntake: () => void;
  openScanner: () => void;
  openStickerSheet: (customAssets?: Asset[]) => void;
  openHandoverVoucher: (asset: Asset, assignment?: CurrentAssignment) => void;
  openNewRepair: (asset?: Asset) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppShell');
  return context;
};

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<any>({
    totalAssets: 0,
    totalValueLKR: 0,
    availableCount: 0,
    allocatedCount: 0,
    borrowedCount: 0,
    repairCount: 0,
    expiringWarrantyCount: 0,
    expiredWarrantyCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [activeAsset, setActiveAsset] = useState<Asset | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNewWizardOpen, setIsNewWizardOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isStickerOpen, setIsStickerOpen] = useState(false);
  const [stickerAssets, setStickerAssets] = useState<Asset[]>([]);
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const [voucherAsset, setVoucherAsset] = useState<Asset | null>(null);
  const [voucherAssignment, setVoucherAssignment] = useState<CurrentAssignment | null>(null);
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [repairAsset, setRepairAsset] = useState<Asset | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [assetsRes, statsRes, branchesRes] = await Promise.all([
        fetch('/api/assets'),
        fetch('/api/stats'),
        fetch('/api/branches'),
      ]);

      const [assetsData, statsData, branchesData] = await Promise.all([
        assetsRes.json(),
        statsRes.json(),
        branchesRes.json(),
      ]);

      if (assetsData.success) setAssets(assetsData.data || []);
      if (statsData.success) setStats(statsData.data);
      if (branchesData.success) {
        setBranches(branchesData.branches || []);
        setDepartments(branchesData.departments || []);
      }
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openDetail = (asset: Asset) => {
    setActiveAsset(asset);
    setIsDrawerOpen(true);
  };

  const openAssign = (asset: Asset) => {
    setActiveAsset(asset);
    setIsAssignOpen(true);
  };

  const openReturn = (asset: Asset) => {
    setActiveAsset(asset);
    setIsReturnOpen(true);
  };

  const openNewIntake = () => {
    setIsNewWizardOpen(true);
  };

  const openScanner = () => {
    setIsScannerOpen(true);
  };

  const openStickerSheet = (customAssets?: Asset[]) => {
    setStickerAssets(customAssets && customAssets.length > 0 ? customAssets : assets);
    setIsStickerOpen(true);
  };

  const openHandoverVoucher = (asset: Asset, assignment?: CurrentAssignment) => {
    setVoucherAsset(asset);
    setVoucherAssignment(assignment || null);
    setIsVoucherOpen(true);
  };

  const openNewRepair = (asset?: Asset) => {
    setRepairAsset(asset || null);
    setIsRepairModalOpen(true);
  };

  // Global ⌘B / Ctrl+B Barcode Scanner Keyboard Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsScannerOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAssetCreated = (newAsset: Asset) => {
    showToast(`Registered ${newAsset.name} (${newAsset.assetTag}) into inventory!`);
    loadData();
  };

  const handleAssetAssigned = (updated: Asset) => {
    showToast(`Assigned ${updated.name} to ${updated.currentAssignment?.assignedToName}!`);
    loadData();
    openHandoverVoucher(updated);
  };

  const handleAssetReturned = (updated: Asset) => {
    showToast(`Returned ${updated.name} to Central IT Lab!`);
    loadData();
  };

  return (
    <AppContext.Provider
      value={{
        assets,
        branches,
        departments,
        stats,
        loading,
        refreshing,
        refreshData: loadData,
        openDetail,
        openAssign,
        openReturn,
        openNewIntake,
        openScanner,
        openStickerSheet,
        openHandoverVoucher,
        openNewRepair,
        searchQuery,
        setSearchQuery,
        showToast,
      }}
    >
      <div className="min-h-screen bg-[#fbfcfe] text-slate-800 flex">
        
        {/* Left Sidebar */}
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeLoanCount={stats.borrowedCount}
          expiringWarrantyCount={stats.expiringWarrantyCount}
          totalAssetsCount={stats.totalAssets}
        />

        {/* Main Workspace */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
          
          {/* Top Sticky Header */}
          <TopNav
            onOpenNewAssetModal={openNewIntake}
            onOpenScanner={openScanner}
            onRefresh={loadData}
            isRefreshing={refreshing}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sidebarCollapsed={sidebarCollapsed}
          />

          {/* Toast Notification */}
          {toastMessage && (
            <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white font-medium text-xs shadow-xl flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-300">
              <CheckCircle2 className="w-5 h-5 text-[#c28551] shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Page View Children */}
          <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-200/80 bg-white py-5 px-8 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#c28551]">cosmetics.lk</span>
              <span>• IT Infrastructure & Fleet Custody Portal</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Colombo Flagship • Kandy City Centre • Nawala HQ • OGF • Negombo • Kelaniya Warehouse
            </div>
          </footer>

        </div>

        {/* Modals & Slide-over Drawer */}
        <AssetDetailDrawer
          asset={activeAsset}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onAssign={openAssign}
          onReturn={openReturn}
          onOpenVoucher={(asset) => openHandoverVoucher(asset)}
          onDispatchRepair={(asset) => openNewRepair(asset)}
        />

        <NewRepairTicketModal
          isOpen={isRepairModalOpen}
          onClose={() => {
            setIsRepairModalOpen(false);
            setRepairAsset(null);
          }}
          onSuccess={(ticket) => {
            showToast(`RMA #${ticket.rmaNumber} dispatched for ${ticket.assetName}!`);
            loadData();
          }}
          preselectedAsset={repairAsset}
          assets={assets}
        />

        <NewAssetWizardModal
          isOpen={isNewWizardOpen}
          onClose={() => setIsNewWizardOpen(false)}
          onSuccess={handleAssetCreated}
          branches={branches}
          departments={departments}
        />

        <AssignModal
          asset={activeAsset}
          isOpen={isAssignOpen}
          onClose={() => setIsAssignOpen(false)}
          onSuccess={handleAssetAssigned}
          branches={branches}
          departments={departments}
        />

        <ReturnChecklistModal
          asset={activeAsset}
          isOpen={isReturnOpen}
          onClose={() => setIsReturnOpen(false)}
          onSuccess={handleAssetReturned}
        />

        <BarcodeScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          assets={assets}
          onSelectAsset={(asset) => openDetail(asset)}
          onOpenAssign={(asset) => openAssign(asset)}
          onOpenReturn={(asset) => openReturn(asset)}
        />

        <StickerSheetModal
          isOpen={isStickerOpen}
          onClose={() => setIsStickerOpen(false)}
          assets={stickerAssets.length > 0 ? stickerAssets : assets}
        />

        <HandoverVoucherModal
          isOpen={isVoucherOpen}
          onClose={() => setIsVoucherOpen(false)}
          asset={voucherAsset}
          assignment={voucherAssignment}
        />

      </div>
    </AppContext.Provider>
  );
};
