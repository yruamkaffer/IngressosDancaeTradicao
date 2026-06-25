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
    .update({ status: "available" })
    .eq("event_id", eventConfig.id)
    .eq("id", params.id)
    .eq("status", "blocked")
    .select("*")
    .maybeSingle();

  if (error) {
    return fail("Nao foi possivel desbloquear o assento.", 500, error.message);
  }

  if (!data) {
    return fail("Somente assentos bloqueados podem ser desbloqueados.", 409);
  }

  return ok({ seat: data });
}
