import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-02-24.acacia' as any,
  typescript: true,
});

export async function createStripeCheckoutSession(
  invoiceId: string,
  amount: number,
  customerName: string,
  customerEmail?: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
    // Return demo link if key is placeholder
    return `${baseUrl}/invoice/${invoiceId}?pay_demo=true`;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: `TradeFlow Service Invoice #${invoiceId}`,
              description: `Invoice for ${customerName}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: customerEmail || undefined,
      success_url: `${baseUrl}/invoice/${invoiceId}?payment=success`,
      cancel_url: `${baseUrl}/invoice/${invoiceId}?payment=cancelled`,
      metadata: { invoiceId },
    });

    return session.url || `${baseUrl}/invoice/${invoiceId}?pay_demo=true`;
  } catch (err) {
    console.error('Stripe session creation error:', err);
    return `${baseUrl}/invoice/${invoiceId}?pay_demo=true`;
  }
}
