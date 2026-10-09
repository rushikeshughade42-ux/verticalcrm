export function generateSMSUri(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const encodedMsg = encodeURIComponent(message);
  // Works across iOS and Android
  return `sms:${cleanPhone}?&body=${encodedMsg}`;
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  }
  return Promise.resolve(false);
}
