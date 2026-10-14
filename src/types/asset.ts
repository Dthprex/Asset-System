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
  | 'DAMAGE_INSPECTION';

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

export interface DatabaseSchema {
  branches: Branch[];
  departments: Department[];
  assets: Asset[];
  custodyHistory: CustodyRecord[];
}
