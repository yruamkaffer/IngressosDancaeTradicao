import { requestHasAdminSession } from "@/lib/admin-auth";
import { fail, friendlyDatabaseError, ok } from "@/lib/api";
import { maskCpf } from "@/lib/format";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!requestHasAdminSession(request)) {
    return fail("Nao autorizado.", 401);
  }

  const body = await request.json().catch(() => null);
  const ticketCode = typeof body?.ticketCode === "string" ? body.ticketCode.trim() : "";

  if (!ticketCode) {
    return fail("Informe o codigo do ticket.", 422);
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("validate_ticket", {
    p_ticket_code: ticketCode
  });

  if (error) {
    return fail(friendlyDatabaseError(error.message), 404, error.message);
  }

  const validation = Array.isArray(data) ? data[0] : data;
  if (!validation) {
    return fail("Ticket nao encontrado.", 404);
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("buyer_name,buyer_cpf,seats(label)")
    .eq("id", validation.order_id)
    .maybeSingle();

  if (orderError) {
    return fail("Ticket validado, mas nao foi possivel carregar o pedido.", 500, orderError.message);
  }

  return ok({
    ticketCode: validation.ticket_code,
    alreadyUsed: validation.already_used,
    usedAt: validation.used_at,
    buyerName: order?.buyer_name ?? "",
    buyerCpfMasked: order?.buyer_cpf ? maskCpf(order.buyer_cpf) : "",
    seatLabel: order?.seats?.label ?? ""
  });
}
