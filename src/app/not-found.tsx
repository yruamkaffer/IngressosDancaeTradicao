import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-page flex min-h-screen items-center justify-center py-8">
      <section className="card max-w-md p-6 text-center">
        <h1 className="text-2xl font-black text-ink">Pagina nao encontrada</h1>
        <p className="mt-2 text-ink/65">O link informado nao existe ou ainda nao foi liberado.</p>
        <Link href="/" className="btn btn-primary mt-5">
          Voltar ao evento
        </Link>
      </section>
    </main>
  );
}
