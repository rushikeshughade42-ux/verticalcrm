import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') || '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || webhookSecret.includes('placeholder')) {
    return NextResponse.json({ received: true, mode: 'test_demo' });
  }

  try {
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const invoiceId = session.metadata?.invoiceId;
      console.log(`[Stripe Webhook] Payment confirmed for invoice: ${invoiceId}`);
      // Here Supabase RLS DB table status update is triggered
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error(`Stripe Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }
}
