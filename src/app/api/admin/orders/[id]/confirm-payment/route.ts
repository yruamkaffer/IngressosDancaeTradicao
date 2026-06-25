import { requestHasAdminSession } from "@/lib/admin-auth";
import { fail, friendlyDatabaseError, ok } from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!requestHasAdminSession(request)) {
    return fail("Nao autorizado.", 401);
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("confirm_order_payment", {
    p_order_id: params.id
  });

  if (error) {
    return fail(friendlyDatabaseError(error.message), 400, error.message);
  }

  const ticket = Array.isArray(data) ? data[0] : data;
  return ok({ ticketCode: ticket?.ticket_code ?? null });
}
