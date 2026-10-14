import { NextResponse } from 'next/server';
import { getBranches, getDepartments } from '@/lib/db';

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
