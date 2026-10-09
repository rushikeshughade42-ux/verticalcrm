import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY || 're_placeholder';
export const resend = new Resend(resendApiKey);

export async function sendInvoiceEmail(
  toEmail: string,
  customerName: string,
  invoiceNumber: string,
  amount: number,
  paymentLink: string
) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('placeholder')) {
    console.log(`[Resend Mock Email] To: ${toEmail} | Invoice: ${invoiceNumber} | Amount: ₹${amount} | Link: ${paymentLink}`);
    return { success: true, mock: true };
  }

  try {
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'billing@tradeflow.app',
      to: [toEmail],
      subject: `Invoice ${invoiceNumber} from TradeFlow Services`,
      html: `
        <div style="font-family: -apple-system, sans-serif; padding: 20px; color: #1d1d1f;">
          <h2>Hello ${customerName},</h2>
          <p>Your service invoice <strong>${invoiceNumber}</strong> for <strong>₹${amount.toFixed(2)}</strong> is ready.</p>
          <p style="margin: 24px 0;">
            <a href="${paymentLink}" style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 9999px; font-weight: 600;">Pay Invoice Online</a>
          </p>
          <p style="color: #86868b; font-size: 14px;">Thank you for your business!</p>
        </div>
      `,
    });
    return { success: true, data };
  } catch (error) {
    console.error('Resend email error:', error);
    return { success: false, error };
  }
}
