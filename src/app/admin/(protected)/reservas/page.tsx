import { createHash } from "crypto";
import { AdminReservationsClient, type AdminReservationRow } from "@/components/AdminReservationsClient";
import { eventConfig } from "@/config/event";
import { formatPhone, maskCpf } from "@/lib/format";
import { relationLabel, relationTicketCode } from "@/lib/supabase/relations";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { AdminOrder } from "@/types/domain";

export const dynamic = "force-dynamic";

function hashCpf(cpf: string) {
  return createHash("sha256").update(cpf.replace(/\D/g, "")).digest("hex");
}

async function getOrders() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("*,seats(label),tickets(ticket_code)")
    .eq("event_id", eventConfig.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as AdminOrder[]).map<AdminReservationRow>((order) => {
    return {
      id: order.id,
      reservationCode: order.reservation_code,
      buyerName: order.buyer_name,
      buyerPhone: formatPhone(order.buyer_phone),
      buyerCpfMasked: maskCpf(order.buyer_cpf),
      buyerCpfHash: hashCpf(order.buyer_cpf),
      seatLabel: relationLabel(order.seats),
      status: order.status,
      ticketCode: relationTicketCode(order.tickets),
      createdAt: order.created_at
    };
  });
}

export default async function AdminReservasPage() {
  const orders = await getOrders();
  return <AdminReservationsClient orders={orders} ticketPrice={eventConfig.ticketPrice} />;
}


