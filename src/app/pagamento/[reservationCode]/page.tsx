import { ArrowLeft, Download, MessageCircle, TicketCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/CopyButton";
import { StatusBadge } from "@/components/StatusBadge";
import { eventConfig } from "@/config/event";
import { buildWhatsAppUrl, formatCurrency, formatPhone, maskCpf } from "@/lib/format";
import { firstRelation, relationTicketCode } from "@/lib/supabase/relations";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getReservation(reservationCode: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,buyer_name,buyer_phone,buyer_cpf,buyer_email,reservation_code,status,created_at,seats(label,status),tickets(ticket_code)"
    )
    .eq("event_id", eventConfig.id)
    .eq("reservation_code", reservationCode.toUpperCase())
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export default async function PagamentoPage({
  params
}: {
  params: { reservationCode: string };
}) {
  const orders = await getReservation(params.reservationCode);
  const firstOrder = orders[0];

  if (!firstOrder) {
    notFound();
  }

  const seats = orders.map((order) => firstRelation(order.seats)).filter(Boolean);
  const seatLabels = seats.map((seat) => seat?.label ?? "").filter(Boolean);
  const ticketCodes = orders.map((order) => relationTicketCode(order.tickets)).filter(Boolean) as string[];
  const allPaid = orders.every((order) => order.status === "paid");
  const allCancelled = orders.every((order) => order.status === "cancelled");
  const status = allPaid ? "paid" : allCancelled ? "cancelled" : "pending_payment";
  const total = orders.length * eventConfig.ticketPrice;

  const whatsappUrl = buildWhatsAppUrl({
    buyerName: firstOrder.buyer_name,
    buyerCpf: firstOrder.buyer_cpf,
    buyerPhone: firstOrder.buyer_phone,
    buyerEmail: firstOrder.buyer_email,
    seatLabels,
    reservationCode: firstOrder.reservation_code
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
              <h1 className="mt-1 text-3xl font-black text-ink">Pagamento via Pix</h1>
            </div>
            <StatusBadge status={status} />
          </div>

          {allPaid && ticketCodes.length > 0 && (
            <div className="mb-5 rounded-lg border border-teal/25 bg-teal/10 p-4 text-teal">
              <div className="font-black">Pagamento confirmado.</div>
              <p className="mt-1 text-sm text-ink/75">
                O PDF do ticket fica disponivel para download e tambem pode ser enviado ao email informado.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <a href={`/api/tickets/${firstOrder.reservation_code}/pdf`} className="btn btn-primary">
                  <Download className="h-4 w-4" />
                  Baixar PDF
                </a>
                <Link href={`/ticket/${ticketCodes[0]}`} className="btn btn-secondary">
                  <TicketCheck className="h-4 w-4" />
                  Abrir ticket
                </Link>
              </div>
            </div>
          )}

          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-line bg-mist p-4">
              <dt className="text-sm font-bold uppercase text-ink/55">Comprador</dt>
              <dd className="mt-1 font-bold text-ink">{firstOrder.buyer_name}</dd>
              <dd className="text-sm text-ink/65">
                {maskCpf(firstOrder.buyer_cpf)} | {formatPhone(firstOrder.buyer_phone)}
              </dd>
              <dd className="text-sm text-ink/65">{firstOrder.buyer_email}</dd>
            </div>
            <div className="rounded-lg border border-line bg-mist p-4">
              <dt className="text-sm font-bold uppercase text-ink/55">Reserva</dt>
              <dd className="mt-1 font-bold text-ink">{firstOrder.reservation_code}</dd>
              <dd className="text-sm text-ink/65">{orders.length} assento(s): {seatLabels.join(", ")}</dd>
            </div>
            <div className="rounded-lg border border-line bg-mist p-4">
              <dt className="text-sm font-bold uppercase text-ink/55">Valor total</dt>
              <dd className="mt-1 font-bold text-ink">{formatCurrency(total)}</dd>
            </div>
            <div className="rounded-lg border border-line bg-mist p-4">
              <dt className="text-sm font-bold uppercase text-ink/55">Recebedor Pix</dt>
              <dd className="mt-1 font-bold text-ink">{eventConfig.pixReceiverName}</dd>
            </div>
          </dl>

          <div className="mt-6 rounded-lg border border-brass/35 bg-brass/15 p-4 text-sm leading-6 text-ink">
            {eventConfig.pixInstructions} Seu ingresso so sera confirmado apos envio do comprovante e validacao manual.
          </div>
        </section>

        <aside className="card h-fit p-5">
          <h2 className="text-xl font-bold text-ink">Dados do Pix</h2>
          <img
            src={eventConfig.pixQrCodeImage}
            alt="QR Code Pix"
            className="mt-4 aspect-square w-full rounded-lg border border-line bg-white object-contain p-3"
          />
          <div className="mt-4 rounded-lg border border-line bg-mist p-3">
            <div className="text-xs font-bold uppercase text-ink/55">Chave Pix</div>
            <div className="break-all font-bold text-ink">{eventConfig.pixKey}</div>
          </div>
          <div className="mt-4 rounded-lg border border-line bg-white p-3 text-sm leading-6 text-ink/70">
            {eventConfig.cashSalesNote}
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