import { NextRequest, NextResponse } from 'next/server';
import { generateQuotePDF } from '@/lib/pdf';
import { getQuoteByToken, getQuoteByJobId, getLocalJobs, getLocalCustomers, getLocalProfile } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const { quote, job, customer, lineItems, businessName } = await req.json();

    if (!quote || !job || !customer) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const pdfBuffer = await generateQuotePDF(
      quote,
      job,
      customer,
      lineItems || [],
      businessName || 'TradeFlow Services'
    );

    const safeName = customer?.name ? customer.name.trim().replace(/[^a-zA-Z0-9_-]/g, '_') : 'Client';
    const fileName = `Quotation_${safeName}.pdf`;

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    console.error('Quote PDF API Error:', error);
    return NextResponse.json({ error: error.message || 'Quote PDF generation failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const jobId = searchParams.get('jobId');

    let quote = null;
    if (token) {
      quote = getQuoteByToken(token);
    } else if (jobId) {
      quote = getQuoteByJobId(jobId);
    }

    if (!quote) {
      return NextResponse.json({ error: 'Quotation record not found' }, { status: 404 });
    }

    const jobs = getLocalJobs();
    const job = jobs.find((j) => j.id === quote.job_id);
    if (!job) {
      return NextResponse.json({ error: 'Associated job not found' }, { status: 404 });
    }

    const customers = getLocalCustomers();
    const customer = customers.find((c) => c.id === job.customer_id);
    if (!customer) {
      return NextResponse.json({ error: 'Customer record not found' }, { status: 404 });
    }

    const profile = getLocalProfile();
    const pdfBuffer = await generateQuotePDF(
      quote,
      job,
      customer,
      quote.line_items || [],
      profile.business_name || 'TradeFlow Services'
    );

    const safeName = customer?.name ? customer.name.trim().replace(/[^a-zA-Z0-9_-]/g, '_') : 'Client';
    const fileName = `Quotation_${safeName}.pdf`;

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    console.error('Quote PDF GET Error:', error);
    return NextResponse.json({ error: error.message || 'Quote PDF retrieval failed' }, { status: 500 });
  }
}
