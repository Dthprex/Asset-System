-- ==============================================================================
-- cosmetics.lk Enterprise IT Infrastructure & Fleet Custody Portal
-- Supabase PostgreSQL Database Schema
-- ==============================================================================

-- 1. Branches & Showrooms
CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Showroom', 'Outlet', 'Head Office', 'Warehouse', 'IT Department')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Organization Departments
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- 3. Hardware Fleet Assets
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  asset_tag TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT NOT NULL,
  model_number TEXT DEFAULT '',
  serial_number TEXT UNIQUE NOT NULL,
  has_sim BOOLEAN DEFAULT FALSE,
  imei1 TEXT,
  imei2 TEXT,
  condition TEXT NOT NULL,
  purchase_date DATE NOT NULL,
  warranty_end_date DATE NOT NULL,
  purchase_location TEXT NOT NULL,
  purchase_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'LKR',
  invoice_doc TEXT,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL CHECK (status IN ('AVAILABLE', 'ALLOCATED_PERMANENT', 'BORROWED_TEMPORARY', 'UNDER_REPAIR', 'RETIRED')),
  current_assignment JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fast Search Indexes for Assets
CREATE INDEX IF NOT EXISTS idx_assets_asset_tag ON assets(asset_tag);
CREATE INDEX IF NOT EXISTS idx_assets_serial_number ON assets(serial_number);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_warranty_end ON assets(warranty_end_date);

-- 4. Chronological Custody History & Handover Audit Trail
CREATE TABLE IF NOT EXISTS custody_history (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  performed_by TEXT NOT NULL DEFAULT 'IT Asset Admin',
  previous_holder TEXT NOT NULL,
  new_holder TEXT NOT NULL,
  assignment_type TEXT NOT NULL,
  duration TEXT,
  condition_upon_return TEXT,
  damages TEXT,
  notes TEXT,
  return_photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custody_asset_id ON custody_history(asset_id);
CREATE INDEX IF NOT EXISTS idx_custody_date ON custody_history(date DESC);
CREATE INDEX IF NOT EXISTS idx_custody_action ON custody_history(action);

-- 5. Vendor Repair Tickets (RMA)
CREATE TABLE IF NOT EXISTS repair_tickets (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  asset_tag TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  vendor_contact TEXT,
  service_center_location TEXT,
  rma_number TEXT NOT NULL,
  issue_description TEXT NOT NULL,
  estimated_cost_lkr NUMERIC(12, 2) DEFAULT 0,
  actual_cost_lkr NUMERIC(12, 2) DEFAULT 0,
  is_covered_by_warranty BOOLEAN DEFAULT FALSE,
  dispatched_date DATE NOT NULL,
  expected_return_date DATE,
  completed_date DATE,
  status TEXT NOT NULL CHECK (status IN ('DISPATCHED_TO_VENDOR', 'UNDER_DIAGNOSTICS', 'AWAITING_PARTS', 'REPAIR_COMPLETED', 'RETURNED_TO_FLEET')),
  notes TEXT,
  invoice_doc TEXT,
  dispatched_by TEXT NOT NULL DEFAULT 'IT Asset Admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_repairs_asset_id ON repair_tickets(asset_id);
CREATE INDEX IF NOT EXISTS idx_repairs_status ON repair_tickets(status);
CREATE INDEX IF NOT EXISTS idx_repairs_rma ON repair_tickets(rma_number);

-- 6. Biannual 6-Month Maintenance Records & Spot Checks
CREATE TABLE IF NOT EXISTS maintenance_records (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  asset_tag TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('BIANNUAL_ROUTINE', 'IMPROMPTU_SPOT_CHECK')),
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  status TEXT NOT NULL CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE')),
  inspector TEXT NOT NULL,
  checklist JSONB NOT NULL,
  health_grade TEXT,
  battery_health_percent INT,
  findings TEXT,
  action_taken TEXT,
  cost_lkr NUMERIC(12, 2) DEFAULT 0,
  next_scheduled_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_asset_id ON maintenance_records(asset_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_scheduled ON maintenance_records(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_records(status);

-- 7. Supabase Storage Bucket for Fleet Invoices, Receipts & Return Photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cosmetics-assets-vault', 'cosmetics-assets-vault', true)
ON CONFLICT (id) DO NOTHING;

-- Public Storage Read Policy
CREATE POLICY "Public Access to Asset Invoices and Photos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'cosmetics-assets-vault');

-- Authenticated / Service Role Upload Policy
CREATE POLICY "Allow Uploads to Asset Vault" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'cosmetics-assets-vault');

-- 8. Enable Row Level Security (RLS)
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE custody_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;

-- Allow Public/Anon Read for internal staff portal
CREATE POLICY "Allow read branches" ON branches FOR SELECT USING (true);
CREATE POLICY "Allow read departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Allow read assets" ON assets FOR SELECT USING (true);
CREATE POLICY "Allow read custody" ON custody_history FOR SELECT USING (true);
CREATE POLICY "Allow read repairs" ON repair_tickets FOR SELECT USING (true);
CREATE POLICY "Allow read maintenance" ON maintenance_records FOR SELECT USING (true);

-- Allow Full Access via Service Role or Authenticated Users
CREATE POLICY "Allow full access branches" ON branches FOR ALL USING (true);
CREATE POLICY "Allow full access departments" ON departments FOR ALL USING (true);
CREATE POLICY "Allow full access assets" ON assets FOR ALL USING (true);
CREATE POLICY "Allow full access custody" ON custody_history FOR ALL USING (true);
CREATE POLICY "Allow full access repairs" ON repair_tickets FOR ALL USING (true);
CREATE POLICY "Allow full access maintenance" ON maintenance_records FOR ALL USING (true);
