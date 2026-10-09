import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Invoice, Job, Customer, QuoteLineItem, Quote } from '@/types';

/**
 * Sanitizes strings for pdf-lib WinAnsi standard font encoding.
 * Converts Unicode characters like ₹, —, smart quotes, and non-ASCII chars into clean ASCII.
 */
function cleanPdfText(text: string | null | undefined): string {
  if (!text) return '';
  return String(text)
    .replace(/₹/g, 'Rs.')
    .replace(/[—–]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .replace(/[^\x00-\x7F]/g, '');
}

export async function generateInvoicePDF(
  invoice: Invoice,
  job: Job,
  customer: Customer,
  lineItems: QuoteLineItem[],
  businessName: string = 'TradeFlow Pro Services'
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const { width, height } = page.getSize();
  const margin = 40;

  // Header Banner
  page.drawRectangle({
    x: 0,
    y: height - 100,
    width: width,
    height: 100,
    color: rgb(0.97, 0.98, 1.0),
  });

  // Title & Business Name
  page.drawText(cleanPdfText(businessName || 'TradeFlow Services'), {
    x: margin,
    y: height - 45,
    size: 20,
    font: fontBold,
    color: rgb(0.0, 0.4, 0.8),
  });

  page.drawText('INVOICE', {
    x: width - margin - 100,
    y: height - 45,
    size: 22,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.15),
  });

  page.drawText(`Invoice #: ${cleanPdfText(invoice?.invoice_number || 'INV-001')}`, {
    x: width - margin - 140,
    y: height - 70,
    size: 10,
    font: fontRegular,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Customer & Job Details
  let currentY = height - 130;

  page.drawText('Billed To:', {
    x: margin,
    y: currentY,
    size: 11,
    font: fontBold,
    color: rgb(0.3, 0.3, 0.3),
  });

  currentY -= 18;
  page.drawText(cleanPdfText(customer?.name || 'Customer'), {
    x: margin,
    y: currentY,
    size: 12,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  currentY -= 16;
  page.drawText(`Contact: ${cleanPdfText(customer?.contact_no || 'N/A')}`, {
    x: margin,
    y: currentY,
    size: 10,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  currentY -= 16;
  page.drawText(`Location: ${cleanPdfText(customer?.location || 'N/A')}`, {
    x: margin,
    y: currentY,
    size: 10,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  currentY -= 30;
  const rawJobDesc = cleanPdfText(job?.title || job?.problem || 'Service Call');
  page.drawText(`Job Description: ${rawJobDesc.length > 50 ? rawJobDesc.substring(0, 48) + '...' : rawJobDesc}`, {
    x: margin,
    y: currentY,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  // Table Header
  currentY -= 30;
  page.drawRectangle({
    x: margin,
    y: currentY - 5,
    width: width - margin * 2,
    height: 24,
    color: rgb(0.94, 0.96, 0.98),
  });

  page.drawText('Description', { x: margin + 10, y: currentY, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.3) });
  page.drawText('Qty', { x: 380, y: currentY, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.3) });
  page.drawText('Unit Rate', { x: 440, y: currentY, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.3) });
  page.drawText('Total (Rs.)', { x: 500, y: currentY, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.3) });

  // Table Rows
  currentY -= 25;
  (lineItems || []).forEach((item) => {
    const desc = cleanPdfText(item.description || 'Service Line Item');
    const qty = Number(item.quantity) || 1;
    const unitPrice = Number(item.unit_price) || 0;
    const total = Number(item.total) || qty * unitPrice;

    page.drawText(desc.length > 42 ? desc.substring(0, 40) + '...' : desc, {
      x: margin + 10,
      y: currentY,
      size: 9,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText(String(qty), {
      x: 385,
      y: currentY,
      size: 9,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText(`Rs. ${unitPrice.toFixed(2)}`, {
      x: 435,
      y: currentY,
      size: 9,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText(`Rs. ${total.toFixed(2)}`, {
      x: 500,
      y: currentY,
      size: 9,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    currentY -= 20;
  });

  // Total Section
  currentY -= 15;
  page.drawLine({
    start: { x: margin, y: currentY },
    end: { x: width - margin, y: currentY },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });

  currentY -= 25;
  page.drawText('TOTAL DUE:', {
    x: 380,
    y: currentY,
    size: 12,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  const invAmount = Number(invoice?.amount) || 0;
  page.drawText(`Rs. ${invAmount.toFixed(2)}`, {
    x: 475,
    y: currentY,
    size: 14,
    font: fontBold,
    color: rgb(0.0, 0.4, 0.8),
  });

  // Footer / Status
  currentY -= 60;
  const isPaid = Boolean(invoice?.paid_at);
  const statusText = isPaid ? 'STATUS: PAID IN FULL' : 'STATUS: PAYMENT PENDING';
  const statusColor = isPaid ? rgb(0.06, 0.72, 0.45) : rgb(0.96, 0.62, 0.04);

  page.drawText(statusText, {
    x: margin,
    y: currentY,
    size: 12,
    font: fontBold,
    color: statusColor,
  });

  page.drawText('Thank you for choosing TradeFlow Services!', {
    x: margin,
    y: 40,
    size: 10,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });

  return await pdfDoc.save();
}

export async function generateQuotePDF(
  quote: Quote,
  job: Job,
  customer: Customer,
  lineItems: QuoteLineItem[],
  businessName: string = 'TradeFlow Pro Services'
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const { width, height } = page.getSize();
  const margin = 40;

  // Header Banner
  page.drawRectangle({
    x: 0,
    y: height - 100,
    width: width,
    height: 100,
    color: rgb(0.95, 0.97, 1.0),
  });

  page.drawText(cleanPdfText(businessName || 'TradeFlow Services'), {
    x: margin,
    y: height - 45,
    size: 20,
    font: fontBold,
    color: rgb(0.0, 0.4, 0.8),
  });

  page.drawText('QUOTATION', {
    x: width - margin - 130,
    y: height - 45,
    size: 22,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.15),
  });

  page.drawText(`Ref #: ${cleanPdfText(quote?.id || 'Q-001')}`, {
    x: width - margin - 130,
    y: height - 68,
    size: 9,
    font: fontRegular,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Customer & Job Details
  let currentY = height - 130;

  page.drawText('Prepared For:', {
    x: margin,
    y: currentY,
    size: 11,
    font: fontBold,
    color: rgb(0.3, 0.3, 0.3),
  });

  currentY -= 18;
  page.drawText(cleanPdfText(customer?.name || 'Customer'), {
    x: margin,
    y: currentY,
    size: 12,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  currentY -= 16;
  page.drawText(`Contact: ${cleanPdfText(customer?.contact_no || 'N/A')}`, {
    x: margin,
    y: currentY,
    size: 10,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  currentY -= 16;
  page.drawText(`Location: ${cleanPdfText(customer?.location || 'N/A')}`, {
    x: margin,
    y: currentY,
    size: 10,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  currentY -= 30;
  const rawProblemDesc = cleanPdfText(job?.title || job?.problem || 'Service Call');
  page.drawText(`Service Request: ${rawProblemDesc.length > 50 ? rawProblemDesc.substring(0, 48) + '...' : rawProblemDesc}`, {
    x: margin,
    y: currentY,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  // Table Header
  currentY -= 30;
  page.drawRectangle({
    x: margin,
    y: currentY - 5,
    width: width - margin * 2,
    height: 24,
    color: rgb(0.94, 0.96, 0.98),
  });

  page.drawText('Item Description', { x: margin + 10, y: currentY, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.3) });
  page.drawText('Type', { x: 310, y: currentY, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.3) });
  page.drawText('Qty/Hrs', { x: 380, y: currentY, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.3) });
  page.drawText('Rate', { x: 445, y: currentY, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.3) });
  page.drawText('Total (Rs.)', { x: 500, y: currentY, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.3) });

  // Table Rows
  currentY -= 25;
  (lineItems || []).forEach((item) => {
    const desc = cleanPdfText(item.description || 'Line Item');
    const type = cleanPdfText(item.type || 'labor').toUpperCase();
    const qty = Number(item.quantity) || 1;
    const unitPrice = Number(item.unit_price) || 0;
    const total = Number(item.total) || qty * unitPrice;

    page.drawText(desc.length > 34 ? desc.substring(0, 32) + '...' : desc, {
      x: margin + 10,
      y: currentY,
      size: 9,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText(type, {
      x: 310,
      y: currentY,
      size: 8,
      font: fontRegular,
      color: rgb(0.4, 0.4, 0.4),
    });

    page.drawText(String(qty), {
      x: 390,
      y: currentY,
      size: 9,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText(`Rs. ${unitPrice.toFixed(2)}`, {
      x: 435,
      y: currentY,
      size: 9,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText(`Rs. ${total.toFixed(2)}`, {
      x: 500,
      y: currentY,
      size: 9,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    currentY -= 20;
  });

  // Total Section
  currentY -= 15;
  page.drawLine({
    start: { x: margin, y: currentY },
    end: { x: width - margin, y: currentY },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });

  currentY -= 25;
  page.drawText('ESTIMATED TOTAL:', {
    x: 340,
    y: currentY,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  const quoteTotal = Number(quote?.total_amount) || lineItems.reduce((s, i) => s + (Number(i.total) || 0), 0);
  page.drawText(`Rs. ${quoteTotal.toFixed(2)}`, {
    x: 475,
    y: currentY,
    size: 14,
    font: fontBold,
    color: rgb(0.0, 0.4, 0.8),
  });

  // Footer & Acceptance Note
  page.drawText('Quotation valid for 30 days. Contact us to accept and schedule service.', {
    x: margin,
    y: 40,
    size: 9,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });

  return await pdfDoc.save();
}
