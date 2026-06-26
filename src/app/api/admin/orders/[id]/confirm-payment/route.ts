import { requestHasAdminSession } from "@/lib/admin-auth";
import { fail, friendlyDatabaseError, ok } from "@/lib/api";
import { getReservationBundle } from "@/lib/reservations";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sendTicketEmail } from "@/lib/ticket-email";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!requestHasAdminSession(request)) {
    return fail("Nao autorizado.", 401);
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("confirm_reservation_payment", {
    p_order_id: params.id
  });

  if (error) {
    return fail(friendlyDatabaseError(error.message), 400, error.message);
  }

  const rows = Array.isArray(data) ? data : data ? [data] : [];
  const reservationCode = rows[0]?.reservation_code;
  const bundle = reservationCode ? await getReservationBundle(reservationCode) : null;
  const email = bundle ? await sendTicketEmail(bundle) : { ok: false, skipped: true, reason: "Reserva nao encontrada." };

  return ok({
    ticketCodes: rows.map((row) => row.ticket_code).filter(Boolean),
    reservationCode,
    email
  });
}