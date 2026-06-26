import { eventConfig } from "@/config/event";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { Seat, SeatStatus } from "@/types/domain";

type SeatOrderStatus = {
  seat_id: string | null;
  status: string | null;
};

const seatStatuses: SeatStatus[] = ["available", "reserved", "sold", "blocked"];

export function normalizeSeatStatus(status: unknown): SeatStatus {
  return seatStatuses.includes(status as SeatStatus) ? (status as SeatStatus) : "available";
}

export function applyOrderStatusToSeats(seats: Seat[], orders: SeatOrderStatus[]) {
  const statusBySeat = new Map<string, SeatStatus>();

  for (const order of orders) {
    if (!order.seat_id) {
      continue;
    }

    if (order.status === "paid") {
      statusBySeat.set(order.seat_id, "sold");
      continue;
    }

    if (order.status === "pending_payment" && statusBySeat.get(order.seat_id) !== "sold") {
      statusBySeat.set(order.seat_id, "reserved");
    }
  }

  return seats.map((seat) => ({
    ...seat,
    status: statusBySeat.get(seat.id) ?? normalizeSeatStatus(seat.status)
  }));
}

export async function getEventSeatsWithEffectiveStatus() {
  const supabase = getSupabaseAdmin();
  const [{ data: seats, error: seatsError }, { data: orders, error: ordersError }] = await Promise.all([
    supabase
      .from("seats")
      .select("*")
      .eq("event_id", eventConfig.id)
      .order("row", { ascending: true })
      .order("number", { ascending: true }),
    supabase
      .from("orders")
      .select("seat_id,status")
      .eq("event_id", eventConfig.id)
      .in("status", ["pending_payment", "paid"])
  ]);

  if (seatsError) {
    throw new Error(seatsError.message);
  }

  if (ordersError) {
    throw new Error(ordersError.message);
  }

  return applyOrderStatusToSeats((seats ?? []) as Seat[], (orders ?? []) as SeatOrderStatus[]);
}
