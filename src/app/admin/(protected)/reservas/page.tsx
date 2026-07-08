import { createHash } from "crypto";
import { AdminReservationsClient, type AdminReservationRow } from "@/components/AdminReservationsClient";
import { eventConfig } from "@/config/event";
import { formatPhone, maskCpf } from "@/lib/format";
import { relationLabel, relationTicketCode } from "@/lib/supabase/relations";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { AdminOrder } from "@/types/domain";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

function hashCpf(cpf: string) {
  return createHash("sha256").update(cpf.replace(/\D/g, "")).digest("hex");
}

function normalizeReservationCode(code: string) {
  return code.trim().toUpperCase();
}

function groupedStatus(statuses: string[]) {
  if (statuses.every((status) => status === "paid")) {
    return "paid";
  }
  if (statuses.every((status) => status === "cancelled")) {
    return "cancelled";
  }
  return "pending_payment";
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

  const groups = new Map<string, AdminOrder[]>();
  for (const order of (data ?? []) as AdminOrder[]) {
    const reservationCode = normalizeReservationCode(order.reservation_code);
    const list = groups.get(reservationCode) ?? [];
    list.push(order);
    groups.set(reservationCode, list);
  }

  return Array.from(groups.values()).map<AdminReservationRow>((orders) => {
    const first = orders[0];
    const seatLabels = orders.map((order) => relationLabel(order.seats)).filter(Boolean);
    const ticketCodes = orders.map((order) => relationTicketCode(order.tickets)).filter(Boolean) as string[];
    const ticketTypeCounts = new Map<string, number>();
    let total = 0;

    for (const order of orders) {
      const ticketType = order.ticket_type === "half" ? "half" : order.ticket_type === "courtesy" ? "courtesy" : "full";
      const ticketConfig = eventConfig.ticketTypes[ticketType];
      ticketTypeCounts.set(ticketConfig.label, (ticketTypeCounts.get(ticketConfig.label) ?? 0) + 1);
      total += Number(order.ticket_price ?? ticketConfig.price);
    }

    return {
      id: first.id,
      reservationCode: normalizeReservationCode(first.reservation_code),
      buyerName: first.buyer_name,
      buyerPhone: formatPhone(first.buyer_phone),
      buyerEmail: first.buyer_email ?? "",
      buyerCpfMasked: maskCpf(first.buyer_cpf),
      buyerCpfHash: hashCpf(first.buyer_cpf),
      seatLabel: seatLabels.length > 0 ? seatLabels.join(", ") : "Controle interno",
      seatCount: orders.length,
      ticketTypes: Array.from(ticketTypeCounts.entries())
        .map(([label, count]) => `${count}x ${label}`)
        .join(", "),
      total,
      status: groupedStatus(orders.map((order) => order.status)),
      ticketCode: ticketCodes.join(", ") || null,
      createdAt: first.created_at
    };
  });
}

export default async function AdminReservasPage() {
  const orders = await getOrders();
  return <AdminReservationsClient orders={orders} />;
}
