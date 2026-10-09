import { NextRequest, NextResponse } from 'next/server';
import { generateInvoicePDF } from '@/lib/pdf';

export async function POST(req: NextRequest) {
  try {
    const { invoice, job, customer, lineItems, businessName } = await req.json();

    if (!invoice || !job || !customer) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const pdfBuffer = await generateInvoicePDF(
      invoice,
      job,
      customer,
      lineItems || [],
      businessName || 'TradeFlow Services'
    );

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoice_number}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('PDF API Error:', error);
    return NextResponse.json({ error: error.message || 'PDF generation failed' }, { status: 500 });
  }
}
