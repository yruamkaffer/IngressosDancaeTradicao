import { readFileSync } from "fs";
import { join } from "path";
import { eventConfig } from "@/config/event";
import type { ReservationBundle } from "@/lib/reservations";

type PdfImage = {
  bytes: Buffer;
  width: number;
  height: number;
};

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

function text(x: number, y: number, size: number, value: string, font = "F1", color = "0.09 0.08 0.16") {
  return `BT ${color} rg /${font} ${size} Tf ${x} ${y} Td (${escapePdfText(value)}) Tj ET`;
}

function rect(x: number, y: number, width: number, height: number, color: string) {
  return `q ${color} rg ${x} ${y} ${width} ${height} re f Q`;
}

function image(name: string, x: number, y: number, width: number, height: number) {
  return `q ${width} 0 0 ${height} ${x} ${y} cm /${name} Do Q`;
}

function lineText(lines: string[], x: number, startY: number, size: number, gap: number, font = "F1", color = "0.09 0.08 0.16") {
  return lines.map((line, index) => text(x, startY - index * gap, size, line, font, color)).join("\n");
}

function getJpegDimensions(bytes: Buffer) {
  let offset = 2;

  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = bytes[offset + 1];
    const length = bytes.readUInt16BE(offset + 2);

    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        height: bytes.readUInt16BE(offset + 5),
        width: bytes.readUInt16BE(offset + 7)
      };
    }

    offset += 2 + length;
  }

  return { width: 1, height: 1 };
}

function loadLogo(): PdfImage | null {
  try {
    const bytes = readFileSync(join(process.cwd(), "public", "danca-tradicao-logo-pdf.jpg"));
    const dimensions = getJpegDimensions(bytes);
    return { bytes, ...dimensions };
  } catch {
    return null;
  }
}

function streamObject(dictionary: string, stream: Buffer | string) {
  const streamBuffer = typeof stream === "string" ? Buffer.from(stream, "latin1") : stream;

  return Buffer.concat([
    Buffer.from(`${dictionary}\nstream\n`, "latin1"),
    streamBuffer,
    Buffer.from("\nendstream", "latin1")
  ]);
}

function buildPdf(objects: Buffer[]) {
  const chunks: Buffer[] = [Buffer.from("%PDF-1.4\n", "latin1")];
  const offsets = [0];
  let size = chunks[0].length;

  objects.forEach((object, index) => {
    offsets.push(size);
    const header = Buffer.from(`${index + 1} 0 obj\n`, "latin1");
    const footer = Buffer.from("\nendobj\n", "latin1");
    chunks.push(header, object, footer);
    size += header.length + object.length + footer.length;
  });

  const xrefOffset = size;
  const xref = [
    `xref\n0 ${objects.length + 1}\n`,
    "0000000000 65535 f \n",
    ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`),
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  ].join("");

  chunks.push(Buffer.from(xref, "latin1"));
  return Buffer.concat(chunks);
}

export function buildTicketPdf(bundle: ReservationBundle) {
  const logo = loadLogo();
  const seats = bundle.seatLabels.join(", ");
  const tickets = bundle.ticketCodes.length > 0 ? bundle.ticketCodes : ["Gerado apos confirmacao"];
  const ticketLines = tickets.map((ticket, index) => `Ticket ${index + 1}: ${ticket}`);
  const logoAspect = logo ? logo.width / logo.height : 1;
  const logoWidth = 136;
  const logoHeight = Math.min(52, logoWidth / logoAspect);

  const content = [
    rect(0, 0, 595, 842, "0.97 0.98 1"),
    rect(0, 724, 595, 118, "0.04 0.09 0.25"),
    rect(0, 714, 595, 10, "0.15 0.39 0.92"),
    logo ? image("Logo", 410, 766 - logoHeight / 2, logoWidth, logoHeight) : text(396, 768, 12, "DANCA & TRADICAO", "F2", "1 1 1"),
    text(42, 795, 10, "INGRESSO CONFIRMADO", "F2", "0.72 0.82 1"),
    text(42, 764, 28, eventConfig.name, "F2", "1 1 1"),
    text(42, 740, 12, `${eventConfig.edition} | ${eventConfig.date} as ${eventConfig.time}`, "F1", "0.88 0.92 1"),
    text(42, 722, 11, eventConfig.location, "F1", "0.88 0.92 1"),

    rect(42, 646, 511, 52, "1 1 1"),
    rect(42, 646, 8, 52, "0.49 0.23 0.93"),
    text(62, 680, 9, "CODIGO DA RESERVA", "F2", "0.29 0.11 0.56"),
    text(62, 658, 19, bundle.reservationCode, "F3", "0.04 0.09 0.25"),
    text(362, 680, 9, "VALOR TOTAL", "F2", "0.29 0.11 0.56"),
    text(362, 658, 18, bundle.totalFormatted, "F2", "0.04 0.09 0.25"),

    rect(42, 474, 246, 132, "1 1 1"),
    rect(307, 474, 246, 132, "1 1 1"),
    text(62, 578, 11, "Comprador", "F2", "0.15 0.39 0.92"),
    text(62, 552, 16, bundle.buyerName, "F2"),
    text(62, 528, 10, `Email: ${bundle.buyerEmail || "Nao informado"}`),
    text(62, 510, 10, `Telefone: ${bundle.buyerPhone}`),
    text(327, 578, 11, "Assentos", "F2", "0.15 0.39 0.92"),
    text(327, 552, 17, seats, "F2"),
    text(327, 528, 10, `${bundle.seatCount} ingresso(s) para apresentacao presencial.`),

    rect(42, 316, 511, 112, "0.94 0.96 1"),
    rect(42, 316, 511, 7, "0.49 0.23 0.93"),
    text(62, 398, 12, "Codigos dos tickets", "F2", "0.29 0.11 0.56"),
    lineText(ticketLines, 62, 372, 12, 20, "F3", "0.04 0.09 0.25"),

    rect(42, 214, 511, 62, "1 1 1"),
    text(62, 250, 12, "Orientacao de entrada", "F2", "0.15 0.39 0.92"),
    text(62, 229, 10, "Apresente este PDF no acesso ao teatro. Cada codigo de ticket e individual."),

    text(42, 154, 10, eventConfig.studioName, "F2", "0.04 0.09 0.25"),
    text(42, 136, 9, eventConfig.school.address, "F1", "0.31 0.31 0.42"),
    text(42, 120, 9, `Contato: ${eventConfig.school.phone}`, "F1", "0.31 0.31 0.42"),
    text(42, 82, 8, "Documento gerado automaticamente apos confirmacao manual do pagamento.", "F1", "0.43 0.43 0.54")
  ].join("\n");

  const contentBuffer = Buffer.from(content, "latin1");
  const logoObjectNumber = logo ? 8 : null;
  const resources = logoObjectNumber
    ? `<< /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> /XObject << /Logo ${logoObjectNumber} 0 R >> >>`
    : "<< /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> >>";

  const objects = [
    Buffer.from("<< /Type /Catalog /Pages 2 0 R >>", "latin1"),
    Buffer.from("<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "latin1"),
    Buffer.from(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources ${resources} /Contents 7 0 R >>`, "latin1"),
    Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", "latin1"),
    Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>", "latin1"),
    Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>", "latin1"),
    streamObject(`<< /Length ${contentBuffer.length} >>`, contentBuffer)
  ];

  if (logo) {
    objects.push(
      streamObject(
        `<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logo.bytes.length} >>`,
        logo.bytes
      )
    );
  }

  return buildPdf(objects);
}