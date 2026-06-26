import { CalendarDays, Clock, Facebook, Instagram, MapPin, Phone, ShieldCheck, Ticket } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { eventConfig } from "@/config/event";
import { formatCurrency, formatDate } from "@/lib/format";

export default function HomePage() {
  return (
    <>
      <main>
        <section
          className="relative flex min-h-[78vh] items-center overflow-hidden bg-ink text-white"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(31,27,28,0.9) 0%, rgba(31,27,28,0.72) 44%, rgba(31,27,28,0.22) 100%), url(${eventConfig.heroImage})`,
            backgroundPosition: "center",
            backgroundSize: "cover"
          }}
        >
          <div className="container-page py-10">
            <nav className="absolute left-0 right-0 top-0">
              <div className="container-page flex items-center justify-between py-5">
                <Link
                  href="/"
                  className="inline-flex items-center"
                  aria-label={`${eventConfig.studioName} - início`}
                >
                  <Image
                    src={eventConfig.studioLogoImage}
                    alt={eventConfig.studioName}
                    width={900}
                    height={247}
                    priority
                    className="h-10 w-auto md:h-12"
                  />
                </Link>
                <Link
                  href="/admin"
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-white/25 bg-white/10 px-3 text-sm font-bold text-white shadow-sm backdrop-blur transition hover:border-white/45 hover:bg-white/20"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Admin
                </Link>
              </div>
            </nav>

            <div className="max-w-3xl pt-16">
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-brass">
                {eventConfig.edition}
              </p>
              <h1 className="text-5xl font-black leading-tight text-white md:text-7xl">{eventConfig.name}</h1>
              <p className="mt-5 max-w-2xl text-2xl font-black leading-8 text-brass md:text-3xl">
                {eventConfig.callout}
              </p>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/82">{eventConfig.description}</p>
              <p className="mt-4 text-sm font-bold uppercase tracking-[0.16em] text-white/72">
                Realização: {eventConfig.studioName}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/comprar" className="btn btn-primary">
                  <Ticket className="h-4 w-4" />
                  Comprar ingresso
                </Link>
                <a href="#detalhes" className="btn border border-white/30 bg-white/10 text-white hover:bg-white/20">
                  <CalendarDays className="h-4 w-4" />
                  Ver detalhes
                </a>
                <a
                  href={eventConfig.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn border border-white/30 bg-white/10 text-white hover:bg-white/20"
                >
                  <MapPin className="h-4 w-4" />
                  Como chegar
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="detalhes" className="container-page py-10">
          <div className="grid gap-5 md:grid-cols-3">
            <div className="card p-5">
              <CalendarDays className="mb-3 h-5 w-5 text-curtain" />
              <div className="text-sm font-bold uppercase text-ink/55">Data</div>
              <div className="mt-1 font-bold text-ink">{formatDate(eventConfig.date)}</div>
            </div>
            <div className="card p-5">
              <Clock className="mb-3 h-5 w-5 text-stage" />
              <div className="text-sm font-bold uppercase text-ink/55">Horário</div>
              <div className="mt-1 font-bold text-ink">{eventConfig.time}</div>
            </div>

            <div className="card p-5">
              <Ticket className="mb-3 h-5 w-5 text-rose" />
              <div className="text-sm font-bold uppercase text-ink/55">Ingresso</div>
              <div className="mt-1 font-bold text-ink">{formatCurrency(eventConfig.ticketPrice)}</div>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-curtain">Local do evento</p>
                  <h2 className="mt-2 text-3xl font-black text-ink">{eventConfig.location}</h2>
                </div>
              </div>
              <p className="mb-5 max-w-2xl text-sm leading-6 text-ink/66">{eventConfig.venueSummary}</p>
              <div className="grid gap-5 md:grid-cols-2">
                {eventConfig.venueImages.map((image) => (
                  <figure
                    key={image.src}
                    className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-[0_18px_50px_rgba(31,27,28,0.1)]"
                  >
                    <div className="relative aspect-[16/10] bg-ink/10">
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        sizes="(min-width: 1024px) 320px, (min-width: 768px) calc((100vw - 52px) / 2), calc(100vw - 32px)"
                        className="object-cover"
                      />
                    </div>
                    <figcaption className="space-y-1 px-4 py-3">
                      <span className="text-sm font-black uppercase tracking-[0.14em] text-curtain">{image.label}</span>
                      <p className="text-sm text-ink/66">{image.caption}</p>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>

            <aside className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-[0_18px_50px_rgba(31,27,28,0.1)]">
              <div className="p-5">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal">Mapa</p>
                <h3 className="mt-2 text-2xl font-black text-ink">Chegue pelo Google Maps</h3>
                <p className="mt-2 text-sm leading-6 text-ink/66">
                  Use o mapa para localizar o Teatro CENSUPEG, antigo Teatro da CNEC, em Joinville.
                </p>
                <a href={eventConfig.mapsUrl} target="_blank" rel="noreferrer" className="btn btn-primary mt-4 w-full">
                  <MapPin className="h-4 w-4" />
                  Abrir rota no Maps
                </a>
              </div>
              <div className="aspect-[4/3] border-t border-ink/10 bg-ink/10">
                <iframe
                  title={`Mapa para ${eventConfig.location}`}
                  src={eventConfig.mapsEmbedUrl}
                  className="h-full w-full"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </aside>
          </div>

          <div className="mt-10 grid gap-6 border-y border-ink/10 py-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-curtain">Sobre a escola</p>
              <h2 className="mt-2 text-3xl font-black text-ink">{eventConfig.school.name}</h2>
              <p className="mt-3 max-w-xl leading-7 text-ink/72">
                A escola realiza a mostra e reúne alunos no palco para celebrar a dança, a tradição e o trabalho
                desenvolvido ao longo do ano.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <a
                href={eventConfig.school.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-ink/10 bg-white p-4 text-ink shadow-[0_12px_35px_rgba(31,27,28,0.08)] hover:border-teal/40"
              >
                <MapPin className="mb-3 h-5 w-5 text-teal" />
                <div className="text-sm font-bold uppercase text-ink/55">Endereço</div>
                <div className="mt-1 text-sm font-bold leading-6">{eventConfig.school.address}</div>
                <div className="mt-3 text-sm font-bold text-teal">Ver escola no Maps</div>
              </a>
              <a
                href={eventConfig.school.phoneHref}
                className="rounded-lg border border-ink/10 bg-white p-4 text-ink shadow-[0_12px_35px_rgba(31,27,28,0.08)] hover:border-teal/40"
              >
                <Phone className="mb-3 h-5 w-5 text-stage" />
                <div className="text-sm font-bold uppercase text-ink/55">Telefone</div>
                <div className="mt-1 text-sm font-bold leading-6">{eventConfig.school.phone}</div>
              </a>
              <a
                href={eventConfig.school.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-ink/10 bg-white p-4 text-ink shadow-[0_12px_35px_rgba(31,27,28,0.08)] hover:border-teal/40"
              >
                <Instagram className="mb-3 h-5 w-5 text-rose" />
                <div className="text-sm font-bold uppercase text-ink/55">Instagram</div>
                <div className="mt-1 text-sm font-bold leading-6">{eventConfig.school.instagramHandle}</div>
              </a>
              <a
                href={eventConfig.school.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-ink/10 bg-white p-4 text-ink shadow-[0_12px_35px_rgba(31,27,28,0.08)] hover:border-teal/40"
              >
                <Facebook className="mb-3 h-5 w-5 text-curtain" />
                <div className="text-sm font-bold uppercase text-ink/55">Facebook</div>
                <div className="mt-1 text-sm font-bold leading-6">Dança & Tradição</div>
              </a>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h2 className="text-3xl font-black text-ink">Reserva manual, simples e segura</h2>
              <p className="mt-3 max-w-2xl leading-7 text-ink/72">
                Escolha de 1 a 5 assentos numerados, reserve e pague via Pix. Para pagamento em dinheiro,
                compre diretamente na escola. A organização valida o pagamento manualmente antes de liberar o ticket.
              </p>
            </div>
            <div className="card p-5">
              <div className="text-sm font-bold uppercase text-curtain">Fluxo do ingresso</div>
              <ol className="mt-3 space-y-2 text-sm text-ink/75">
                <li>1. Preencha seus dados, email e escolha ate 5 assentos disponiveis.</li>
                <li>2. Reserve e pague somente pelo Pix informado na tela.</li>
                <li>3. Envie o comprovante no WhatsApp da organização.</li>
                <li>4. O admin confirma o pagamento e o PDF do ticket é enviado por email.</li>
              </ol>
              <Link href="/comprar" className="btn btn-primary mt-5 w-full">
                <Ticket className="h-4 w-4" />
                Começar compra
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-ink/10 bg-ink py-6 text-white">
        <div className="container-page flex flex-col gap-2 text-sm text-white/72 md:flex-row md:items-center md:justify-between">
          <span>© 2026 {eventConfig.credits.rightsOwner}. Todos os direitos reservados.</span>
          <span>Feito por {eventConfig.credits.developer}.</span>
        </div>
      </footer>
    </>
  );
}