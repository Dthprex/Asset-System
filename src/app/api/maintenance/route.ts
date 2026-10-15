import { NextRequest, NextResponse } from 'next/server';
import { getMaintenanceRecords, scheduleMaintenance } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const assetId = searchParams.get('assetId');

    let records = await getMaintenanceRecords();

    if (status && status !== 'ALL') {
      records = records.filter((r) => r.status === status);
    }

    if (type && type !== 'ALL') {
      records = records.filter((r) => r.type === type);
    }

    if (assetId) {
      records = records.filter((r) => r.assetId === assetId);
    }

    return NextResponse.json({ success: true, count: records.length, data: records });
  } catch (error: any) {
    console.error('Error fetching maintenance records:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch maintenance records' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.assetId || !body.scheduledDate || !body.type) {
      return NextResponse.json(
        { success: false, error: 'Missing required maintenance fields (assetId, scheduledDate, type)' },
        { status: 400 }
      );
    }

    const newRecord = await scheduleMaintenance({
      assetId: body.assetId,
      assetTag: body.assetTag || '',
      assetName: body.assetName || '',
      category: body.category || 'Laptop',
      type: body.type || 'BIANNUAL_ROUTINE',
      scheduledDate: body.scheduledDate,
      status: 'SCHEDULED',
      inspector: body.inspector || 'IT Systems Engineer',
      checklist: body.checklist || {
        thermalAndCooling: false,
        batteryHealth: false,
        portsAndConnectivity: false,
        displayAndChassis: false,
        softwareAndSecurity: false,
        sanitization: false,
      },
      nextScheduledDate: body.nextScheduledDate || '',
      notes: body.notes || '',
    });

    return NextResponse.json({ success: true, data: newRecord }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating maintenance schedule:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create maintenance schedule' },
      { status: 500 }
    );
  }
}
