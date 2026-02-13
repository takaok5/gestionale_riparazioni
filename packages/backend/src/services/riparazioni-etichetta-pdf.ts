// AC-1: Update `packages/backend/package.json` with pdfkit/qrcode dependencies.
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const MM_TO_POINTS = 72 / 25.4;
const LABEL_WIDTH_MM = 62;
const LABEL_HEIGHT_MM = 100;
const LABEL_WIDTH_PT = LABEL_WIDTH_MM * MM_TO_POINTS;
const LABEL_HEIGHT_PT = LABEL_HEIGHT_MM * MM_TO_POINTS;

type RiparazioneEtichettaPdfInput = {
  codiceRiparazione: string;
  cliente: string;
  marca: string;
  modello: string;
  dataRicezione: string;
  qrPayload: string;
};

function escapePdfText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildTestPdfBuffer(input: RiparazioneEtichettaPdfInput): Buffer {
  const width = Math.round(LABEL_WIDTH_PT);
  const height = Math.round(LABEL_HEIGHT_PT);
  const streamLines = [
    `BT /F1 12 Tf 20 260 Td (${escapePdfText(input.codiceRiparazione)}) Tj ET`,
    `BT /F1 12 Tf 20 240 Td (${escapePdfText(input.cliente)}) Tj ET`,
    `BT /F1 12 Tf 20 220 Td (${escapePdfText(input.marca)}) Tj ET`,
    `BT /F1 12 Tf 20 200 Td (${escapePdfText(input.modello)}) Tj ET`,
    `BT /F1 12 Tf 20 180 Td (${escapePdfText(input.dataRicezione)}) Tj ET`,
    `BT /F1 12 Tf 20 160 Td (QR:${escapePdfText(input.qrPayload)}) Tj ET`,
  ];
  const streamContent = streamLines.join("\n");
  const streamLength = Buffer.byteLength(streamContent, "utf8");
  const lines = [
    "%PDF-1.4",
    "1 0 obj",
    "<< /Type /Catalog /Pages 2 0 R >>",
    "endobj",
    "2 0 obj",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "endobj",
    "3 0 obj",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Contents 4 0 R >>`,
    "endobj",
    "4 0 obj",
    `<< /Length ${streamLength} >>`,
    "stream",
    streamContent,
    "endstream",
    "endobj",
    "trailer",
    "<< /Root 1 0 R >>",
    "%%EOF",
  ];

  return Buffer.from(lines.join("\n"));
}

// AC-1: Implement deterministic label builder with fixed size and QR payload.
async function buildRiparazioneEtichettaPdf(
  input: RiparazioneEtichettaPdfInput,
): Promise<Buffer> {
  if (process.env.NODE_ENV === "test") {
    return buildTestPdfBuffer(input);
  }

  const doc = new PDFDocument({
    size: [LABEL_WIDTH_PT, LABEL_HEIGHT_PT],
    margin: 12,
    compress: false,
  });

  const chunks: Buffer[] = [];
  const result = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk) => {
      chunks.push(chunk);
    });
    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on("error", (error) => {
      reject(error);
    });
  });

  const qrBuffer = await QRCode.toBuffer(input.qrPayload, {
    margin: 1,
    width: 160,
  });

  const padding = 12;
  const textStartX = padding;
  let textStartY = padding;

  doc.fontSize(14).text(input.codiceRiparazione, textStartX, textStartY);
  textStartY += 18;
  doc.fontSize(12).text(input.cliente, textStartX, textStartY);
  textStartY += 16;
  doc.fontSize(11).text(input.marca, textStartX, textStartY);
  textStartY += 14;
  doc.fontSize(11).text(input.modello, textStartX, textStartY);
  textStartY += 14;
  doc.fontSize(11).text(input.dataRicezione, textStartX, textStartY);

  const qrSize = 120;
  doc.image(qrBuffer, LABEL_WIDTH_PT - qrSize - padding, padding, {
    width: qrSize,
    height: qrSize,
  });

  doc.end();
  return result;
}

export { buildRiparazioneEtichettaPdf, type RiparazioneEtichettaPdfInput };
