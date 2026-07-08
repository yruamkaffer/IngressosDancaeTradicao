"use client";

import { ArrowRight, Gift, Loader2, Mail, Minus, Plus, Ticket, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { eventConfig, type TicketTypeId } from "@/config/event";
import { formatCurrency } from "@/lib/format";
import { validateBuyer } from "@/lib/validation";
import type { Seat } from "@/types/domain";

type ApiResponse =
  | { ok: true; data: { reservationCode: string; seatCount: number; ticketType: TicketTypeId; total: number } }
  | { ok: false; error: string; details?: Record<string, string> };

const publicTicketTypes: TicketTypeId[] = ["full", "half"];

export function PurchaseClient({ initialSeats }: { initialSeats: Seat[] }) {
  const router = useRouter();
  const [ticketType, setTicketType] = useState<TicketTypeId>("full");
  const [quantity, setQuantity] = useState(1);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerCpf, setBuyerCpf] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const availableCount = useMemo(
    () => initialSeats.filter((seat) => seat.status === "available").length,
    [initialSeats]
  );
  const selectedTicket = eventConfig.ticketTypes[ticketType];
  const totalPrice = quantity * selectedTicket.price;
  const maxQuantity = Math.min(eventConfig.maxSeatsPerOrder, Math.max(availableCount, 0));

  function updateQuantity(nextQuantity: number) {
    setMessage("");
    setErrors((current) => ({ ...current, quantity: "" }));
    setQuantity(Math.min(Math.max(nextQuantity, 1), Math.max(maxQuantity, 1)));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const parsed = validateBuyer({
      buyerName,
      buyerPhone,
      buyerCpf,
      buyerEmail,
      ticketType,
      quantity
    });

    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }

    setErrors({});
    setLoading(true);

    const response = await fetch("/api/orders/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: eventConfig.id,
        ticketType: parsed.data.ticketType,
        quantity: parsed.data.quantity,
        buyerName: parsed.data.buyerName,
        buyerPhone: parsed.data.buyerPhone,
        buyerCpf: parsed.data.buyerCpf,
        buyerEmail: parsed.data.buyerEmail
      })
    });

    const payload = (await response.json()) as ApiResponse;
    setLoading(false);

    if (!payload.ok) {
      setMessage(payload.error);
      return;
    }

    router.push(`/pagamento/${payload.data.reservationCode}`);
  }

  return (
    <div className="grid min-w-0 gap-6">
      <form onSubmit={handleSubmit} className="card min-w-0 p-5 lg:p-6">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-curtain text-white">
              <UserRound className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-ink">Comprar ingresso</h1>
              <p className="text-sm text-ink/65">
                Inteira {formatCurrency(eventConfig.ticketTypes.full.price)} ou meia/promocional{" "}
                {formatCurrency(eventConfig.ticketTypes.half.price)}. Ate {eventConfig.maxSeatsPerOrder} ingressos por
                compra.
              </p>
            </div>
          </div>
          <div className="rounded-md border border-line bg-mist px-4 py-3 text-sm text-ink/75 lg:max-w-md lg:text-right">
            <div className="font-bold text-ink">Resumo</div>
            <div>
              {quantity} ingresso(s) {selectedTicket.label.toLowerCase()}
            </div>
            <div className="mt-1 font-black text-curtain">Total: {formatCurrency(totalPrice)}</div>
            <div className="mt-1 text-xs text-ink/55">{availableCount} lugares disponiveis de {eventConfig.totalCapacity}.</div>
          </div>
        </div>

        <div className="mb-5 rounded-lg border border-brass/35 bg-brass/15 p-4 text-sm font-bold leading-6 text-ink">
          {eventConfig.arrivalNotice}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <section className="rounded-lg border border-line bg-white/70 p-4">
            <div className="mb-3 flex items-center gap-2 font-bold text-ink">
              <Ticket className="h-4 w-4 text-stage" />
              Tipo de ingresso
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {publicTicketTypes.map((type) => {
                const ticket = eventConfig.ticketTypes[type];
                const active = ticketType === type;

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTicketType(type)}
                    className={`rounded-lg border p-4 text-left transition ${
                      active
                        ? "border-curtain bg-curtain text-white shadow-sm"
                        : "border-line bg-white text-ink hover:border-curtain/45"
                    }`}
                  >
                    <div className="text-sm font-black uppercase">{ticket.label}</div>
                    <div className={`mt-2 text-2xl font-black ${active ? "text-white" : "text-curtain"}`}>
                      {formatCurrency(ticket.price)}
                    </div>
                    <div className={`mt-1 text-sm ${active ? "text-white/75" : "text-ink/60"}`}>
                      QR Code Pix especifico para este valor.
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.ticketType && <span className="mt-2 block text-sm text-rose">{errors.ticketType}</span>}
          </section>

          <section className="rounded-lg border border-line bg-white/70 p-4">
            <div className="text-sm font-bold uppercase text-ink/55">Quantidade</div>
            <div className="mt-3 grid grid-cols-[44px_1fr_44px] items-center gap-2">
              <button
                type="button"
                onClick={() => updateQuantity(quantity - 1)}
                className="btn btn-secondary h-11 min-h-0 px-0"
                aria-label="Diminuir quantidade"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                className="input text-center text-lg font-black"
                value={quantity}
                onChange={(event) => updateQuantity(Number(event.target.value))}
                inputMode="numeric"
              />
              <button
                type="button"
                onClick={() => updateQuantity(quantity + 1)}
                className="btn btn-secondary h-11 min-h-0 px-0"
                aria-label="Aumentar quantidade"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-ink/55">Limite: {eventConfig.maxSeatsPerOrder} ingressos por compra.</p>
            {errors.quantity && <span className="mt-2 block text-sm text-rose">{errors.quantity}</span>}
          </section>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-4">
          <label className="block lg:col-span-2">
            <span className="mb-1 block text-sm font-bold text-ink">Nome completo</span>
            <input
              className="input"
              value={buyerName}
              onChange={(event) => setBuyerName(event.target.value)}
              autoComplete="name"
            />
            {errors.buyerName && <span className="mt-1 block text-sm text-rose">{errors.buyerName}</span>}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-bold text-ink">Telefone</span>
            <input
              className="input"
              value={buyerPhone}
              onChange={(event) => setBuyerPhone(event.target.value)}
              inputMode="tel"
              autoComplete="tel"
              placeholder="DDD + numero"
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
              autoComplete="off"
              placeholder="Somente numeros"
            />
            {errors.buyerCpf && <span className="mt-1 block text-sm text-rose">{errors.buyerCpf}</span>}
          </label>

          <label className="block lg:col-span-2">
            <span className="mb-1 block text-sm font-bold text-ink">Email para receber o ticket</span>
            <input
              className="input"
              value={buyerEmail}
              onChange={(event) => setBuyerEmail(event.target.value)}
              inputMode="email"
              type="email"
              autoComplete="email"
              placeholder="seuemail@exemplo.com"
            />
            {errors.buyerEmail && <span className="mt-1 block text-sm text-rose">{errors.buyerEmail}</span>}
          </label>

          <div className="flex items-end lg:col-span-2">
            <div className="w-full rounded-lg border border-line bg-white/70 p-3 text-sm leading-6 text-ink/65">
              <div className="mb-1 flex items-center gap-2 font-bold text-ink">
                <Mail className="h-4 w-4 text-stage" />
                Envio do ticket
              </div>
              O PDF sera enviado para este email apos confirmacao do pagamento pela organizacao.
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-stretch">
          {message ? (
            <div className="rounded-lg border border-rose/25 bg-rose/10 p-3 text-sm text-rose">{message}</div>
          ) : (
            <div className="rounded-lg border border-line bg-white/70 p-3 text-sm text-ink/65">
              {eventConfig.pixInstructions}
            </div>
          )}

          <button type="submit" disabled={loading || availableCount <= 0} className="btn btn-primary min-h-[52px] w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Ir para o Pix
          </button>
        </div>
      </form>

      <section className="card min-w-0 p-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-teal text-white">
            <Gift className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-ink">Ingresso cortesia</h2>
            <p className="mt-1 text-sm leading-6 text-ink/65">
              A cortesia da escola e gratuita, mas nao e emitida nesta compra publica. Ela so pode ser gerada pela
              escola dentro do painel admin.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
