export type AssetCategory =
  | 'Laptop'
  | 'Desktop'
  | 'Tablet'
  | 'Mobile Phone'
  | 'Camera'
  | 'POS Terminal'
  | 'Printer'
  | 'Network Equipment'
  | 'Audio/Visual'
  | 'Accessory';

export type AssetCondition =
  | 'Brand New'
  | 'Used - Like New'
  | 'Used - Good'
  | 'Used - Fair'
  | 'Damaged / Needs Repair'
  | 'Scrapped / Retired';

export type AssetStatus =
  | 'AVAILABLE'
  | 'ALLOCATED_PERMANENT'
  | 'BORROWED_TEMPORARY'
  | 'UNDER_REPAIR'
  | 'RETIRED';

export type AssignmentType =
  | 'LOCATION_SHOWROOM'
  | 'DEPARTMENT_SHARED'
  | 'PERMANENT_EMPLOYEE'
  | 'TEMPORARY_BORROW'
  | 'INVENTORY_INTAKE'
  | 'RETURN_TO_IT'
  | 'DAMAGE_INSPECTION'
  | 'VENDOR_REPAIR';

export type HistoryAction =
  | 'PURCHASED'
  | 'ASSIGNED'
  | 'RETURNED'
  | 'TRANSFERRED'
  | 'DAMAGE_REPORTED'
  | 'REPAIR_SENT'
  | 'REPAIR_COMPLETED'
  | 'RETIRED';

export interface CurrentAssignment {
  assignmentType: AssignmentType;
  assignedToName: string;
  assignedToRole: string;
  assignedToContact: string;
  assignedDate: string;
  expectedReturnDate?: string;
  locationOrBranch: string;
  department: string;
  purpose: string;
  notes?: string;
}

export interface CustodyRecord {
  id: string;
  assetId: string;
  action: HistoryAction;
  date: string;
  performedBy: string;
  previousHolder: string;
  newHolder: string;
  assignmentType: AssignmentType;
  duration?: string;
  conditionUponReturn?: string;
  damages?: string;
  notes?: string;
  returnPhotos?: string[];
}

export interface Asset {
  id: string;
  assetTag: string;
  name: string;
  category: AssetCategory;
  brand: string;
  modelNumber: string;
  serialNumber: string;
  hasSim: boolean;
  imei1?: string;
  imei2?: string;
  condition: AssetCondition;
  purchaseDate: string;
  warrantyEndDate: string;
  purchaseLocation: string;
  purchaseAmount: number; // In LKR
  currency: 'LKR';
  invoiceDoc?: string;
  images: string[];
  status: AssetStatus;
  currentAssignment: CurrentAssignment | null;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  type: 'Showroom' | 'Outlet' | 'Head Office' | 'Warehouse' | 'IT Department';
}

export interface Department {
  id: string;
  name: string;
}

export type RepairTicketStatus =
  | 'DISPATCHED_TO_VENDOR'
  | 'UNDER_DIAGNOSTICS'
  | 'AWAITING_PARTS'
  | 'REPAIR_COMPLETED'
  | 'RETURNED_TO_FLEET';

export interface RepairTicket {
  id: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  vendorName: string;
  vendorContact: string;
  serviceCenterLocation: string;
  rmaNumber: string;
  issueDescription: string;
  estimatedCostLKR: number;
  actualCostLKR?: number;
  isCoveredByWarranty: boolean;
  dispatchedDate: string;
  expectedReturnDate: string;
  completedDate?: string;
  status: RepairTicketStatus;
  notes?: string;
  invoiceDoc?: string;
  dispatchedBy: string;
}

export type MaintenanceType =
  | 'BIANNUAL_ROUTINE'
  | 'RANDOM_SPOT_CHECK'
  | 'PRE_DEPLOYMENT'
  | 'POST_REPAIR_AUDIT';

export type MaintenanceStatus =
  | 'SCHEDULED'
  | 'OVERDUE'
  | 'COMPLETED'
  | 'CANCELLED';

export type MaintenanceHealthGrade =
  | 'EXCELLENT'
  | 'GOOD'
  | 'NEEDS_ATTENTION'
  | 'CRITICAL_RISK';

export interface MaintenanceChecklist {
  thermalAndCooling: boolean;
  batteryHealth: boolean;
  portsAndConnectivity: boolean;
  displayAndChassis: boolean;
  softwareAndSecurity: boolean;
  sanitization: boolean;
}

export interface MaintenanceRecord {
  id: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  category: AssetCategory;
  type: MaintenanceType;
  scheduledDate: string;
  completedDate?: string;
  status: MaintenanceStatus;
  inspector: string;
  checklist: MaintenanceChecklist;
  healthGrade?: MaintenanceHealthGrade;
  batteryHealthPercent?: number;
  findings?: string;
  actionTaken?: string;
  costLKR?: number;
  nextScheduledDate: string;
  notes?: string;
  createdAt: string;
}

export interface DatabaseSchema {
  branches: Branch[];
  departments: Department[];
  assets: Asset[];
  custodyHistory: CustodyRecord[];
  repairTickets?: RepairTicket[];
  maintenanceRecords?: MaintenanceRecord[];
}
