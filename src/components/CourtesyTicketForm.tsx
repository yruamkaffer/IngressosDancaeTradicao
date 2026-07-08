"use client";

import { Gift, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { eventConfig } from "@/config/event";

type ApiResponse =
  | { ok: true; data: { reservationCode: string; ticketCodes: string[] } }
  | { ok: false; error: string; details?: Record<string, string> };

export function CourtesyTicketForm() {
  const router = useRouter();
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerCpf, setBuyerCpf] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setErrors({});
    setLoading(true);

    const response = await fetch("/api/admin/courtesy/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        buyerName,
        buyerPhone,
        buyerCpf,
        buyerEmail,
        quantity
      })
    });

    const payload = (await response.json()) as ApiResponse;
    setLoading(false);

    if (!payload.ok) {
      setMessage(payload.error);
      setErrors(payload.details ?? {});
      return;
    }

    setBuyerName("");
    setBuyerPhone("");
    setBuyerCpf("");
    setBuyerEmail("");
    setQuantity(1);
    setMessage(`Cortesia gerada: ${payload.data.reservationCode}`);
    router.refresh();
    window.setTimeout(() => window.location.reload(), 250);
  }

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-teal text-white">
          <Gift className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-black text-ink">Gerar cortesia da escola</h2>
          <p className="mt-1 text-sm text-ink/65">
            Uso exclusivo do admin. A cortesia nao cobra Pix e gera ticket confirmado automaticamente.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-6">
        <label className="block lg:col-span-2">
          <span className="mb-1 block text-sm font-bold text-ink">Nome completo</span>
          <input className="input" value={buyerName} onChange={(event) => setBuyerName(event.target.value)} />
          {errors.buyerName && <span className="mt-1 block text-sm text-rose">{errors.buyerName}</span>}
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-bold text-ink">Telefone</span>
          <input
            className="input"
            value={buyerPhone}
            onChange={(event) => setBuyerPhone(event.target.value)}
            inputMode="tel"
          />
          {errors.buyerPhone && <span className="mt-1 block text-sm text-rose">{errors.buyerPhone}</span>}
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-bold text-ink">CPF</span>
          <input
            className="input"
            value={buyerCpf}
            onChange={(event) => setBuyerCpf(event.target.value)}
            inputMode="numeric"
          />
          {errors.buyerCpf && <span className="mt-1 block text-sm text-rose">{errors.buyerCpf}</span>}
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-bold text-ink">Quantidade</span>
          <input
            className="input"
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
            inputMode="numeric"
            type="number"
            min={1}
            max={eventConfig.maxSeatsPerOrder}
          />
          {errors.quantity && <span className="mt-1 block text-sm text-rose">{errors.quantity}</span>}
        </label>
        <label className="block lg:col-span-2">
          <span className="mb-1 block text-sm font-bold text-ink">Email</span>
          <input
            className="input"
            value={buyerEmail}
            onChange={(event) => setBuyerEmail(event.target.value)}
            inputMode="email"
            type="email"
          />
          {errors.buyerEmail && <span className="mt-1 block text-sm text-rose">{errors.buyerEmail}</span>}
        </label>
        <div className="flex items-end lg:col-span-2">
          <button type="submit" disabled={loading} className="btn btn-primary min-h-[48px] w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
            Gerar cortesia
          </button>
        </div>
      </form>

      {message && <div className="mt-4 rounded-lg border border-line bg-mist p-3 text-sm text-ink">{message}</div>}
    </section>
  );
}
