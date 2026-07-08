# 🎟️ Dança & Tradição Tickets

<p align="center">
  <img src="./public/danca-tradicao-logo.png" width="280" alt="Dança & Tradição Studio de Danças logo" />
</p>

<h3 align="center">
  A ticket reservation MVP for dance events with ticket types, manual Pix validation and admin management.
</h3>

<p align="center">
  <strong>Next.js · TypeScript · Supabase · Tailwind CSS · Vercel · Ticket QR Code · Manual Payment Flow</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=000000" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

---

## 📌 About the Project

**Dança & Tradição Tickets** is a web application MVP created to manage ticket reservations for a dance show.

The system allows visitors to choose the ticket type, select the quantity, fill in buyer information, pay manually via the Pix QR Code for the selected value and send proof of payment through WhatsApp. After manual payment confirmation by an administrator, the system marks the ticket as sold and generates the final ticket with a QR Code for entrance validation.

This project was designed for a real-world event scenario where simplicity, low cost and operational control are more important than a fully automated payment gateway.

### 🇧🇷 Descrição em Português

O **Dança & Tradição Tickets** é um MVP para venda e reserva de ingressos de espetáculos de dança, com opção de inteira, meia/promocional e cortesia administrativa, pagamento via Pix, validação pelo WhatsApp, painel administrativo e geração de tickets com QR Code após confirmação do pagamento.

---

## 🎯 Project Goal

The main goal is to provide a simple and reliable ticket flow for an event organizer:

1. The buyer accesses the event page.
2. The buyer chooses full price or half/promotional ticket and the quantity.
3. The buyer fills in name, phone, CPF and email.
4. The system creates a reservation in the database.
5. The buyer pays via Pix and sends the receipt through WhatsApp.
6. The admin manually confirms the payment.
7. The system marks the internal capacity seats as sold and creates the ticket QR Codes.

---

## ✨ Features

### Public Area

- 🎭 Event landing page
- 🗺️ Venue and location information
- 📍 Google Maps integration
- 🎟️ Ticket purchase flow
- 🎟️ Ticket type selection: full price and half/promotional
- 🧾 Buyer form with validation
- 💰 Automatic total price calculation
- ⏳ Reservation flow before payment confirmation
- 📲 Pix QR Code by ticket type + WhatsApp manual proof flow
- 🎫 Ticket page with QR Code after admin confirmation
- 🚪 Clear notice that seats are distributed by arrival order at the event

### Admin Area

- 🔐 Admin access protected by password/session cookie
- 📊 Admin dashboard
- 🔎 Search reservations by buyer data, reservation code, ticket or internal capacity seat
- ✅ Manual payment confirmation
- ❌ Reservation cancellation
- 🎁 Courtesy ticket generation by the school/admin
- 🧮 Internal capacity control for 640 places
- 📤 Paid orders CSV export
- 🎫 Ticket validation
- 🕒 Used ticket tracking

### Backend / Data

- 🧠 Supabase database
- 🧩 PostgreSQL functions for reservation and ticket logic
- 🔒 Row Level Security enabled
- 🪑 Internal seat/capacity status control: `available`, `reserved`, `sold`, `blocked`
- 🎟️ Ticket type and value control: `full`, `half`, `courtesy`
- 🎲 Unique reservation and ticket codes
- 🧱 Database-level protection against overselling internal capacity

---

## 🧠 How It Works

```mermaid
flowchart TD
    A[Buyer opens event page] --> B[Chooses ticket type and quantity]
    B --> C[Fills buyer information]
    C --> D[POST /api/orders/create]
    D --> E[Supabase RPC reserve_tickets_by_quantity]
    E --> F[Internal capacity becomes reserved]
    F --> G[Buyer pays through the Pix QR Code for the selected value]
    G --> H[Buyer sends receipt through WhatsApp]
    H --> I[Admin confirms payment]
    I --> J[Internal capacity becomes sold]
    J --> K[Tickets with QR Codes are generated]
    K --> L[Ticket QR Code can be validated at the event]
```

---

## 🏗️ Architecture

```mermaid
flowchart LR
    A[Next.js App Router] --> B[Public Pages]
    A --> C[Admin Pages]
    A --> D[API Routes]
    D --> E[Supabase Service Role Client]
    E --> F[(PostgreSQL Database)]
    F --> G[Events]
    F --> H[Seats]
    F --> I[Orders]
    F --> J[Tickets]
```

The application uses **Next.js App Router** for pages and API routes. Sensitive operations are executed server-side through a Supabase admin client using the service role key.

---

## 🛠️ Tech Stack

### Core

| Technology | Usage |
|---|---|
| Next.js 14 | Application framework and routing |
| React 18 | UI rendering |
| TypeScript | Type safety |
| Tailwind CSS | Styling and layout |
| Supabase | Database and backend services |
| PostgreSQL | Relational data model |
| PL/pgSQL | Reservation and ticket database functions |
| Vercel | Hosting and deployment |

### UI / Developer Experience

| Technology | Usage |
|---|---|
| Lucide React | Icon library |
| QRCode | Ticket QR Code generation |
| ESLint | Code linting |
| PostCSS | CSS processing |
| Autoprefixer | CSS browser compatibility |
| Next Image | Optimized image handling |

---

## 📁 Project Structure

```bash
IngressosDancaeTradicao/
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   ├── seat-map-640.sql
│   └── ticket-types-courtesy-capacity.sql
├── public/
│   ├── danca-tradicao-logo.png
│   ├── pix-qrcode-inteira.svg
│   ├── pix-qrcode-meia.svg
│   ├── pix-qrcode-placeholder.svg
│   ├── teatro-auditorio.jpg
│   └── teatro-fachada.jpg
├── src/
│   ├── app/
│   │   ├── api/
│   │   ├── comprar/
│   │   ├── pagamento/
│   │   ├── ticket/
│   │   └── page.tsx
│   ├── components/
│   │   ├── PurchaseClient.tsx
│   │   ├── CourtesyTicketForm.tsx
│   │   └── AdminSeatMapClient.tsx
│   ├── config/
│   │   └── event.ts
│   ├── lib/
│   └── types/
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 📄 Main Files

| File | Description |
|---|---|
| `src/config/event.ts` | Central event configuration |
| `src/app/page.tsx` | Public event landing page |
| `src/app/comprar/page.tsx` | Ticket purchase page |
| `src/components/PurchaseClient.tsx` | Buyer form, ticket type selection, quantity and reservation submit |
| `src/components/CourtesyTicketForm.tsx` | Admin-only courtesy ticket generator |
| `src/lib/ticket-qr.ts` | Ticket QR Code payload and rendering helpers |
| `src/app/api/orders/create/route.ts` | API route responsible for creating reservations |
| `src/lib/supabase/server.ts` | Server-side Supabase admin client |
| `src/lib/admin-auth.ts` | Admin session/password helpers |
| `database/schema.sql` | Database tables, indexes, functions and RLS setup |
| `database/ticket-types-courtesy-capacity.sql` | Latest migration for ticket types, values, courtesy and hidden capacity control |

---

## ⚙️ Requirements

- Node.js 20+
- npm
- Supabase project
- Vercel account
- Environment variables configured

---

## ▶️ Running Locally

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

If `.env.example` is not available yet, create `.env.local` manually using the variables below.

Run the development server:

```bash
npm run dev
```

Open:

```bash
http://localhost:3000
```

---

## 🔐 Environment Variables

Create `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> Important: `SUPABASE_SERVICE_ROLE_KEY` must only be used server-side. Never expose this key in the browser.

---

## 🗄️ Supabase Setup

1. Create a Supabase project.
2. Open the SQL Editor.
3. Run:

```bash
database/schema.sql
```

4. Run:

```bash
database/seed.sql
```

5. If needed, run the 640-seat capacity script:

```bash
database/seat-map-640.sql
```

The current sales flow does not expose a public seat map. The 640 entries are kept only as internal capacity control:

| Control | Seats |
|---|---:|
| Internal event capacity | 640 |
| **Total** | **640** |

6. Run the latest ticket type/courtesy migration:

```bash
database/ticket-types-courtesy-capacity.sql
```

---

## 🔒 Capacity Reservation Safety

The reservation flow is not protected only by the frontend.

The backend calls a Supabase/PostgreSQL function that:

- checks buyer data
- locks the next available internal capacity rows
- verifies if enough capacity is still available
- creates the order with `pending_payment`
- stores ticket type and ticket value
- changes the internal capacity status to `reserved`
- returns a unique reservation code

The database also includes protections to prevent more than one active order for the same internal capacity seat.

---

## 🎫 Ticket Flow

Ticket generation happens only after manual payment confirmation.

When the admin confirms a payment:

1. the order status becomes `paid`
2. the internal capacity status becomes `sold`
3. a unique ticket code and QR Code are generated
4. the ticket QR Code can be validated at the event entrance
5. the ticket receives a `used_at` timestamp after validation

Courtesy tickets are generated only from the admin panel and are confirmed automatically with value `0`.

---

## 🧪 Available Scripts

```bash
npm run dev
```

Starts the local development server.

```bash
npm run build
```

Builds the production application.

```bash
npm run lint
```

Runs Next.js linting.

```bash
npm run typecheck
```

Runs TypeScript type checking without emitting files.

---

## 🧭 Routes

### Public Routes

| Route | Description |
|---|---|
| `/` | Public event landing page |
| `/comprar` | Buyer form with ticket type and quantity |
| `/pagamento/[reservationCode]` | Pix QR Code and WhatsApp payment instructions |
| `/ticket/[ticketCode]` | Ticket page with QR Code after confirmation |

### Admin Routes

| Route | Description |
|---|---|
| `/admin` | Admin dashboard |
| `/admin/reservas` | Reservation management and search |
| `/admin/assentos` | Internal capacity status overview |
| `/admin/validar` | Ticket validation |

### API Routes

| Route | Description |
|---|---|
| `GET /api/health` | Environment and Supabase diagnostic |
| `GET /api/seats` | Returns seats and their current status |
| `POST /api/orders/create` | Creates a reservation |
| `GET /api/orders/[reservationCode]` | Returns reservation information |
| `POST /api/admin/courtesy/create` | Creates and confirms courtesy tickets |
| `POST /api/admin/orders/[id]/confirm-payment` | Confirms manual payment |
| `POST /api/admin/orders/[id]/cancel` | Cancels a reservation |
| `POST /api/admin/seats/[id]/block` | Blocks a seat |
| `POST /api/admin/seats/[id]/unblock` | Unblocks a seat |
| `GET /api/admin/export-csv` | Exports paid orders as CSV |
| `POST /api/admin/tickets/validate` | Validates a ticket |

---

## 🧪 QA Opportunities

This project is a strong candidate for QA documentation and test practice.

Suggested QA artifacts:

- Manual test plan
- Test cases for reservation creation
- Test cases for capacity oversell prevention
- Test cases for full price, half/promotional and courtesy tickets
- Admin payment confirmation checklist
- Ticket validation checklist
- CSV export validation
- Mobile responsiveness checklist
- Security checklist for exposed data
- Regression checklist after database changes

Example scenarios:

| Scenario | Expected Result |
|---|---|
| Buyer selects full price or half/promotional ticket | Total is calculated with the selected value |
| Buyer selects more than the 10-ticket limit | System prevents the selection |
| Buyer submits invalid CPF | Form shows validation error |
| Two buyers try to reserve the last available capacity at the same time | Only available capacity is reserved |
| Admin creates courtesy ticket | Ticket is confirmed with value `0` |
| Admin confirms payment | Order becomes paid and ticket QR Code is generated |
| Admin validates ticket twice | Second validation shows it was already used |

---

## 📦 Deployment on Vercel

1. Push the project to GitHub.
2. Import the repository on Vercel.
3. Configure all environment variables.
4. Deploy the project.
5. Update `NEXT_PUBLIC_SITE_URL` with the final production URL.
6. Replace the placeholder Pix QR Code images with the real Pix QR Codes:
   - `public/pix-qrcode-inteira.svg`
   - `public/pix-qrcode-meia.svg`

---

## ⚠️ MVP Notes

- Payment is 100% manual.
- There is no Pix API, webhook or payment gateway in this version.
- The Pix QR Code images are placeholders and must be replaced before production usage.
- Ticket QR Codes are generated by the application and include ticket code, reservation code, CPF, buyer name, phone, ticket type and value.
- Public buyers do not choose numbered seats; seats are distributed by arrival order at the event.
- Pending reservations do not expire automatically yet.
- The admin flow depends on `ADMIN_PASSWORD`.
- CPF data should be handled carefully and should not be exposed unnecessarily.
- The service role key must remain server-side only.

---

## 🧭 Roadmap / Future Improvements

- [ ] Add real screenshots to this README
- [ ] Add a live production link
- [ ] Add `.env.example`
- [ ] Add automated tests for validation functions
- [ ] Add tests for reservation API routes
- [ ] Add E2E tests for purchase and admin flows
- [ ] Add automatic reservation expiration
- [ ] Add email provider configuration documentation
- [ ] Add proper authentication for admin users
- [ ] Add rate limiting to public reservation endpoints
- [ ] Add audit log for admin actions
- [ ] Add payment gateway integration as a future optional module
- [ ] Add dashboard charts for sales and occupancy
- [ ] Improve accessibility for the ticket purchase form
- [ ] Add CI workflow with lint, typecheck and build

---

## 💡 What I Learned

This project helped practice:

- building a real-world reservation system
- designing a ticket purchase flow
- working with Next.js App Router
- creating API routes
- integrating Supabase with server-side operations
- modeling relational data for events, seats, orders and tickets
- using PostgreSQL functions to protect critical business rules
- creating an admin dashboard
- handling manual payment workflows
- documenting MVP limitations clearly

---

## 👨‍💻 Author

Developed by **Yruam Käffer de Faria**.
