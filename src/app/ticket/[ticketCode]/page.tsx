import { CalendarDays, MapPin, TicketCheck } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { eventConfig } from "@/config/event";
import { formatCurrency, formatDate, formatPhone, maskCpf } from "@/lib/format";
import { firstRelation } from "@/lib/supabase/relations";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { buildTicketQrSvgDataUrl } from "@/lib/ticket-qr";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ticket",
  robots: {
    index: false,
    follow: false
  }
};

async function getTicket(ticketCode: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("tickets")
    .select(
      "id,ticket_code,used_at,created_at,orders(id,buyer_name,buyer_phone,buyer_cpf,ticket_type,ticket_price,reservation_code,status,seats(label))"
    )
    .eq("ticket_code", ticketCode.toUpperCase())
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export default async function TicketPage({ params }: { params: { ticketCode: string } }) {
  const ticket = await getTicket(params.ticketCode);

  if (!ticket) {
    notFound();
  }

  const order = firstRelation(ticket.orders);

  if (!order) {
    notFound();
  }

  const ticketType = order.ticket_type === "half" ? "half" : order.ticket_type === "courtesy" ? "courtesy" : "full";
  const ticketConfig = eventConfig.ticketTypes[ticketType];
  const ticketPrice = Number(order.ticket_price ?? ticketConfig.price);
  const qrCode = await buildTicketQrSvgDataUrl({
    ticketCode: ticket.ticket_code,
    reservationCode: order.reservation_code,
    buyerName: order.buyer_name,
    buyerCpf: order.buyer_cpf,
    buyerPhone: order.buyer_phone,
    ticketType,
    ticketTypeLabel: ticketConfig.label,
    ticketPrice
  });

  return (
    <main className="container-page flex min-h-screen items-center py-8">
      <section className="card mx-auto w-full max-w-5xl overflow-hidden">
        <div className="bg-curtain px-6 py-5 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brass">Ingresso confirmado</p>
          <h1 className="mt-2 text-3xl font-black">{eventConfig.name}</h1>
          <p className="mt-1 text-sm font-bold text-white/75">{eventConfig.edition}</p>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1fr_340px]">
          <div className="p-6">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <StatusBadge status={order.status} />
              {ticket.used_at && (
                <span className="rounded-md border border-rose/20 bg-rose/10 px-2 py-1 text-xs font-bold text-rose">
                  Já utilizado
                </span>
              )}
            </div>

            <div className="mb-5 rounded-lg border border-line bg-mist p-4">
              <div className="text-sm font-bold uppercase text-ink/55">Evento</div>
              <div className="mt-1 text-xl font-black text-ink">{eventConfig.name}</div>
              <div className="mt-2 grid gap-2 text-sm font-bold text-ink/70 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-curtain" />
                  {formatDate(eventConfig.date)} às {eventConfig.time}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-teal" />
                  {eventConfig.location}
                </div>
              </div>
              <div className="mt-2 text-sm text-ink/65">{eventConfig.city}</div>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-bold uppercase text-ink/55">Nome</dt>
                <dd className="font-bold text-ink">{order.buyer_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-bold uppercase text-ink/55">CPF</dt>
                <dd className="font-bold text-ink">{maskCpf(order.buyer_cpf)}</dd>
              </div>
              <div>
                <dt className="text-sm font-bold uppercase text-ink/55">Telefone</dt>
                <dd className="font-bold text-ink">{formatPhone(order.buyer_phone)}</dd>
              </div>
              <div>
                <dt className="text-sm font-bold uppercase text-ink/55">Entrada</dt>
                <dd className="font-bold text-ink">Por ordem de chegada</dd>
              </div>
              <div>
                <dt className="text-sm font-bold uppercase text-ink/55">Reserva</dt>
                <dd className="font-bold text-ink">{order.reservation_code}</dd>
              </div>
              <div>
                <dt className="text-sm font-bold uppercase text-ink/55">Valor</dt>
                <dd className="font-bold text-ink">{formatCurrency(ticketPrice)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-bold uppercase text-ink/55">Tipo de ingresso</dt>
                <dd className="font-bold text-ink">{ticketConfig.label}</dd>
              </div>
            </dl>

            <p className="mt-5 rounded-lg border border-brass/35 bg-brass/15 p-3 text-sm font-bold leading-6 text-ink">
              {eventConfig.arrivalNotice}
            </p>

          </div>

          <aside className="border-t border-line bg-mist p-6 lg:border-l lg:border-t-0">
            <div className="mb-3 text-center">
              <div className="text-sm font-black uppercase tracking-[0.16em] text-curtain">QR Code de entrada</div>
              <p className="mt-1 text-xs font-bold text-ink/60">Apresente este código na catraca.</p>
            </div>
            <div className="flex aspect-square items-center justify-center rounded-lg border border-curtain/20 bg-white shadow-sm">
              <Image
                src={qrCode}
                alt={`QR Code do ticket ${ticket.ticket_code}`}
                width={320}
                height={320}
                unoptimized
                className="h-full w-full p-4"
              />
            </div>
            <div className="mt-4 break-all text-center text-xl font-black text-ink">{ticket.ticket_code}</div>
            <p className="mt-2 text-center text-xs text-ink/60">Código individual do ingresso.</p>
            <Link href="/" className="btn btn-secondary mt-5 w-full">
              <TicketCheck className="h-4 w-4" />
              Ver evento
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}


