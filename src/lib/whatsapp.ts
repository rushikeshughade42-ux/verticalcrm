/**
 * TradeFlow WhatsApp Deep Linking Engine (Zero-Cost WhatsApp Integration)
 * Uses wa.me protocol to dispatch quotes, invoices, and review requests directly to customer WhatsApp.
 */

export function sanitizePhoneNumber(phone: string, defaultCountryCode: string = '91'): string {
  // Remove all non-numeric characters except leading +
  let raw = phone.trim();
  const hasPlus = raw.startsWith('+');

  let cleaned = raw.replace(/[^0-9]/g, '');

  if (cleaned.length === 0) return '';

  // If user included + or starts with 12+ digits (already has country code)
  if (hasPlus || cleaned.length > 10) {
    return cleaned;
  }

  // If 10-digit number without country code, prepend default country code (e.g. 91 for India)
  if (cleaned.length === 10) {
    return `${defaultCountryCode}${cleaned}`;
  }

  return cleaned;
}

export function generateWhatsAppUri(phone: string, text: string): string {
  const cleanedPhone = sanitizePhoneNumber(phone);
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanedPhone}?text=${encodedText}`;
}

export const whatsappTemplates = {
  quote: ({
    name,
    business_name,
    problem,
    quote_url,
  }: {
    name: string;
    business_name: string;
    problem: string;
    quote_url: string;
  }) =>
    `Hi ${name}, here is your quotation from ${business_name} for ${problem}: ${quote_url}. Please tap to view and accept.`,

  quoteWithPdf: ({
    name,
    business_name,
    amount,
    quote_url,
  }: {
    name: string;
    business_name: string;
    amount: number;
    filename?: string;
    quote_url: string;
  }) =>
    `Hi ${name}, here is your quotation from ${business_name} for ₹${amount.toLocaleString('en-IN')}.\n\nView online quote & book service: ${quote_url}`,

  invoice: ({
    name,
    amount,
    business_name,
    invoice_url,
  }: {
    name: string;
    amount: number;
    business_name: string;
    invoice_url: string;
  }) =>
    `Hi ${name}, your invoice of ₹${amount.toFixed(
      2
    )} from ${business_name} is ready. You can review and pay securely online here: ${invoice_url}. Thank you!`,

  review: ({
    name,
    business_name,
    review_url,
  }: {
    name: string;
    business_name: string;
    review_url: string;
  }) =>
    `Hi ${name}, thank you for choosing ${business_name}! How did we do? Please take 10 seconds to share your rating here: ${review_url}`,
};
