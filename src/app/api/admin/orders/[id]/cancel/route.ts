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
  const { error } = await supabase.rpc("cancel_order", {
    p_order_id: params.id
  });

  if (error) {
    return fail(friendlyDatabaseError(error.message), 400, error.message);
  }

  return ok({ cancelled: true });
}
