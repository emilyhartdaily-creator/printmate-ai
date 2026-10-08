import { Resend } from 'resend';
import type { CartItem, OrderRecord, PrintPartner } from './types';
import { formatPrice } from './format';

let resend: Resend | null = null;
let attempted = false;

function getResend(): Resend | null {
  if (attempted) return resend;
  attempted = true;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  resend = new Resend(key);
  return resend;
}

const DEFAULT_FROM = 'PrintMate AI <orders@example.com>';

/**
 * Sends an HTML email via Resend. Returns false (and logs) when email
 * is not configured, instead of throwing.
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  const client = getResend();
  const from = process.env.EMAIL_FROM || DEFAULT_FROM;
  if (!client) {
    console.log(
      `[email skipped — RESEND_API_KEY missing] to=${to} subject="${subject}"`,
    );
    return false;
  }
  try {
    const { error } = await client.emails.send({ from, to, subject, html });
    if (error) {
      console.error('[email send failed]', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email send threw]', err);
    return false;
  }
}

function itemsHtml(items: CartItem[]): string {
  return items
    .map((i) => {
      const designLink = i.design_url
        ? `<br/><a href="${i.design_url}" style="color:#7c3aed;">View design file</a>`
        : '';
      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">
            <strong>${escapeHtml(i.name)}</strong><br/>
            <span style="color:#6b7280;font-size:13px;">
              Size: ${escapeHtml(i.size)} &middot; Color: ${escapeHtml(i.color)} &middot; Qty: ${i.qty}
            </span>${designLink}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">
            ${formatPrice(i.base_price * i.qty)}
          </td>
        </tr>`;
    })
    .join('');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function shell(title: string, body: string): string {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#111827;">
      <div style="background:linear-gradient(90deg,#7c3aed,#f43f5e);padding:24px;border-radius:12px 12px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:22px;">${title}</h1>
      </div>
      <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 12px 12px;">
        ${body}
      </div>
      <p style="color:#9ca3af;font-size:12px;text-align:center;">PrintMate AI &middot; custom print-on-demand</p>
    </div>`;
}

/** Customer-facing order confirmation email. */
export function orderEmailHtml(
  order: Pick<
    OrderRecord,
    'id' | 'customer_name' | 'items' | 'subtotal' | 'discount' | 'total' | 'city' | 'postal_code'
  >,
  partnerName: string | null,
): string {
  const shipTo = [order.city, order.postal_code].filter(Boolean).join(' ');
  return shell(
    'Order confirmed 🎉',
    `
      <p>Hi ${escapeHtml(order.customer_name || 'there')},</p>
      <p>Thanks for your order! Here is what is being printed:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        ${itemsHtml(order.items)}
      </table>
      <p style="font-size:14px;color:#6b7280;">
        Subtotal: ${formatPrice(order.subtotal)}<br/>
        ${order.discount > 0 ? `Discount: −${formatPrice(order.discount)}<br/>` : ''}
        <strong style="color:#111827;">Total paid: ${formatPrice(order.total)}</strong>
      </p>
      ${shipTo ? `<p style="font-size:14px;color:#6b7280;">Shipping to: ${escapeHtml(shipTo)}</p>` : ''}
      ${partnerName ? `<p>Your items are being routed to <strong>${escapeHtml(partnerName)}</strong>, our nearest print partner. We will email you when they ship.</p>` : '<p>We are assigning your order to a print partner now. We will email you when it ships.</p>'}
      <p style="color:#9ca3af;font-size:12px;">Order #${escapeHtml(order.id)}</p>
    `,
  );
}

/** Print-partner fulfillment email with design download links. */
export function partnerEmailHtml(
  order: Pick<
    OrderRecord,
    'id' | 'customer_name' | 'email' | 'items' | 'city' | 'postal_code'
  >,
  partner: PrintPartner,
): string {
  const shipTo = [order.city, order.postal_code].filter(Boolean).join(' ');
  return shell(
    'New print job 🖨️',
    `
      <p>Hi ${escapeHtml(partner.name)},</p>
      <p>A new PrintMate AI order needs printing:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        ${itemsHtml(order.items)}
      </table>
      <p style="font-size:14px;color:#6b7280;">
        Customer: ${escapeHtml(order.customer_name)} (${escapeHtml(order.email)})<br/>
        ${shipTo ? `Ship to: ${escapeHtml(shipTo)}<br/>` : ''}
        Order #${escapeHtml(order.id)}
      </p>
      <p>Please print and ship per your SLA, then reply with tracking details.</p>
    `,
  );
}
