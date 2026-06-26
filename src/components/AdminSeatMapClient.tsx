"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Seat } from "@/types/domain";
import { SeatLegend } from "./SeatLegend";
import { SeatMap } from "./SeatMap";

export function AdminSeatMapClient({ seats }: { seats: Seat[] }) {
  const router = useRouter();
  const [busySeatId, setBusySeatId] = useState<string | null>(null);

  async function changeSeat(seat: Seat, action: "block" | "unblock") {
    setBusySeatId(seat.id);
    const response = await fetch(`/api/admin/seats/${seat.id}/${action}`, { method: "POST" });
    const payload = await response.json();
    setBusySeatId(null);

    if (!payload.ok) {
      window.alert(payload.error ?? "Nao foi possivel alterar o assento.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="card min-w-0 overflow-hidden p-5">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Mapa administrativo</h1>
          <p className="text-sm text-ink/65">Bloqueie ou desbloqueie assentos disponiveis manualmente.</p>
        </div>
        <SeatLegend />
      </div>
      <SeatMap
        seats={seats}
        adminMode
        busySeatId={busySeatId}
        onBlock={(seat) => changeSeat(seat, "block")}
        onUnblock={(seat) => changeSeat(seat, "unblock")}
      />
    </div>
  );
}
