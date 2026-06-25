import Link from "next/link";
import { eventConfig } from "@/config/event";
import { PurchaseClient } from "@/components/PurchaseClient";
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

export default async function ComprarPage() {
  const seats = await getSeats();

  return (
    <main className="container-page py-6">
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <Link href="/" className="text-sm font-bold text-teal hover:text-pine">
            Voltar ao evento
          </Link>
          <p className="mt-1 text-sm text-ink/65">{eventConfig.name}</p>
        </div>
        <p className="rounded-md border border-line bg-white/80 px-3 py-2 text-sm font-bold text-curtain">
          Reserva sugerida: {eventConfig.reservationLimitMinutes} minutos
        </p>
      </div>
      <PurchaseClient initialSeats={seats} />
    </main>
  );
}
