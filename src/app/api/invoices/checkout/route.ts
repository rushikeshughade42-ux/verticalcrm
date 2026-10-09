import { NextRequest, NextResponse } from 'next/server';
import { createRazorpayOrder } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  try {
    const { invoiceId, amount, currency } = await req.json();

    if (!invoiceId || !amount) {
      return NextResponse.json({ error: 'Missing invoiceId or amount' }, { status: 400 });
    }

    const orderData = await createRazorpayOrder(
      invoiceId,
      amount,
      currency || 'INR'
    );

    return NextResponse.json(orderData, { status: 200 });
  } catch (error: any) {
    console.error('Razorpay Checkout Route Error:', error);
    return NextResponse.json({ error: error.message || 'Razorpay order creation failed' }, { status: 500 });
  }
}
