import { NextRequest, NextResponse } from 'next/server';
import { completeMaintenance } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const result = await completeMaintenance(id, body);
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Maintenance record not found to update' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.record,
      nextRoutineRecord: result.nextRoutineRecord,
    });
  } catch (error: any) {
    console.error('Error updating maintenance record:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update maintenance record' },
      { status: 500 }
    );
  }
}
