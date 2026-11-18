import { NextRequest, NextResponse } from 'next/server';
import { getAssetById, updateAsset, retireAsset, restoreAsset, deleteAsset } from '@/lib/db';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const result = await getAssetById(id);

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    let updated;
    if (body.action === 'retire') {
      updated = await retireAsset(id, body.reason, body.performedBy);
    } else if (body.action === 'restore') {
      updated = await restoreAsset(id, body.performedBy);
    } else {
      updated = await updateAsset(id, body);
    }

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Asset not found to update' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update asset' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await deleteAsset(id);
    return NextResponse.json({ success: true, message: 'Asset deleted permanently' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete asset' },
      { status: 500 }
    );
  }
}

