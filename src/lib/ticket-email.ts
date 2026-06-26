import { eventConfig } from "@/config/event";
import { buildTicketPdf } from "@/lib/ticket-pdf";
import type { ReservationBundle } from "@/lib/reservations";

export async function sendTicketEmail(bundle: ReservationBundle) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.TICKET_EMAIL_FROM?.trim();

  if (!apiKey || !from || !bundle.buyerEmail) {
    return { ok: false, skipped: true, reason: "Email nao configurado." };
  }

  const pdf = buildTicketPdf(bundle);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: bundle.buyerEmail,
      subject: `Seu ticket - ${eventConfig.name}`,
      html: `
        <div style="font-family:Arial,sans-serif;color:#17142a;line-height:1.5">
          <h1>${eventConfig.name}</h1>
          <p>O pagamento da reserva <strong>${bundle.reservationCode}</strong> foi confirmado.</p>
          <p><strong>Assentos:</strong> ${bundle.seatLabels.join(", ")}</p>
          <p>O PDF do ticket esta anexado a este email.</p>
        </div>
      `,
      attachments: [
        {
          filename: `ticket-${bundle.reservationCode}.pdf`,
          content: pdf.toString("base64")
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    return { ok: false, skipped: false, reason: errorText || response.statusText };
  }

  return { ok: true, skipped: false };
}