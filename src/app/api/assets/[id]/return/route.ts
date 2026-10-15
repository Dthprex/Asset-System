import { NextRequest, NextResponse } from 'next/server';
import { returnAsset } from '@/lib/db';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const returnDate = body.returnDate || new Date().toISOString().slice(0, 10);
    const conditionUponReturn = body.conditionUponReturn || 'Used - Good';
    const damages = body.damages || '';
    const notes = body.notes || '';
    const performedBy = body.performedBy || 'IT Asset Admin';
    const returnPhotos = Array.isArray(body.returnPhotos) ? body.returnPhotos : [];

    const updated = await returnAsset(id, {
      returnDate,
      conditionUponReturn,
      damages,
      notes,
      performedBy,
      returnPhotos,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error processing asset return:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process return' },
      { status: 500 }
    );
  }
}
