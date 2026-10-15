import { NextRequest, NextResponse } from 'next/server';
import { getEnrichedActivityHistory } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || undefined;
    const branch = searchParams.get('branch') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 100;

    const result = await getEnrichedActivityHistory({
      action,
      branch,
      search,
      limit,
    });

    return NextResponse.json({
      success: true,
      count: result.activities.length,
      total: result.total,
      latestTimestamp: result.latestTimestamp,
      data: result.activities,
    });
  } catch (error: any) {
    console.error('Error fetching activity history:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch activity history' },
      { status: 500 }
    );
  }
}
