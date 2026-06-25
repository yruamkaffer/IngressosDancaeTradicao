import { AdminSeatMapClient } from "@/components/AdminSeatMapClient";
import { eventConfig } from "@/config/event";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { Seat } from "@/types/domain";

export const dynamic = "force-dynamic";

async function getSeats() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("seats")
    .select("*")
    .eq("event_id", eventConfig.id)
    .order("row", { ascending: true })
    .order("number", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Seat[];
}

export default async function AdminAssentosPage() {
  const seats = await getSeats();
  return <AdminSeatMapClient seats={seats} />;
}
