"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReservationActions({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"confirm" | "cancel" | null>(null);

  async function run(action: "confirm" | "cancel") {
    setBusy(action);
    const endpoint =
      action === "confirm"
        ? `/api/admin/orders/${orderId}/confirm-payment`
        : `/api/admin/orders/${orderId}/cancel`;

    const response = await fetch(endpoint, { method: "POST" });
    const payload = await response.json();
    setBusy(null);

    if (!payload.ok) {
      window.alert(payload.error ?? "Nao foi possivel concluir a acao.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => run("confirm")}
        disabled={busy !== null}
        className="btn btn-primary min-h-10 px-3 py-2 text-sm"
      >
        {busy === "confirm" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        Confirmar
      </button>
      <button
        type="button"
        onClick={() => run("cancel")}
        disabled={busy !== null}
        className="btn btn-danger min-h-10 px-3 py-2 text-sm"
      >
        {busy === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
        Cancelar
      </button>
    </div>
  );
}
