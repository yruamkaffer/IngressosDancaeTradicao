import { getReservationBundle } from "@/lib/reservations";
import { buildTicketPdf } from "@/lib/ticket-pdf";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: { reservationCode: string } }
) {
  const bundle = await getReservationBundle(params.reservationCode);

  if (!bundle) {
    return new Response("Reserva nao encontrada.", { status: 404 });
  }

  if (bundle.status !== "paid") {
    return new Response("O PDF fica disponivel apos confirmacao do pagamento.", { status: 403 });
  }

  const pdf = buildTicketPdf(bundle);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ticket-${bundle.reservationCode}.pdf"`,
      "Cache-Control": "no-store"
    }
  });
}