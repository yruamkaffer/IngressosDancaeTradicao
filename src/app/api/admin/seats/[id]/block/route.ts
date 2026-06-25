import { eventConfig } from "@/config/event";
import { requestHasAdminSession } from "@/lib/admin-auth";
import { fail, ok } from "@/lib/api";
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
  const { data, error } = await supabase
    .from("seats")
    .update({ status: "blocked" })
    .eq("event_id", eventConfig.id)
    .eq("id", params.id)
    .eq("status", "available")
    .select("*")
    .maybeSingle();

  if (error) {
    return fail("Nao foi possivel bloquear o assento.", 500, error.message);
  }

  if (!data) {
    return fail("Somente assentos disponiveis podem ser bloqueados.", 409);
  }

  return ok({ seat: data });
}
