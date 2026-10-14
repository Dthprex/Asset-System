import { NextRequest, NextResponse } from 'next/server';
import { getAllAssets, createAsset } from '@/lib/db';
import { Asset } from '@/types/asset';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase();
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const branch = searchParams.get('branch');
    const department = searchParams.get('department');

    let assets = await getAllAssets();

    if (search) {
      assets = assets.filter((a) =>
        a.name.toLowerCase().includes(search) ||
        a.assetTag.toLowerCase().includes(search) ||
        a.serialNumber.toLowerCase().includes(search) ||
        (a.imei1 && a.imei1.includes(search)) ||
        (a.imei2 && a.imei2.includes(search)) ||
        (a.currentAssignment?.assignedToName.toLowerCase().includes(search)) ||
        (a.purchaseLocation.toLowerCase().includes(search))
      );
    }

    if (category && category !== 'ALL') {
      assets = assets.filter((a) => a.category === category);
    }

    if (status && status !== 'ALL') {
      assets = assets.filter((a) => a.status === status);
    }

    if (branch && branch !== 'ALL') {
      assets = assets.filter((a) => a.currentAssignment?.locationOrBranch === branch);
    }

    if (department && department !== 'ALL') {
      assets = assets.filter((a) => a.currentAssignment?.department === department);
    }

    return NextResponse.json({ success: true, count: assets.length, data: assets });
  } catch (error: any) {
    console.error('Error fetching assets:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation
    if (!body.name || !body.category || !body.serialNumber || !body.purchaseAmount) {
      return NextResponse.json(
        { success: false, error: 'Name, Category, Serial Number, and Purchase Amount are required' },
        { status: 400 }
      );
    }

    // Auto-generate tag if not provided
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const year = new Date().getFullYear();
    const assetTag = body.assetTag || `CLK-IT-${year}-${randomSuffix}`;

    const newAssetData: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'> = {
      assetTag,
      name: body.name.trim(),
      category: body.category,
      brand: body.brand || 'Generic',
      modelNumber: body.modelNumber || '',
      serialNumber: body.serialNumber.trim(),
      hasSim: Boolean(body.hasSim),
      imei1: body.imei1 || '',
      imei2: body.imei2 || '',
      condition: body.condition || 'Brand New',
      purchaseDate: body.purchaseDate || new Date().toISOString().slice(0, 10),
      warrantyEndDate: body.warrantyEndDate || '',
      purchaseLocation: body.purchaseLocation || 'Colombo Vendor',
      purchaseAmount: Number(body.purchaseAmount) || 0,
      currency: 'LKR',
      invoiceDoc: body.invoiceDoc || '',
      images: Array.isArray(body.images) && body.images.length > 0 
        ? body.images 
        : ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80'],
      status: body.currentAssignment ? (body.currentAssignment.assignmentType === 'TEMPORARY_BORROW' ? 'BORROWED_TEMPORARY' : 'ALLOCATED_PERMANENT') : 'AVAILABLE',
      currentAssignment: body.currentAssignment || null,
    };

    const created = await createAsset(newAssetData);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating asset:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create asset' },
      { status: 500 }
    );
  }
}
