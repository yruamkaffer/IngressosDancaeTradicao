import { eventConfig } from "@/config/event";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${date}T00:00:00Z`));
}

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function maskCpf(value: string) {
  const digits = onlyDigits(value);
  if (digits.length !== 11) {
    return "***.***.***-**";
  }

  return `***.***.${digits.slice(6, 9)}-**`;
}

export function formatPhone(value: string) {
  const digits = onlyDigits(value);
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return value;
}

export function normalizeCpf(value: string) {
  return onlyDigits(value);
}

export function normalizePhone(value: string) {
  return onlyDigits(value);
}

export function buildWhatsAppUrl(input: {
  buyerName: string;
  buyerCpf: string;
  buyerPhone: string;
  seatLabel: string;
  reservationCode: string;
}) {
  const message = [
    "Ola! Fiz a reserva do ingresso para o espetaculo.",
    `Nome: ${input.buyerName}`,
    `CPF: ${maskCpf(input.buyerCpf)}`,
    `Telefone: ${formatPhone(input.buyerPhone)}`,
    `Assento: ${input.seatLabel}`,
    `Codigo da reserva: ${input.reservationCode}`,
    "Segue o comprovante do Pix."
  ].join("\n");

  return `https://wa.me/${eventConfig.whatsappPhone}?text=${encodeURIComponent(message)}`;
}

export function orderStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending_payment: "Aguardando pagamento",
    paid: "Pago",
    cancelled: "Cancelado"
  };
  return labels[status] ?? status;
}

export function seatStatusLabel(status: string) {
  const labels: Record<string, string> = {
    available: "Disponivel",
    reserved: "Reservado",
    sold: "Vendido",
    blocked: "Bloqueado"
  };
  return labels[status] ?? status;
}
