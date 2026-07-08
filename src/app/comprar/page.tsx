import Link from "next/link";
import { eventConfig } from "@/config/event";
import { PurchaseClient } from "@/components/PurchaseClient";
import { getEventSeatsWithEffectiveStatus } from "@/lib/seats";
import type { Seat } from "@/types/domain";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getSeats() {
  return getEventSeatsWithEffectiveStatus();
}

export default async function ComprarPage() {
  const result = await getSeats().then(
    (seats) => ({ seats, error: null as string | null }),
    (error) => ({
      seats: [] as Seat[],
      error: error instanceof Error ? error.message : "Não foi possível carregar a capacidade de ingressos."
    })
  );

  if (result.error) {
    return (
      <main className="container-page flex min-h-screen items-center py-8">
        <section className="card mx-auto max-w-2xl p-6">
          <Link href="/" className="text-sm font-bold text-teal hover:text-pine">
            Voltar ao evento
          </Link>
          <h1 className="mt-4 text-2xl font-black text-ink">Não foi possível carregar a capacidade</h1>
          <p className="mt-2 text-ink/70">
            Verifique as variáveis de ambiente da Vercel e se o SQL do Supabase foi executado.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-lg border border-line bg-mist p-3 text-sm text-rose">
            {result.error}
          </pre>
          <p className="mt-4 text-sm text-ink/65">
            Abra <code>/api/health</code> na URL do site para ver o diagnóstico sem expor chaves secretas.
          </p>
        </section>
      </main>
    );
  }

  const seats = result.seats;

  return (
    <main className="container-purchase overflow-x-hidden py-6">
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <Link href="/" className="text-sm font-bold text-teal hover:text-pine">
            Voltar ao evento
          </Link>
          <p className="mt-1 text-sm text-ink/65">{eventConfig.name}</p>
        </div>
        <p className="rounded-md border border-line bg-white/80 px-3 py-2 text-sm font-bold text-curtain">
          Capacidade controlada: {eventConfig.totalCapacity} lugares
        </p>
      </div>
      <PurchaseClient initialSeats={seats} />
    </main>
  );
}
