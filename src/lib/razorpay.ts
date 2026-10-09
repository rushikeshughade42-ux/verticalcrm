import Razorpay from 'razorpay';

const razorpayKeyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';

export const razorpayInstance = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

export async function createRazorpayOrder(
  invoiceId: string,
  amount: number, // In INR (e.g. 1385)
  currency: string = 'INR'
) {
  // Amount in paise (1 INR = 100 paise)
  const amountInPaise = Math.round(amount * 100);

  if (razorpayKeyId.includes('placeholder')) {
    // Return mock order for dev mode when key is placeholder
    return {
      id: `order_mock_${Date.now()}`,
      amount: amountInPaise,
      currency,
      key_id: razorpayKeyId,
      is_mock: true,
    };
  }

  try {
    const order = await razorpayInstance.orders.create({
      amount: amountInPaise,
      currency,
      receipt: invoiceId,
      notes: { invoiceId },
    });

    return {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: razorpayKeyId,
      is_mock: false,
    };
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return {
      id: `order_mock_${Date.now()}`,
      amount: amountInPaise,
      currency,
      key_id: razorpayKeyId,
      is_mock: true,
    };
  }
}
