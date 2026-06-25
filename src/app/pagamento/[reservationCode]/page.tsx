import { ArrowLeft, MessageCircle, TicketCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/CopyButton";
import { StatusBadge } from "@/components/StatusBadge";
import { eventConfig } from "@/config/event";
import { buildWhatsAppUrl, formatCurrency, formatPhone, maskCpf } from "@/lib/format";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getOrder(reservationCode: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,buyer_name,buyer_phone,buyer_cpf,reservation_code,status,created_at,seats(label,status),tickets(ticket_code)"
    )
    .eq("event_id", eventConfig.id)
    .eq("reservation_code", reservationCode.toUpperCase())
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export default async function PagamentoPage({
  params
}: {
  params: { reservationCode: string };
}) {
  const order = await getOrder(params.reservationCode);

  if (!order || !order.seats) {
    notFound();
  }

  const ticket = Array.isArray(order.tickets) ? order.tickets[0] : null;
  const seatLabel = order.seats.label;
  const whatsappUrl = buildWhatsAppUrl({
    buyerName: order.buyer_name,
    buyerCpf: order.buyer_cpf,
    buyerPhone: order.buyer_phone,
    seatLabel,
    reservationCode: order.reservation_code
  });

  return (
    <main className="container-page py-6">
      <Link href="/comprar" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-teal">
        <ArrowLeft className="h-4 w-4" />
        Voltar para compra
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="card p-6">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase text-curtain">Reserva criada</p>
              <h1 className="mt-1 text-3xl font-black text-ink">Pagamento via Pix Nubank</h1>
            </div>
            <StatusBadge status={order.status} />
          </div>

          {ticket?.ticket_code && (
            <div className="mb-5 rounded-lg border border-teal/25 bg-teal/10 p-4 text-teal">
              <div className="font-black">Pagamento confirmado.</div>
              <p className="mt-1 text-sm text-ink/75">Seu ticket ja esta liberado.</p>
              <Link href={`/ticket/${ticket.ticket_code}`} className="btn btn-primary mt-3">
                <TicketCheck className="h-4 w-4" />
                Abrir ticket
              </Link>
            </div>
          )}

          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-line bg-mist p-4">
              <dt className="text-sm font-bold uppercase text-ink/55">Comprador</dt>
              <dd className="mt-1 font-bold text-ink">{order.buyer_name}</dd>
              <dd className="text-sm text-ink/65">
                {maskCpf(order.buyer_cpf)} | {formatPhone(order.buyer_phone)}
              </dd>
            </div>
            <div className="rounded-lg border border-line bg-mist p-4">
              <dt className="text-sm font-bold uppercase text-ink/55">Reserva</dt>
              <dd className="mt-1 font-bold text-ink">{order.reservation_code}</dd>
              <dd className="text-sm text-ink/65">Assento {seatLabel}</dd>
            </div>
            <div className="rounded-lg border border-line bg-mist p-4">
              <dt className="text-sm font-bold uppercase text-ink/55">Valor</dt>
              <dd className="mt-1 font-bold text-ink">{formatCurrency(eventConfig.ticketPrice)}</dd>
            </div>
            <div className="rounded-lg border border-line bg-mist p-4">
              <dt className="text-sm font-bold uppercase text-ink/55">Recebedor Pix</dt>
              <dd className="mt-1 font-bold text-ink">{eventConfig.pixReceiverName}</dd>
            </div>
          </dl>

          <div className="mt-6 rounded-lg border border-brass/35 bg-brass/15 p-4 text-sm leading-6 text-ink">
            Seu ingresso so sera confirmado apos envio do comprovante e validacao manual da organizacao.
          </div>
        </section>

        <aside className="card h-fit p-5">
          <h2 className="text-xl font-bold text-ink">Dados do Pix</h2>
          <img
            src={eventConfig.pixQrCodeImage}
            alt="QR Code Pix Nubank"
            className="mt-4 aspect-square w-full rounded-lg border border-line bg-white object-contain p-3"
          />
          <div className="mt-4 rounded-lg border border-line bg-mist p-3">
            <div className="text-xs font-bold uppercase text-ink/55">Chave Pix Nubank</div>
            <div className="break-all font-bold text-ink">{eventConfig.pixKey}</div>
          </div>
          <div className="mt-4 grid gap-3">
            <CopyButton value={eventConfig.pixKey} label="Copiar chave Pix" />
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
              <MessageCircle className="h-4 w-4" />
              Enviar comprovante
            </a>
          </div>
        </aside>
      </div>
    </main>
  );
}
