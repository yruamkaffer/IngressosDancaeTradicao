import { eventConfig } from "@/config/event";
import type { ReservationBundle } from "@/lib/reservations";

function escapePdfText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00e7/g, "c")
    .replace(/\u00c7/g, "C")
    .replace(/\u00aa/g, "a")
    .replace(/\u00ba/g, "o")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function text(x: number, y: number, size: number, value: string, font = "F1") {
  return `BT /${font} ${size} Tf ${x} ${y} Td (${escapePdfText(value)}) Tj ET`;
}

function rect(x: number, y: number, width: number, height: number, color: string) {
  return `q ${color} rg ${x} ${y} ${width} ${height} re f Q`;
}

function lineText(lines: string[], x: number, startY: number, size: number, gap: number, font = "F1") {
  return lines.map((line, index) => text(x, startY - index * gap, size, line, font)).join("\n");
}

export function buildTicketPdf(bundle: ReservationBundle) {
  const seats = bundle.seatLabels.join(", ");
  const tickets = bundle.ticketCodes.length > 0 ? bundle.ticketCodes : ["Gerado apos confirmacao"];
  const ticketLines = tickets.map((ticket, index) => `Ticket ${index + 1}: ${ticket}`);

  const content = [
    rect(0, 0, 595, 842, "0.96 0.97 1"),
    rect(38, 626, 519, 156, "0.14 0.09 0.36"),
    rect(38, 626, 519, 16, "0.15 0.39 0.92"),
    text(58, 738, 29, eventConfig.name, "F2"),
    text(58, 711, 13, eventConfig.edition, "F2"),
    text(58, 686, 12, `${eventConfig.studioName} | ${eventConfig.date} as ${eventConfig.time}`),
    text(58, 665, 12, eventConfig.location),
    rect(410, 681, 110, 45, "1 1 1"),
    text(430, 708, 11, "RESERVA", "F2"),
    text(430, 690, 13, bundle.reservationCode, "F2"),
    text(58, 588, 18, "Ingresso confirmado", "F2"),
    text(58, 562, 12, `Comprador: ${bundle.buyerName}`),
    text(58, 542, 12, `Email: ${bundle.buyerEmail}`),
    text(58, 522, 12, `Assentos: ${seats}`),
    text(58, 502, 12, `Valor total: ${bundle.totalFormatted}`),
    rect(58, 390, 480, 88, "1 1 1"),
    text(78, 448, 13, "Codigos dos tickets", "F2"),
    lineText(ticketLines, 78, 425, 11, 18),
    rect(58, 305, 480, 58, "0.90 0.94 1"),
    text(78, 340, 12, "Apresente este PDF na entrada do teatro.", "F2"),
    text(78, 320, 10, "O ticket e valido apenas apos confirmacao manual do pagamento pela organizacao."),
    text(58, 254, 10, "Danca & Tradicao Studio de Dancas"),
    text(58, 238, 10, eventConfig.school.address),
    text(58, 222, 10, `Contato: ${eventConfig.school.phone}`)
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "latin1");
}