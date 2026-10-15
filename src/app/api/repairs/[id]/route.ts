import { NextRequest, NextResponse } from 'next/server';
import { updateRepairTicket } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const updated = await updateRepairTicket(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Repair ticket not found to update' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating repair ticket:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update repair ticket' },
      { status: 500 }
    );
  }
}
