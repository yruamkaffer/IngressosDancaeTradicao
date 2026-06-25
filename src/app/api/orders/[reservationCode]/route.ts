import { eventConfig } from "@/config/event";
import { fail, ok } from "@/lib/api";
import { formatPhone, maskCpf } from "@/lib/format";
import { firstRelation, relationTicketCode } from "@/lib/supabase/relations";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { reservationCode: string } }
) {
  const supabase = getSupabaseAdmin();
  const reservationCode = params.reservationCode.toUpperCase();

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,event_id,seat_id,buyer_name,buyer_phone,buyer_cpf,reservation_code,status,created_at,updated_at,seats(id,label,row,number,status),tickets(id,ticket_code,used_at,created_at)"
    )
    .eq("event_id", eventConfig.id)
    .eq("reservation_code", reservationCode)
    .maybeSingle();

  if (error) {
    return fail("Nao foi possivel buscar a reserva.", 500, error.message);
  }

  if (!data) {
    return fail("Reserva nao encontrada.", 404);
  }

  return ok({
    id: data.id,
    status: data.status,
    reservationCode: data.reservation_code,
    buyerName: data.buyer_name,
    buyerPhone: formatPhone(data.buyer_phone),
    buyerCpfMasked: maskCpf(data.buyer_cpf),
    seat: firstRelation(data.seats),
    ticketCode: relationTicketCode(data.tickets),
    createdAt: data.created_at
  });
}


