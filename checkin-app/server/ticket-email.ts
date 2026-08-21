import { Resend } from "resend";
import type { Booking, Guest } from "@shared/schema";
import { getTicketDict, type TicketLang } from "@shared/ticket-i18n";
import { renderTicketPdf } from "./ticket-pdf";

const NAVY = "#0B318F";
const CRIMSON = "#B5182A";
const CREAM = "#F7F4EC";
const HAIRLINE = "#E3DECE";
const MUTED = "#6B6558";
const INK = "#221F1A";

// Base URL used to build absolute image links in the e-mail (images must be
// fetched by the recipient's mail client via HTTP, not embedded as MIME
// attachments, so the e-mail loads fast). Defaults to the live production
// site; override with PUBLIC_BASE_URL if the app is hosted elsewhere.
const PUBLIC_BASE_URL =
  process.env.PUBLIC_BASE_URL || "https://nana-matteo-checkin.pplx.app";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildEmailHtml(booking: Booking, guests: Guest[], lang: TicketLang): string {
  const d = getTicketDict(lang);
  const attending = guests.filter((g) => g.selected);
  const primaryName = attending[0]
    ? `${attending[0].last_name} ${attending[0].first_name}`
    : `${booking.last_name} ${booking.first_name}`;

  const itineraryRows = attending
    .map((g) => {
      const rows = [
        `<tr>
          <td style="padding:10px 14px;border-bottom:1px solid ${HAIRLINE};font-size:13px;color:${INK};">
            <strong>${escapeHtml(g.last_name)} ${escapeHtml(g.first_name)}</strong><br/>
            <span style="color:${MUTED};font-size:11px;">${escapeHtml(d.ceremonySegment)} — Hiroshima → Forever Together — 29 MAR 2027, 13:00</span>
          </td>
        </tr>`,
      ];
      if (g.afterparty_optin) {
        rows.push(
          `<tr>
            <td style="padding:0 14px 10px 14px;border-bottom:1px solid ${HAIRLINE};font-size:11px;color:${MUTED};">
              ${escapeHtml(d.afterpartySegment)} — Top of Hiroshima Lounge, Grand Prince Hotel Hiroshima — 18:00–20:00
            </td>
          </tr>`
        );
      }
      return rows.join("");
    })
    .join("");

  const stepsHtml = d.emailWhatsNextSteps
    .map(
      (step, i) => `
      <tr>
        <td style="padding:6px 0;vertical-align:top;width:26px;">
          <div style="width:20px;height:20px;border-radius:50%;background:${NAVY};color:#fff;font-size:11px;font-weight:700;text-align:center;line-height:20px;">${i + 1}</div>
        </td>
        <td style="padding:6px 0 6px 10px;font-size:12.5px;color:${INK};">${escapeHtml(step)}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#EFEDE6;font-family:Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(d.emailPreheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EFEDE6;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:6px;overflow:hidden;max-width:600px;">
          <tr>
            <td style="background:${NAVY};padding:20px 28px;">
              <table role="presentation" width="100%"><tr>
                <td>
                  <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:2px;">${escapeHtml(d.brand)}</span><br/>
                  <span style="color:#C9D3EA;font-size:10px;letter-spacing:0.6px;">${escapeHtml(d.allianceTag)}</span>
                </td>
                <td align="right">
                  <img src="${PUBLIC_BASE_URL}/branding/kratz-alliance.jpg" width="120" alt="Kratz Alliance" style="display:block;border-radius:3px;" />
                </td>
              </tr></table>
            </td>
          </tr>
          <tr><td style="height:4px;background:${CRIMSON};line-height:4px;font-size:0;">&nbsp;</td></tr>
          <tr>
            <td style="padding:28px;">
              <p style="font-size:14px;color:${INK};margin:0 0 14px 0;">${escapeHtml(d.emailGreeting(primaryName))}</p>
              <p style="font-size:13px;color:${INK};line-height:1.6;margin:0 0 18px 0;">${escapeHtml(d.emailIntro)}</p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};border-radius:6px;margin-bottom:20px;">
                <tr>
                  <td style="padding:14px 16px;">
                    <span style="font-size:10px;color:${MUTED};letter-spacing:0.6px;">${escapeHtml(d.emailBookingLabel).toUpperCase()}</span><br/>
                    <span style="font-size:16px;font-weight:700;color:${INK};letter-spacing:1px;">${escapeHtml(booking.booking_code)}</span>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td style="border-radius:6px;overflow:hidden;">
                    <img src="${PUBLIC_BASE_URL}/branding/hero-photo.jpg" width="544" alt="" style="display:block;width:100%;max-width:544px;border-radius:6px;" />
                  </td>
                </tr>
              </table>

              <p style="font-size:12px;font-weight:700;color:${NAVY};letter-spacing:0.6px;text-transform:uppercase;margin:0 0 8px 0;">${escapeHtml(d.emailItineraryHeading)}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${HAIRLINE};border-radius:6px;margin-bottom:8px;">
                ${itineraryRows}
              </table>
              <p style="font-size:11.5px;color:${MUTED};margin:0 0 22px 0;">${escapeHtml(d.emailAttachmentNote)}</p>

              <p style="font-size:12px;font-weight:700;color:${NAVY};letter-spacing:0.6px;text-transform:uppercase;margin:0 0 8px 0;">${escapeHtml(d.emailWhatsNextHeading)}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                ${stepsHtml}
              </table>

              <p style="font-size:13px;color:${INK};line-height:1.6;margin:0 0 4px 0;">${escapeHtml(d.emailClosing)}</p>
              <p style="font-size:13px;color:${INK};font-weight:700;margin:0;">${escapeHtml(d.emailSignature)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;background:${CREAM};border-top:1px solid ${HAIRLINE};">
              <p style="font-size:10px;color:${MUTED};margin:0;">${escapeHtml(d.emailFooterNote)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendTicketEmail(
  booking: Booking,
  guests: Guest[],
  lang: TicketLang,
  toEmail: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");

  const resend = new Resend(apiKey);
  const pdfBuffer = await renderTicketPdf(booking, guests, lang);
  const d = getTicketDict(lang);
  const subject = d.emailSubject.replace("{code}", booking.booking_code);
  const html = buildEmailHtml(booking, guests, lang);

  const { error } = await resend.emails.send({
    from: "Nana & Matteo <onboarding@resend.dev>",
    to: [toEmail],
    subject,
    html,
    attachments: [
      {
        filename: `${d.brand}-${booking.booking_code}-ticket.pdf`,
        content: pdfBuffer,
      },
    ],
  });

  if (error) {
    throw new Error(typeof error === "string" ? error : JSON.stringify(error));
  }
}
