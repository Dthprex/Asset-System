import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env.local or process.env
const envLocalPath = path.join(__dirname, '..', '.env.local');
let envConfig = {};
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valParts] = trimmed.split('=');
      if (key) {
        envConfig[key.trim()] = valParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || envConfig.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('\x1b[31mError: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local or environment variables.\x1b[0m');
  console.log('\nExample .env.local:\nNEXT_PUBLIC_SUPABASE_URL=https://your-id.supabase.co\nSUPABASE_SERVICE_ROLE_KEY=your-service-role-key\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('\x1b[36m🚀 Starting cosmetics.lk Supabase Seed Migration...\x1b[0m');
  console.log(`Target Supabase Project: ${supabaseUrl}\n`);

  const dbPath = path.join(__dirname, '..', 'src', 'data', 'database.json');
  const dbRaw = fs.readFileSync(dbPath, 'utf-8');
  const data = JSON.parse(dbRaw);

  // 1. Seed Branches
  if (data.branches?.length > 0) {
    console.log(`📦 Seeding ${data.branches.length} branches...`);
    const { error: branchErr } = await supabase.from('branches').upsert(
      data.branches.map(b => ({
        id: b.id,
        name: b.name,
        code: b.code,
        type: b.type,
      }))
    );
    if (branchErr) console.error('Error inserting branches:', branchErr.message);
    else console.log('  ✓ Branches successfully synchronized');
  }

  // 2. Seed Departments
  if (data.departments?.length > 0) {
    console.log(`📦 Seeding ${data.departments.length} departments...`);
    const { error: deptErr } = await supabase.from('departments').upsert(
      data.departments.map(d => ({
        id: d.id,
        name: d.name,
      }))
    );
    if (deptErr) console.error('Error inserting departments:', deptErr.message);
    else console.log('  ✓ Departments successfully synchronized');
  }

  // 3. Seed Assets
  if (data.assets?.length > 0) {
    console.log(`📦 Seeding ${data.assets.length} fleet hardware assets...`);
    const formattedAssets = data.assets.map(a => ({
      id: a.id,
      asset_tag: a.assetTag,
      name: a.name,
      category: a.category,
      brand: a.brand,
      model_number: a.modelNumber || '',
      serial_number: a.serialNumber,
      has_sim: Boolean(a.hasSim),
      imei1: a.imei1 || null,
      imei2: a.imei2 || null,
      condition: a.condition,
      purchase_date: a.purchaseDate,
      warranty_end_date: a.warrantyEndDate,
      purchase_location: a.purchaseLocation,
      purchase_amount: a.purchaseAmount,
      currency: a.currency || 'LKR',
      invoice_doc: a.invoiceDoc || null,
      images: a.images || [],
      status: a.status,
      current_assignment: a.currentAssignment || null,
      created_at: a.createdAt,
      updated_at: a.updatedAt,
    }));

    const { error: assetErr } = await supabase.from('assets').upsert(formattedAssets);
    if (assetErr) console.error('Error inserting assets:', assetErr.message);
    else console.log('  ✓ Assets successfully synchronized');
  }

  // 4. Seed Custody History
  if (data.custodyHistory?.length > 0) {
    console.log(`📦 Seeding ${data.custodyHistory.length} custody history events...`);
    const formattedHistory = data.custodyHistory.map(h => ({
      id: h.id,
      asset_id: h.assetId,
      action: h.action,
      date: h.date,
      performed_by: h.performedBy || 'IT Asset Admin',
      previous_holder: h.previousHolder,
      new_holder: h.newHolder,
      assignment_type: h.assignmentType,
      duration: h.duration || null,
      condition_upon_return: h.conditionUponReturn || null,
      damages: h.damages || null,
      notes: h.notes || null,
      return_photos: h.returnPhotos || [],
    }));

    const { error: histErr } = await supabase.from('custody_history').upsert(formattedHistory);
    if (histErr) console.error('Error inserting custody history:', histErr.message);
    else console.log('  ✓ Custody History successfully synchronized');
  }

  // 5. Seed Repair Tickets
  if (data.repairTickets?.length > 0) {
    console.log(`📦 Seeding ${data.repairTickets.length} vendor repair tickets...`);
    const formattedRepairs = data.repairTickets.map(r => ({
      id: r.id,
      asset_id: r.assetId,
      asset_tag: r.assetTag,
      asset_name: r.assetName,
      vendor_name: r.vendorName,
      vendor_contact: r.vendorContact || null,
      service_center_location: r.serviceCenterLocation || null,
      rma_number: r.rmaNumber,
      issue_description: r.issueDescription,
      estimated_cost_lkr: r.estimatedCostLKR || 0,
      actual_cost_lkr: r.actualCostLKR || 0,
      is_covered_by_warranty: Boolean(r.isCoveredByWarranty),
      dispatched_date: r.dispatchedDate,
      expected_return_date: r.expectedReturnDate || null,
      completed_date: r.completedDate || null,
      status: r.status,
      notes: r.notes || null,
      invoice_doc: r.invoiceDoc || null,
      dispatched_by: r.dispatchedBy || 'IT Asset Admin',
    }));

    const { error: repairErr } = await supabase.from('repair_tickets').upsert(formattedRepairs);
    if (repairErr) console.error('Error inserting repair tickets:', repairErr.message);
    else console.log('  ✓ Repair Tickets successfully synchronized');
  }

  // 6. Seed Maintenance Records
  if (data.maintenanceRecords?.length > 0) {
    console.log(`📦 Seeding ${data.maintenanceRecords.length} maintenance records...`);
    const formattedMaintenance = data.maintenanceRecords.map(m => ({
      id: m.id,
      asset_id: m.assetId,
      asset_tag: m.assetTag,
      asset_name: m.assetName,
      category: m.category,
      type: m.type,
      scheduled_date: m.scheduledDate,
      completed_date: m.completedDate || null,
      status: m.status,
      inspector: m.inspector,
      checklist: m.checklist || {},
      health_grade: m.healthGrade || null,
      battery_health_percent: m.batteryHealthPercent || null,
      findings: m.findings || null,
      action_taken: m.actionTaken || null,
      cost_lkr: m.costLKR || 0,
      next_scheduled_date: m.nextScheduledDate,
      notes: m.notes || null,
    }));

    const { error: mntErr } = await supabase.from('maintenance_records').upsert(formattedMaintenance);
    if (mntErr) console.error('Error inserting maintenance records:', mntErr.message);
    else console.log('  ✓ Maintenance records successfully synchronized');
  }

  console.log('\n\x1b[32m✨ All fleet inventory records successfully synchronized to Supabase PostgreSQL!\x1b[0m\n');
}

seed().catch(err => {
  console.error('\x1b[31mFatal error during migration:\x1b[0m', err);
  process.exit(1);
});
