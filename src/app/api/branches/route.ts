import { NextRequest, NextResponse } from 'next/server';
import { getBranches, getDepartments, createBranch, deleteBranch } from '@/lib/db';

export async function GET() {
  try {
    const [branches, departments] = await Promise.all([
      getBranches(),
      getDepartments(),
    ]);
    return NextResponse.json({ success: true, branches, departments });
  } catch (error: any) {
    console.error('Error fetching branches/departments:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch branches' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.code || !body.type) {
      return NextResponse.json(
        { success: false, error: 'Shop location name, branch code, and type are required' },
        { status: 400 }
      );
    }

    const newBranch = await createBranch({
      name: body.name,
      code: body.code,
      type: body.type,
    });

    return NextResponse.json({ success: true, data: newBranch }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating branch location:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create branch location' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Branch ID is required' },
        { status: 400 }
      );
    }

    await deleteBranch(id);
    return NextResponse.json({ success: true, message: 'Branch deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting branch:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete branch' },
      { status: 500 }
    );
  }
}

