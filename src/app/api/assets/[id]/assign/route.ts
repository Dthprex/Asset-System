import { NextRequest, NextResponse } from 'next/server';
import { assignAsset } from '@/lib/db';
import { CurrentAssignment } from '@/types/asset';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    if (!body.assignedToName || !body.locationOrBranch) {
      return NextResponse.json(
        { success: false, error: 'Holder Name and Location/Branch are required for assignment' },
        { status: 400 }
      );
    }

    const assignment: CurrentAssignment = {
      assignmentType: body.assignmentType || 'PERMANENT_EMPLOYEE',
      assignedToName: body.assignedToName.trim(),
      assignedToRole: body.assignedToRole || '',
      assignedToContact: body.assignedToContact || '',
      assignedDate: body.assignedDate || new Date().toISOString().slice(0, 10),
      expectedReturnDate: body.expectedReturnDate || '',
      locationOrBranch: body.locationOrBranch,
      department: body.department || '',
      purpose: body.purpose || '',
      notes: body.notes || '',
    };

    const performedBy = body.performedBy || 'IT Asset Admin';
    const updatedAsset = await assignAsset(id, assignment, performedBy);

    if (!updatedAsset) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedAsset });
  } catch (error: any) {
    console.error('Error assigning asset:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to assign asset' },
      { status: 500 }
    );
  }
}
