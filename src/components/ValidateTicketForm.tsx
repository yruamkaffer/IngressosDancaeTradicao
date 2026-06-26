"use client";

import { SearchCheck } from "lucide-react";
import { useState } from "react";

type ValidationResult = {
  ticketCode: string;
  alreadyUsed: boolean;
  usedAt: string;
  buyerName: string;
  buyerCpfMasked: string;
  seatLabel: string;
};

export function ValidateTicketForm() {
  const [ticketCode, setTicketCode] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    const response = await fetch("/api/admin/tickets/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketCode })
    });

    const payload = await response.json();
    setLoading(false);

    if (!payload.ok) {
      setError(payload.error ?? "Ticket não encontrado.");
      return;
    }

    setResult(payload.data);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
      <form onSubmit={submit} className="card h-fit p-5">
        <h1 className="text-2xl font-bold text-ink">Validar ingresso</h1>
        <p className="mt-1 text-sm text-ink/65">Informe o código impresso no ticket.</p>

        <label className="mt-5 block">
          <span className="mb-1 block text-sm font-bold text-ink">Código do ticket</span>
          <input
            className="input uppercase"
            value={ticketCode}
            onChange={(event) => setTicketCode(event.target.value)}
            placeholder="TCK-..."
            autoComplete="off"
          />
        </label>

        {error && <div className="mt-3 rounded-lg border border-rose/25 bg-rose/10 p-3 text-sm text-rose">{error}</div>}

        <button type="submit" disabled={loading} className="btn btn-primary mt-5 w-full">
          <SearchCheck className="h-4 w-4" />
          {loading ? "Validando..." : "Validar e marcar uso"}
        </button>
      </form>

      <section className="card p-5">
        <h2 className="text-xl font-bold text-ink">Resultado</h2>
        {!result && <p className="mt-3 text-ink/65">A validação aparecerá aqui.</p>}
        {result && (
          <div
            className={`mt-4 rounded-lg border p-4 ${
              result.alreadyUsed
                ? "border-rose/25 bg-rose/10 text-rose"
                : "border-teal/25 bg-teal/10 text-teal"
            }`}
          >
            <div className="text-lg font-black">
              {result.alreadyUsed ? "Ingresso já utilizado" : "Ingresso validado"}
            </div>
            <dl className="mt-4 grid gap-3 text-sm text-ink sm:grid-cols-2">
              <div>
                <dt className="font-bold">Ticket</dt>
                <dd>{result.ticketCode}</dd>
              </div>
              <div>
                <dt className="font-bold">Assento</dt>
                <dd>{result.seatLabel}</dd>
              </div>
              <div>
                <dt className="font-bold">Nome</dt>
                <dd>{result.buyerName}</dd>
              </div>
              <div>
                <dt className="font-bold">CPF</dt>
                <dd>{result.buyerCpfMasked}</dd>
              </div>
              <div>
                <dt className="font-bold">Uso registrado em</dt>
                <dd>{new Date(result.usedAt).toLocaleString("pt-BR")}</dd>
              </div>
            </dl>
          </div>
        )}
      </section>
    </div>
  );
}
