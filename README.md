# MVP de venda manual de ingressos

Sistema web simples para venda de ingressos de um espetaculo de danca com escolha manual de assentos, Pix Nubank e validacao manual pelo WhatsApp.

## Stack

- Next.js com TypeScript
- TailwindCSS
- Supabase
- Deploy preparado para Vercel

## Fluxo principal

1. Comprador acessa o evento.
2. Preenche nome, telefone e CPF.
3. Escolhe um assento disponivel no mapa.
4. O backend reserva o assento usando a funcao SQL `reserve_seat`.
5. Comprador paga via Pix Nubank e envia comprovante pelo WhatsApp.
6. Admin confirma manualmente o pagamento.
7. O sistema muda o pedido para `paid`, muda o assento para `sold` e cria o ticket.

Nao ha pagamento automatico, API Pix, webhook ou gateway de pagamento nesta versao.

## Como rodar localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

Acesse `http://localhost:3000`.

## Variaveis de ambiente

Crie `.env.local` com:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`SUPABASE_SERVICE_ROLE_KEY` fica somente no servidor. Nao exponha essa chave no navegador.

## Configurar Supabase

1. Crie um projeto no Supabase.
2. Abra o SQL Editor.
3. Execute `database/schema.sql`.
4. Execute `database/seed.sql`.

Se o banco ja existia com o mapa antigo e ainda nao ha pedidos reais, execute `database/seat-map-640.sql` no SQL Editor para recriar os 640 assentos.
5. Copie `Project URL`, `anon key` e `service_role key` para `.env.local`.

O seed cria o evento com o mesmo `id` definido em `src/config/event.ts` e cria 640 assentos: 96 na plateia esquerda, 320 na plateia central, 96 na plateia direita e 128 no 2º piso.

## Reserva sem venda duplicada

A reserva nao depende apenas do frontend. O endpoint `POST /api/orders/create` chama a funcao SQL `reserve_seat`, que:

- bloqueia a linha do assento com `FOR UPDATE`;
- verifica se o status ainda e `available`;
- cria o pedido com `pending_payment`;
- muda o assento para `reserved`;
- retorna um `reservation_code` unico.

Tambem existe um indice parcial `orders_one_active_per_seat` para impedir mais de um pedido ativo por assento.

## Admin

Acesse `/admin`.

Use a senha configurada em `ADMIN_PASSWORD`.

O painel permite:

- ver dashboard de assentos, reservas e faturamento confirmado;
- confirmar pagamento manual;
- cancelar reserva;
- bloquear e desbloquear assentos;
- exportar CSV de pedidos pagos;
- buscar por nome, CPF, telefone, reserva, ticket ou assento;
- validar ticket e marcar `used_at`.

CPF completo nao aparece no painel, no ticket ou em URLs. A busca por CPF no painel usa hash no navegador para evitar expor o CPF bruto.

## Trocar dados do evento

Edite `src/config/event.ts`.

Se trocar o `id` do evento, atualize tambem o seed ou o registro no Supabase.

## Trocar QR Code Pix Nubank

Substitua `public/pix-qrcode-placeholder.svg` por uma imagem real, por exemplo `public/pix-qrcode-nubank.png`.

Depois altere `pixQrCodeImage` em `src/config/event.ts` para `"/pix-qrcode-nubank.png"`.

## Trocar WhatsApp

Em `src/config/event.ts`, altere `whatsappPhone`. Use DDI + DDD + numero, somente digitos.

## Deploy na Vercel

1. Envie o projeto para um repositorio Git.
2. Importe o repositorio na Vercel.
3. Configure as variaveis de ambiente na Vercel.
4. Rode o deploy.
5. Atualize `NEXT_PUBLIC_SITE_URL` com a URL final do projeto.

## Rotas

- `/` pagina publica do evento
- `/comprar` formulario e mapa de assentos
- `/pagamento/[reservationCode]` instrucoes de Pix e WhatsApp
- `/ticket/[ticketCode]` ticket liberado apos confirmacao
- `/admin` dashboard
- `/admin/reservas` reservas e busca
- `/admin/assentos` mapa administrativo
- `/admin/validar` validacao de tickets

## APIs

- `GET /api/seats`
- `POST /api/orders/create`
- `GET /api/orders/[reservationCode]`
- `POST /api/admin/orders/[id]/confirm-payment`
- `POST /api/admin/orders/[id]/cancel`
- `POST /api/admin/seats/[id]/block`
- `POST /api/admin/seats/[id]/unblock`
- `GET /api/admin/export-csv`
- `POST /api/admin/tickets/validate`

## Observacoes de MVP

- Reservas pendentes nao expiram automaticamente.
- Pagamento e validacao sao 100% manuais.
- O QR Code incluido e placeholder e deve ser trocado pelo QR Code Pix Nubank real.
- RLS esta habilitado nas tabelas; o app usa a service role apenas em rotas server-side.
