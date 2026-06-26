import { AdminSeatMapClient } from "@/components/AdminSeatMapClient";
import { getEventSeatsWithEffectiveStatus } from "@/lib/seats";

export const dynamic = "force-dynamic";

async function getSeats() {
  return getEventSeatsWithEffectiveStatus();
}

export default async function AdminAssentosPage() {
  const seats = await getSeats();
  return <AdminSeatMapClient seats={seats} />;
}
