import { NextResponse } from 'next/server';
import { getSystemStats } from '@/lib/db';

export async function GET() {
  try {
    const stats = await getSystemStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Error fetching system stats:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
