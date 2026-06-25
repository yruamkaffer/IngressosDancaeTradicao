import { CalendarDays, MapPin, Ticket, WalletCards } from "lucide-react";
import Link from "next/link";
import { eventConfig } from "@/config/event";
import { formatCurrency, formatDate } from "@/lib/format";

export default function HomePage() {
  return (
    <main>
      <section
        className="relative flex min-h-[78vh] items-center overflow-hidden bg-ink text-white"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(31,27,28,0.88) 0%, rgba(31,27,28,0.68) 42%, rgba(31,27,28,0.2) 100%), url(${eventConfig.heroImage})`,
          backgroundPosition: "center",
          backgroundSize: "cover"
        }}
      >
        <div className="container-page py-10">
          <nav className="absolute left-0 right-0 top-0">
            <div className="container-page flex items-center justify-between py-5">
              <span className="text-sm font-black uppercase tracking-[0.18em] text-brass">Espetaculo</span>
              <Link href="/admin" className="text-sm font-bold text-white/80 hover:text-white">
                Admin
              </Link>
            </div>
          </nav>

          <div className="max-w-2xl pt-16">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-brass">
              Danca contemporanea
            </p>
            <h1 className="text-5xl font-black leading-tight text-white md:text-7xl">{eventConfig.name}</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/82">{eventConfig.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/comprar" className="btn btn-primary">
                <Ticket className="h-4 w-4" />
                Comprar ingresso
              </Link>
              <a href="#detalhes" className="btn border border-white/30 bg-white/10 text-white hover:bg-white/20">
                <CalendarDays className="h-4 w-4" />
                Ver detalhes
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="detalhes" className="container-page py-10">
        <div className="grid gap-5 md:grid-cols-4">
          <div className="card p-5">
            <CalendarDays className="mb-3 h-5 w-5 text-curtain" />
            <div className="text-sm font-bold uppercase text-ink/55">Data</div>
            <div className="mt-1 font-bold text-ink">{formatDate(eventConfig.date)}</div>
          </div>
          <div className="card p-5">
            <WalletCards className="mb-3 h-5 w-5 text-stage" />
            <div className="text-sm font-bold uppercase text-ink/55">Horario</div>
            <div className="mt-1 font-bold text-ink">{eventConfig.time}</div>
          </div>
          <div className="card p-5">
            <MapPin className="mb-3 h-5 w-5 text-teal" />
            <div className="text-sm font-bold uppercase text-ink/55">Local</div>
            <div className="mt-1 font-bold text-ink">{eventConfig.location}</div>
          </div>
          <div className="card p-5">
            <Ticket className="mb-3 h-5 w-5 text-rose" />
            <div className="text-sm font-bold uppercase text-ink/55">Ingresso</div>
            <div className="mt-1 font-bold text-ink">{formatCurrency(eventConfig.ticketPrice)}</div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 className="text-3xl font-black text-ink">Reserva manual, simples e segura</h2>
            <p className="mt-3 max-w-2xl leading-7 text-ink/72">
              Escolha seu assento numerado, reserve, pague via Pix Nubank e envie o comprovante pelo WhatsApp.
              A organizacao valida o pagamento manualmente antes de liberar o ticket.
            </p>
          </div>
          <div className="card p-5">
            <div className="text-sm font-bold uppercase text-curtain">Fluxo do ingresso</div>
            <ol className="mt-3 space-y-2 text-sm text-ink/75">
              <li>1. Preencha seus dados e escolha um assento disponivel.</li>
              <li>2. Reserve e pague pelo Pix informado na tela.</li>
              <li>3. Envie o comprovante no WhatsApp da organizacao.</li>
              <li>4. O admin confirma o pagamento e o ticket e liberado.</li>
            </ol>
            <Link href="/comprar" className="btn btn-primary mt-5 w-full">
              <Ticket className="h-4 w-4" />
              Comecar compra
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
