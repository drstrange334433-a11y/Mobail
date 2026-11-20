/**
 * Paracha Mobile Shop — WhatsApp Notification & Communication Utilities
 * Generates formatted customer messages and valid WhatsApp click-to-chat links
 */

import type { Order, OrderStatus } from '../types/order';

/**
 * Clean and format Pakistani mobile numbers into international format
 * e.g., '03001234567' -> '923001234567'
 *       '+92-300-1234567' -> '923001234567'
 *       '0092 300 1234567' -> '923001234567'
 */
export function formatPakistaniPhoneNumber(phone: string): string {
  // Strip spaces, dashes, +, (), and all other non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('0092')) {
    return cleaned.substring(2);
  }
  if (cleaned.startsWith('03')) {
    return '92' + cleaned.substring(1);
  }
  if (cleaned.startsWith('92')) {
    return cleaned;
  }
  if (cleaned.startsWith('3') && cleaned.length === 10) {
    return '92' + cleaned;
  }
  return cleaned;
}

/**
 * Human-readable status label in English and Urdu
 */
export function getStatusDisplay(status: OrderStatus, lang: 'en' | 'ur' = 'en'): { label: string; badgeClass: string } {
  switch (status) {
    case 'pending':
      return {
        label: lang === 'ur' ? 'زیر التواء (Pending)' : 'Pending',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      };
    case 'confirmed':
      return {
        label: lang === 'ur' ? 'تصدیق شدہ (Confirmed)' : 'Confirmed',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
      };
    case 'processing':
      return {
        label: lang === 'ur' ? 'تیاری کے مراحل میں (Processing)' : 'Processing',
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
      };
    case 'shipped':
      return {
        label: lang === 'ur' ? 'ارسال کر دیا گیا (Shipped)' : 'Shipped / Out for Delivery',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      };
    case 'delivered':
      return {
        label: lang === 'ur' ? 'ڈیلیور ہو چکا (Delivered)' : 'Delivered',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };
    case 'cancelled':
      return {
        label: lang === 'ur' ? 'منسوخ شدہ (Cancelled)' : 'Cancelled',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      };
    default:
      return {
        label: status,
        badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
      };
  }
}

/**
 * Generate a professional order status notification message in Urdu & English
 */
export function generateOrderStatusMessage(order: Order, customNote?: string): string {
  const shortId = order.id.slice(0, 8).toUpperCase();
  const dateStr = new Date(order.created_at).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Format line items
  const itemsText = Array.isArray(order.items) && order.items.length > 0
    ? order.items
        .map((item, idx) => {
          const name = item.name_en || item.name_ur || 'Item';
          const price = Number(item.price || 0).toLocaleString();
          const qty = item.quantity || 1;
          return `${idx + 1}. *${name}* × ${qty} — PKR ${price}`;
        })
        .join('\n')
    : '• Details verified with store team';

  let statusUrdu = '';
  let statusEn = '';
  let statusNote = '';

  switch (order.status) {
    case 'pending':
      statusUrdu = 'موصول ہو گیا ہے (Pending)';
      statusEn = 'Order Received / Pending';
      statusNote = 'ہماری ٹیم آپ کے آرڈر کی تصدیق کے لیے جلد رابطہ کرے گی۔\nOur representative will contact you shortly to confirm details.';
      break;
    case 'confirmed':
      statusUrdu = 'تصدیق ہو چکی ہے (Confirmed)';
      statusEn = 'Order Confirmed';
      statusNote = 'آپ کا آرڈر تصدیق کر لیا گیا ہے اور جلد روانہ کیا جائے گا۔\nYour order is confirmed and scheduled for dispatch.';
      break;
    case 'processing':
      statusUrdu = 'تیاری کے مراحل میں ہے (Processing)';
      statusEn = 'Under Processing';
      statusNote = 'آپ کے پروڈکٹس کی جانچ پڑتال اور محفوظ پیکنگ جاری ہے۔\nQuality testing & secure packaging is underway.';
      break;
    case 'shipped':
      statusUrdu = 'ارسال کر دیا گیا ہے (Shipped)';
      statusEn = 'Shipped / Out for Delivery';
      statusNote = 'آپ کا پارسل کورئیر کے حوالے کر دیا گیا ہے۔ براہ کرم ڈیلیوری کے وقت پارسل وصول کریں۔\nYour parcel has been dispatched. Cash on delivery is ready.';
      break;
    case 'delivered':
      statusUrdu = 'ڈیلیور ہو چکا ہے (Delivered)';
      statusEn = 'Successfully Delivered';
      statusNote = 'پراچہ موبائل شاپ پر اعتماد کرنے کا شکریہ! کسی بھی سوال کے لیے ہم حاضر ہیں۔\nThank you for trusting Paracha Mobile Shop! Enjoy your device.';
      break;
    case 'cancelled':
      statusUrdu = 'منسوخ کر دیا گیا ہے (Cancelled)';
      statusEn = 'Order Cancelled';
      statusNote = 'آپ کا آرڈر منسوخ کر دیا گیا ہے۔ مزید معلومات کے لیے ہم سے رابطہ کریں۔\nYour order has been cancelled. Contact our shop helpline for inquiries.';
      break;
    default:
      statusUrdu = order.status;
      statusEn = order.status;
      statusNote = '';
  }

  const message = `السلام علیکم *${order.customer_name}* صاحب،

*پراچہ موبائل شاپ (Paracha Mobile Shop)*
_Trust • Quality • Technology_

📦 *آرڈر کی تفصیلات (Order Details)*
• آرڈر نمبر (Order ID): *#${shortId}*
• تاریخ (Date): ${dateStr}
• آرڈر کی حالت (Status): *${statusUrdu}* (${statusEn})

🛍️ *آئٹمز (Items):*
${itemsText}

💰 *کل رقم (Total Amount):* *PKR ${Number(order.total_price).toLocaleString()}*
📍 *ڈیلیوری ایڈریس (Address):*
${order.delivery_address}

ℹ️ *صورتحال (Update):*
${statusNote}${customNote ? `\n\n📌 *خصوصی نوٹ (Admin Note):*\n${customNote}` : ''}

📞 رابطہ اور سپورٹ کے لیے:
دکان ہیلپ لائن: +92 300 1234567
مین مارکیٹ، پراچہ پلازہ، کمرشل سنٹر`;

  return message;
}

/**
 * Generate a standard WhatsApp Web / API click-to-chat URL
 */
export function buildWhatsAppChatUrl(phone: string, text: string): string {
  const formattedPhone = formatPakistaniPhoneNumber(phone);
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${formattedPhone}?text=${encodedText}`;
}

/**
 * Open WhatsApp click-to-chat in a new browser tab/window safely
 */
export function openWhatsAppChat(phone: string, text: string): void {
  const url = buildWhatsAppChatUrl(phone, text);
  window.open(url, '_blank', 'noopener,noreferrer');
}
