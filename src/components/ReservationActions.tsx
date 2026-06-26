"use client";

import { CheckCircle2, Loader2, Trash2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ReservationActionsProps = {
  orderId: string;
  showConfirm?: boolean;
  showCancel?: boolean;
  showDelete?: boolean;
};

export function ReservationActions({
  orderId,
  showConfirm = true,
  showCancel = true,
  showDelete = false
}: ReservationActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<"confirm" | "cancel" | "delete" | null>(null);

  async function run(action: "confirm" | "cancel" | "delete") {
    if (action === "delete") {
      const confirmed = window.confirm(
        "Excluir esta reserva? Os pedidos e tickets serao removidos e os assentos ligados a ela serao liberados."
      );

      if (!confirmed) {
        return;
      }
    }

    setBusy(action);
    const endpoint =
      action === "confirm"
        ? `/api/admin/orders/${orderId}/confirm-payment`
        : action === "cancel"
          ? `/api/admin/orders/${orderId}/cancel`
          : `/api/admin/orders/${orderId}/delete`;

    const response = await fetch(endpoint, { method: "POST" });
    const payload = await response.json();
    setBusy(null);

    if (!payload.ok) {
      window.alert(payload.error ?? "Nao foi possivel concluir a acao.");
      return;
    }

    if (action === "confirm" && payload.data?.email?.ok === false) {
      window.alert(payload.data.email.reason ?? "Pagamento confirmado, mas o email do ticket nao foi enviado.");
    }

    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {showConfirm && (
        <button
          type="button"
          onClick={() => run("confirm")}
          disabled={busy !== null}
          className="btn btn-primary min-h-10 px-3 py-2 text-sm"
        >
          {busy === "confirm" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Confirmar
        </button>
      )}

      {showCancel && (
        <button
          type="button"
          onClick={() => run("cancel")}
          disabled={busy !== null}
          className="btn btn-danger min-h-10 px-3 py-2 text-sm"
        >
          {busy === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
          Cancelar
        </button>
      )}

      {showDelete && (
        <button
          type="button"
          onClick={() => run("delete")}
          disabled={busy !== null}
          className="btn btn-secondary min-h-10 px-3 py-2 text-sm text-rose hover:border-rose hover:text-rose"
        >
          {busy === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Excluir
        </button>
      )}
    </div>
  );
}