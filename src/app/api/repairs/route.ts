import { NextRequest, NextResponse } from 'next/server';
import { getRepairTickets, createRepairTicket } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');
    const status = searchParams.get('status');

    let tickets = await getRepairTickets();

    if (assetId) {
      tickets = tickets.filter((t) => t.assetId === assetId);
    }

    if (status && status !== 'ALL') {
      tickets = tickets.filter((t) => t.status === status);
    }

    return NextResponse.json({ success: true, count: tickets.length, data: tickets });
  } catch (error: any) {
    console.error('Error fetching repair tickets:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch repair tickets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.assetId || !body.vendorName || !body.rmaNumber || !body.issueDescription) {
      return NextResponse.json(
        { success: false, error: 'Missing required repair ticket fields (assetId, vendorName, rmaNumber, issueDescription)' },
        { status: 400 }
      );
    }

    const newTicket = await createRepairTicket({
      assetId: body.assetId,
      assetTag: body.assetTag || '',
      assetName: body.assetName || '',
      vendorName: body.vendorName,
      vendorContact: body.vendorContact || '',
      serviceCenterLocation: body.serviceCenterLocation || '',
      rmaNumber: body.rmaNumber,
      issueDescription: body.issueDescription,
      estimatedCostLKR: Number(body.estimatedCostLKR) || 0,
      actualCostLKR: Number(body.actualCostLKR) || 0,
      isCoveredByWarranty: Boolean(body.isCoveredByWarranty),
      dispatchedDate: body.dispatchedDate || new Date().toISOString().slice(0, 10),
      expectedReturnDate: body.expectedReturnDate || '',
      status: body.status || 'DISPATCHED_TO_VENDOR',
      notes: body.notes || '',
      dispatchedBy: body.dispatchedBy || 'IT Asset Admin',
      invoiceDoc: body.invoiceDoc || '',
    });

    return NextResponse.json({ success: true, data: newTicket }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating repair ticket:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create repair ticket' },
      { status: 500 }
    );
  }
}
