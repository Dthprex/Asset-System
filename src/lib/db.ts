import fs from 'fs/promises';
import path from 'path';
import { Asset, CurrentAssignment, CustodyRecord, DatabaseSchema, Branch, Department, RepairTicket } from '@/types/asset';
import { calculateDuration } from './utils';

const DATA_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'database.json');

export async function readDatabase(): Promise<DatabaseSchema> {
  try {
    const raw = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    const data = JSON.parse(raw) as DatabaseSchema;
    if (!data.repairTickets) {
      data.repairTickets = [];
    }
    return data;
  } catch (error) {
    console.error('Failed to read database file:', error);
    return {
      branches: [],
      departments: [],
      assets: [],
      custodyHistory: [],
      repairTickets: [],
    };
  }
}

export async function writeDatabase(data: DatabaseSchema): Promise<void> {
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getAllAssets(): Promise<Asset[]> {
  const db = await readDatabase();
  return db.assets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getAssetById(id: string): Promise<{ asset: Asset; history: CustodyRecord[] } | null> {
  const db = await readDatabase();
  const asset = db.assets.find((a) => a.id === id || a.assetTag.toLowerCase() === id.toLowerCase());
  if (!asset) return null;

  const history = db.custodyHistory
    .filter((h) => h.assetId === asset.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return { asset, history };
}

export async function createAsset(newAssetData: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>): Promise<Asset> {
  const db = await readDatabase();
  
  // Generate unique ID
  const newNum = db.assets.length + 1001;
  const newId = `AST-${newNum}`;
  const now = new Date().toISOString();
  
  const newAsset: Asset = {
    ...newAssetData,
    id: newId,
    createdAt: now,
    updatedAt: now,
  };

  db.assets.unshift(newAsset);

  // Record initial intake in custody history
  const intakeHistory: CustodyRecord = {
    id: `HIS-${Date.now().toString().slice(-6)}`,
    assetId: newId,
    action: 'PURCHASED',
    date: newAsset.purchaseDate || now.slice(0, 10),
    performedBy: 'IT Asset Admin',
    previousHolder: `Vendor (${newAsset.purchaseLocation || 'Supplier'})`,
    newHolder: 'cosmetics.lk IT Central Inventory',
    assignmentType: 'INVENTORY_INTAKE',
    conditionUponReturn: newAsset.condition,
    notes: `Initial intake purchase at ${newAsset.purchaseLocation || 'Vendor'} for Rs. ${newAsset.purchaseAmount.toLocaleString()} LKR.`,
  };

  db.custodyHistory.unshift(intakeHistory);

  // If initial assignment was provided upon intake, record it too
  if (newAsset.currentAssignment) {
    const assignHistory: CustodyRecord = {
      id: `HIS-${(Date.now() + 1).toString().slice(-6)}`,
      assetId: newId,
      action: 'ASSIGNED',
      date: newAsset.currentAssignment.assignedDate || now.slice(0, 10),
      performedBy: 'IT Asset Admin',
      previousHolder: 'cosmetics.lk IT Central Inventory',
      newHolder: `${newAsset.currentAssignment.assignedToName} (${newAsset.currentAssignment.locationOrBranch})`,
      assignmentType: newAsset.currentAssignment.assignmentType,
      notes: newAsset.currentAssignment.purpose || 'Initial deployment assignment upon purchase.',
    };
    db.custodyHistory.unshift(assignHistory);
  }

  await writeDatabase(db);
  return newAsset;
}

export async function updateAsset(id: string, updates: Partial<Asset>): Promise<Asset | null> {
  const db = await readDatabase();
  const index = db.assets.findIndex((a) => a.id === id);
  if (index === -1) return null;

  const current = db.assets[index];
  const updatedAsset: Asset = {
    ...current,
    ...updates,
    id: current.id, // prevent ID override
    updatedAt: new Date().toISOString(),
  };

  db.assets[index] = updatedAsset;
  await writeDatabase(db);
  return updatedAsset;
}

export async function assignAsset(
  id: string,
  assignment: CurrentAssignment,
  performedBy: string = 'IT Asset Admin'
): Promise<Asset | null> {
  const db = await readDatabase();
  const index = db.assets.findIndex((a) => a.id === id);
  if (index === -1) return null;

  const asset = db.assets[index];
  const previousHolder = asset.currentAssignment
    ? `${asset.currentAssignment.assignedToName} (${asset.currentAssignment.locationOrBranch})`
    : 'IT Central Inventory';

  const newHolder = `${assignment.assignedToName} (${assignment.locationOrBranch})`;
  const isBorrow = assignment.assignmentType === 'TEMPORARY_BORROW';
  const newStatus = isBorrow ? 'BORROWED_TEMPORARY' : 'ALLOCATED_PERMANENT';

  // Update Asset
  asset.status = newStatus;
  asset.currentAssignment = assignment;
  asset.updatedAt = new Date().toISOString();

  // Add History Record
  const newHistory: CustodyRecord = {
    id: `HIS-${Date.now().toString().slice(-6)}`,
    assetId: asset.id,
    action: asset.currentAssignment ? 'TRANSFERRED' : 'ASSIGNED',
    date: assignment.assignedDate || new Date().toISOString().slice(0, 10),
    performedBy,
    previousHolder,
    newHolder,
    assignmentType: assignment.assignmentType,
    notes: `${assignment.purpose || 'Assigned'}. ${isBorrow && assignment.expectedReturnDate ? `Expected return: ${assignment.expectedReturnDate}` : ''}`,
  };

  db.custodyHistory.unshift(newHistory);
  await writeDatabase(db);
  return asset;
}

export async function returnAsset(
  id: string,
  returnDetails: {
    returnDate: string;
    conditionUponReturn: string;
    damages?: string;
    notes?: string;
    performedBy?: string;
  }
): Promise<Asset | null> {
  const db = await readDatabase();
  const index = db.assets.findIndex((a) => a.id === id);
  if (index === -1) return null;

  const asset = db.assets[index];
  const prevAssignment = asset.currentAssignment;
  const previousHolder = prevAssignment
    ? `${prevAssignment.assignedToName} (${prevAssignment.locationOrBranch})`
    : 'Unknown Holder';

  // Calculate duration held
  const duration = prevAssignment ? calculateDuration(prevAssignment.assignedDate, returnDetails.returnDate) : '';

  // Determine new status and condition
  const hasDamage = returnDetails.damages && returnDetails.damages.trim().length > 0;
  const isBroken = hasDamage || returnDetails.conditionUponReturn.toLowerCase().includes('damage');
  
  asset.status = isBroken ? 'UNDER_REPAIR' : 'AVAILABLE';
  asset.condition = (returnDetails.conditionUponReturn as any) || (isBroken ? 'Damaged / Needs Repair' : 'Used - Good');
  asset.currentAssignment = null;
  asset.updatedAt = new Date().toISOString();

  // Add return history record
  const returnHistory: CustodyRecord = {
    id: `HIS-${Date.now().toString().slice(-6)}`,
    assetId: asset.id,
    action: hasDamage ? 'DAMAGE_REPORTED' : 'RETURNED',
    date: returnDetails.returnDate,
    performedBy: returnDetails.performedBy || 'IT Asset Admin',
    previousHolder,
    newHolder: 'IT Lab & Inventory',
    assignmentType: 'RETURN_TO_IT',
    duration,
    conditionUponReturn: returnDetails.conditionUponReturn,
    damages: returnDetails.damages || '',
    notes: returnDetails.notes || 'Returned to IT Department inventory.',
  };

  db.custodyHistory.unshift(returnHistory);
  await writeDatabase(db);
  return asset;
}

export async function getBranches(): Promise<Branch[]> {
  const db = await readDatabase();
  return db.branches;
}

export async function getDepartments(): Promise<Department[]> {
  const db = await readDatabase();
  return db.departments;
}

export async function getSystemStats() {
  const db = await readDatabase();
  const assets = db.assets;
  
  const totalAssets = assets.length;
  const totalValueLKR = assets.reduce((sum, a) => sum + (Number(a.purchaseAmount) || 0), 0);
  
  const availableCount = assets.filter((a) => a.status === 'AVAILABLE').length;
  const allocatedCount = assets.filter((a) => a.status === 'ALLOCATED_PERMANENT').length;
  const borrowedCount = assets.filter((a) => a.status === 'BORROWED_TEMPORARY').length;
  const repairCount = assets.filter((a) => a.status === 'UNDER_REPAIR').length;

  // Calculate warranties expiring in next 30 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const expiringWarrantyCount = assets.filter((a) => {
    if (!a.warrantyEndDate) return false;
    const wDate = new Date(a.warrantyEndDate);
    return wDate >= today && wDate <= in30Days;
  }).length;

  const expiredWarrantyCount = assets.filter((a) => {
    if (!a.warrantyEndDate) return false;
    const wDate = new Date(a.warrantyEndDate);
    return wDate < today;
  }).length;

  return {
    totalAssets,
    totalValueLKR,
    availableCount,
    allocatedCount,
    borrowedCount,
    repairCount,
    expiringWarrantyCount,
    expiredWarrantyCount,
    totalBranches: db.branches.length,
    totalDepartments: db.departments.length,
    recentHistory: db.custodyHistory.slice(0, 8),
  };
}

export async function getRepairTickets(): Promise<RepairTicket[]> {
  const db = await readDatabase();
  return (db.repairTickets || []).sort(
    (a, b) => new Date(b.dispatchedDate).getTime() - new Date(a.dispatchedDate).getTime()
  );
}

export async function getRepairTicketsByAsset(assetId: string): Promise<RepairTicket[]> {
  const db = await readDatabase();
  return (db.repairTickets || [])
    .filter((t) => t.assetId === assetId)
    .sort((a, b) => new Date(b.dispatchedDate).getTime() - new Date(a.dispatchedDate).getTime());
}

export async function createRepairTicket(
  ticketData: Omit<RepairTicket, 'id'>
): Promise<RepairTicket> {
  const db = await readDatabase();
  db.repairTickets = db.repairTickets || [];

  const year = new Date().getFullYear();
  const nextNum = String(db.repairTickets.length + 1).padStart(3, '0');
  const newId = `RMA-${year}-${nextNum}`;

  const newTicket: RepairTicket = {
    ...ticketData,
    id: newId,
  };

  db.repairTickets.unshift(newTicket);

  // Update target asset status to UNDER_REPAIR
  const assetIndex = db.assets.findIndex((a) => a.id === ticketData.assetId);
  if (assetIndex !== -1) {
    const asset = db.assets[assetIndex];
    asset.status = 'UNDER_REPAIR';
    asset.condition = 'Damaged / Needs Repair';
    asset.currentAssignment = {
      assignmentType: 'VENDOR_REPAIR',
      assignedToName: `Vendor: ${ticketData.vendorName}`,
      assignedToRole: `RMA #${ticketData.rmaNumber}`,
      assignedToContact: ticketData.vendorContact,
      assignedDate: ticketData.dispatchedDate,
      expectedReturnDate: ticketData.expectedReturnDate,
      locationOrBranch: ticketData.serviceCenterLocation || 'Vendor Service Center',
      department: 'IT & Systems Infrastructure',
      purpose: `Dispatched for service: ${ticketData.issueDescription}`,
      notes: ticketData.notes || '',
    };
    asset.updatedAt = new Date().toISOString();

    // Add custody history entry
    const historyRecord: CustodyRecord = {
      id: `HIS-${Date.now().toString().slice(-6)}`,
      assetId: ticketData.assetId,
      action: 'REPAIR_SENT',
      date: ticketData.dispatchedDate,
      performedBy: ticketData.dispatchedBy || 'IT Asset Admin',
      previousHolder: 'cosmetics.lk IT Central Inventory',
      newHolder: `${ticketData.vendorName} (RMA #${ticketData.rmaNumber})`,
      assignmentType: 'VENDOR_REPAIR',
      notes: `Dispatched to ${ticketData.vendorName} (${ticketData.serviceCenterLocation}). Issue: ${ticketData.issueDescription}. Est. Cost: Rs. ${ticketData.estimatedCostLKR?.toLocaleString()} LKR.`,
    };
    db.custodyHistory.unshift(historyRecord);
  }

  await writeDatabase(db);
  return newTicket;
}

export async function updateRepairTicket(
  id: string,
  updates: Partial<RepairTicket>
): Promise<RepairTicket | null> {
  const db = await readDatabase();
  db.repairTickets = db.repairTickets || [];

  const index = db.repairTickets.findIndex((t) => t.id === id);
  if (index === -1) return null;

  const current = db.repairTickets[index];
  const updatedTicket: RepairTicket = {
    ...current,
    ...updates,
    id: current.id, // prevent ID override
  };

  db.repairTickets[index] = updatedTicket;

  // If status is transitioning to RETURNED_TO_FLEET, restore asset to AVAILABLE
  if (updates.status === 'RETURNED_TO_FLEET') {
    const assetIndex = db.assets.findIndex((a) => a.id === updatedTicket.assetId);
    if (assetIndex !== -1) {
      const asset = db.assets[assetIndex];
      asset.status = 'AVAILABLE';
      asset.condition = 'Used - Good';
      asset.currentAssignment = null;
      asset.updatedAt = new Date().toISOString();

      const returnHistory: CustodyRecord = {
        id: `HIS-${Date.now().toString().slice(-6)}`,
        assetId: updatedTicket.assetId,
        action: 'REPAIR_COMPLETED',
        date: updates.completedDate || new Date().toISOString().slice(0, 10),
        performedBy: 'IT Asset Admin',
        previousHolder: `${updatedTicket.vendorName} (RMA #${updatedTicket.rmaNumber})`,
        newHolder: 'cosmetics.lk IT Central Inventory',
        assignmentType: 'RETURN_TO_IT',
        notes: `Vendor repair completed and hardware reintegrated into central inventory. Actual cost: Rs. ${(updates.actualCostLKR ?? updatedTicket.actualCostLKR ?? 0).toLocaleString()} LKR. Notes: ${updates.notes || updatedTicket.notes || 'Repaired and tested.'}`,
      };
      db.custodyHistory.unshift(returnHistory);
    }
  }

  await writeDatabase(db);
  return updatedTicket;
}

