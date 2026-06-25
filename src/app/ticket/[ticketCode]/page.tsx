import { CalendarDays, MapPin, QrCode, TicketCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { eventConfig } from "@/config/event";
import { formatCurrency, formatDate, formatPhone, maskCpf } from "@/lib/format";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getTicket(ticketCode: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("tickets")
    .select(
      "id,ticket_code,used_at,created_at,orders(id,buyer_name,buyer_phone,buyer_cpf,reservation_code,status,seats(label))"
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

  if (!ticket || !ticket.orders) {
    notFound();
  }

  const order = ticket.orders;

  return (
    <main className="container-page flex min-h-screen items-center py-8">
      <section className="card mx-auto w-full max-w-3xl overflow-hidden">
        <div className="bg-curtain px-6 py-5 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brass">Ingresso confirmado</p>
          <h1 className="mt-2 text-3xl font-black">{eventConfig.name}</h1>
        </div>

        <div className="grid gap-0 md:grid-cols-[1fr_220px]">
          <div className="p-6">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <StatusBadge status={order.status} />
              {ticket.used_at && (
                <span className="rounded-md border border-rose/20 bg-rose/10 px-2 py-1 text-xs font-bold text-rose">
                  Ja utilizado
                </span>
              )}
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
                <dt className="text-sm font-bold uppercase text-ink/55">Assento</dt>
                <dd className="font-bold text-ink">{order.seats?.label}</dd>
              </div>
              <div>
                <dt className="text-sm font-bold uppercase text-ink/55">Reserva</dt>
                <dd className="font-bold text-ink">{order.reservation_code}</dd>
              </div>
              <div>
                <dt className="text-sm font-bold uppercase text-ink/55">Valor</dt>
                <dd className="font-bold text-ink">{formatCurrency(eventConfig.ticketPrice)}</dd>
              </div>
            </dl>

            <div className="mt-6 grid gap-3 text-sm text-ink/72 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-curtain" />
                {formatDate(eventConfig.date)} as {eventConfig.time}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-teal" />
                {eventConfig.location}
              </div>
            </div>
          </div>

          <aside className="border-t border-line bg-mist p-6 md:border-l md:border-t-0">
            <div className="flex aspect-square items-center justify-center rounded-lg border border-line bg-white">
              <QrCode className="h-24 w-24 text-curtain" />
            </div>
            <div className="mt-4 break-all text-center text-lg font-black text-ink">{ticket.ticket_code}</div>
            <p className="mt-2 text-center text-xs text-ink/60">Valide este codigo na entrada.</p>
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
