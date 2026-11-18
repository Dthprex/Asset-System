import { NextRequest, NextResponse } from 'next/server';
import { getDepartments, createDepartment, deleteDepartment } from '@/lib/db';

export async function GET() {
  try {
    const departments = await getDepartments();
    return NextResponse.json({ success: true, departments });
  } catch (error: any) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Department name is required' },
        { status: 400 }
      );
    }

    const newDept = await createDepartment(body.name.trim());
    return NextResponse.json({ success: true, data: newDept }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating department:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create department' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Department ID is required' },
        { status: 400 }
      );
    }

    await deleteDepartment(id);
    return NextResponse.json({ success: true, message: 'Department deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting department:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete department' },
      { status: 500 }
    );
  }
}
