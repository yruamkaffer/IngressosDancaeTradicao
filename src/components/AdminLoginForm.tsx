"use client";

import { LockKeyhole, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    const payload = await response.json();
    setLoading(false);

    if (!payload.ok) {
      setError(payload.error ?? "Senha invalida.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card mx-auto w-full max-w-md p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-curtain text-white">
          <LockKeyhole className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-ink">Acesso admin</h1>
          <p className="text-sm text-ink/65">Use a senha definida em ADMIN_PASSWORD.</p>
        </div>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-bold text-ink">Senha</span>
        <input
          type="password"
          className="input"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
        />
      </label>
      {error && <div className="mt-3 rounded-lg border border-rose/25 bg-rose/10 p-3 text-sm text-rose">{error}</div>}
      <button type="submit" disabled={loading} className="btn btn-primary mt-5 w-full">
        <LogIn className="h-4 w-4" />
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
