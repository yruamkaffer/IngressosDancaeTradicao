import { eventConfig } from "@/config/event";
import { fail, ok } from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("seats")
    .select("*")
    .eq("event_id", eventConfig.id)
    .order("row", { ascending: true })
    .order("number", { ascending: true });

  if (error) {
    return fail("Nao foi possivel carregar os assentos.", 500, error.message);
  }

  return ok({ seats: data ?? [] });
}
