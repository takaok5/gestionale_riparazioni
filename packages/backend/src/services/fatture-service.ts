import { createFatturaPdfPath } from "./fatture-pdf-service.js";
import { getApprovedPreventivoForRiparazioneForTests } from "./preventivi-service.js";
import {
  createCheckoutSession,
  verifyWebhookSignature,
} from "./stripe-service.js";

interface CreateFatturaInput {
  riparazioneId: unknown;
}

interface CreatePagamentoInput {
  fatturaId: unknown;
  importo: unknown;
  metodo: unknown;
  dataPagamento?: unknown;
}

interface CreateStripeCheckoutLinkInput {
  fatturaId: unknown;
}

interface HandleStripeWebhookInput {
  signature: unknown;
  payload: unknown;
}

interface GetFatturaDetailInput {
  fatturaId: unknown;
}

interface ListFattureInput {
  page?: unknown;
  limit?: unknown;
  stato?: unknown;
  dataDa?: unknown;
  dataA?: unknown;
}

interface SeedFatturaReportInput {
  id?: number;
  riparazioneId?: number;
  dataEmissione: string;
  totale: number;
  totalePagato: number;
  stato?: FatturaStato;
}

interface GetFatturaPdfInput {
  fatturaId: unknown;
}

interface FatturaVocePayload {
  tipo: string;
  descrizione: string;
  articoloId?: number;
  quantita: number;
  prezzoUnitario: number;
}

interface PagamentoPayload {
  id: number;
  fatturaId: number;
  importo: number;
  metodo: string;
  dataPagamento: string;
}

type FatturaStato = "EMESSA" | "PAGATA";

interface FatturaPayload {
  id: number;
  riparazioneId: number;
  numeroFattura: string;
  stato: FatturaStato;
  dataEmissione: string;
  subtotale: number;
  iva: number;
  totale: number;
  totalePagato: number;
  residuo: number;
  pdfPath: string;
  voci: FatturaVocePayload[];
  pagamenti: PagamentoPayload[];
}

interface CreatePagamentoPayload {
  id: number;
  fatturaId: number;
  importo: number;
  metodo: string;
  dataPagamento: string;
  fattura: {
    id: number;
    stato: FatturaStato;
    totale: number;
    totalePagato: number;
    residuo: number;
  };
}

type ValidationFailure = {
  ok: false;
  code: "VALIDATION_ERROR";
  details: {
    field: string;
    rule: string;
  };
  message?: string;
};

type NoApprovedPreventivoFailure = {
  ok: false;
  code: "NO_APPROVED_PREVENTIVO";
};

type InvoiceAlreadyExistsFailure = {
  ok: false;
  code: "INVOICE_ALREADY_EXISTS";
};

type ServiceUnavailableFailure = {
  ok: false;
  code: "SERVICE_UNAVAILABLE";
};

type InvalidApprovedPreventivoFailure = {
  ok: false;
  code: "INVALID_APPROVED_PREVENTIVO";
};

type FatturaNotFoundFailure = {
  ok: false;
  code: "FATTURA_NOT_FOUND";
};

type OverpaymentFailure = {
  ok: false;
  code: "OVERPAYMENT_NOT_ALLOWED";
};

type InvoiceAlreadyPaidFailure = {
  ok: false;
  code: "INVOICE_ALREADY_PAID";
};

type InvalidSignatureFailure = {
  ok: false;
  code: "INVALID_SIGNATURE";
};

type CreateFatturaResult =
  | { ok: true; data: FatturaPayload }
  | ValidationFailure
  | NoApprovedPreventivoFailure
  | InvoiceAlreadyExistsFailure
  | InvalidApprovedPreventivoFailure
  | ServiceUnavailableFailure;

type CreatePagamentoResult =
  | { ok: true; data: CreatePagamentoPayload }
  | ValidationFailure
  | FatturaNotFoundFailure
  | OverpaymentFailure
  | ServiceUnavailableFailure;

type CreateStripeCheckoutLinkResult =
  | { ok: true; data: { paymentUrl: string; sessionId: string } }
  | ValidationFailure
  | FatturaNotFoundFailure
  | InvoiceAlreadyPaidFailure
  | ServiceUnavailableFailure;

type HandleStripeWebhookResult =
  | { ok: true; data: { duplicate: boolean } }
  | ValidationFailure
  | InvalidSignatureFailure
  | FatturaNotFoundFailure
  | OverpaymentFailure
  | ServiceUnavailableFailure;

type GetFatturaDetailResult =
  | { ok: true; data: FatturaPayload }
  | ValidationFailure
  | FatturaNotFoundFailure
  | ServiceUnavailableFailure;

interface ListFattureMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ListFattureData {
  data: FatturaPayload[];
  meta: ListFattureMeta;
}

type GetFatturaPdfResult =
  | { ok: true; data: { fileName: string; content: Buffer } }
  | ValidationFailure
  | FatturaNotFoundFailure
  | ServiceUnavailableFailure;

type ListFattureResult =
  | { ok: true; data: ListFattureData }
  | ValidationFailure
  | ServiceUnavailableFailure;

interface ParsedCreateFatturaInput {
  riparazioneId: number;
}

interface ParsedCreatePagamentoInput {
  fatturaId: number;
  importo: number;
  metodo: string;
  dataPagamento?: string;
}

interface ParsedCreateStripeCheckoutLinkInput {
  fatturaId: number;
}

interface ParsedStripeWebhookPayload {
  eventType: string;
  sessionId?: string;
  fatturaId?: number;
  amountTotal?: number;
  createdTimestamp?: number;
}

interface ParsedGetFatturaDetailInput {
  fatturaId: number;
}

interface ParsedListFattureInput {
  page: number;
  limit: number;
  stato?: FatturaStato;
  dataDa?: string;
  dataA?: string;
}

interface ParsedGetFatturaPdfInput {
  fatturaId: number;
}

let nextTestFatturaId = 1;
let nextTestPagamentoId = 1;
let testFatture: FatturaPayload[] = [];
const testLastSequenceByYear = new Map<number, number>();
const processedStripeSessionIds = new Set<string>();

function asPositiveInteger(value: unknown): number | null {
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value) || value <= 0) {
      return null;
    }

    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!/^[1-9]\d*$/.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function asPositiveCurrency(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  const rounded = roundCurrency(value);
  return rounded > 0 ? rounded : null;
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asIsoDate(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }

  const [yearRaw, monthRaw, dayRaw] = trimmed.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() + 1 !== month ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return trimmed;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function toIsoDate(dateInput?: string): string {
  if (!dateInput) {
    return new Date().toISOString().slice(0, 10);
  }

  return dateInput;
}

function unixTimestampToIsoDate(timestampSeconds: number): string {
  return new Date(timestampSeconds * 1000).toISOString().slice(0, 10);
}

function parseCreateFatturaInput(
  input: CreateFatturaInput,
): { ok: true; data: ParsedCreateFatturaInput } | ValidationFailure {
  const riparazioneId = asPositiveInteger(input.riparazioneId);
  if (riparazioneId === null) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      details: {
        field: "riparazioneId",
        rule: "required",
      },
    };
  }

  return {
    ok: true,
    data: { riparazioneId },
  };
}

function parseCreatePagamentoInput(
  input: CreatePagamentoInput,
): { ok: true; data: ParsedCreatePagamentoInput } | ValidationFailure {
  const fatturaId = asPositiveInteger(input.fatturaId);
  if (fatturaId === null) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      details: {
        field: "fatturaId",
        rule: "required",
      },
    };
  }

  const importo = asPositiveCurrency(input.importo);
  if (importo === null) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      details: {
        field: "importo",
        rule: "required",
      },
    };
  }

  const metodo = asNonEmptyString(input.metodo);
  if (!metodo) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      details: {
        field: "metodo",
        rule: "required",
      },
    };
  }

  let dataPagamento: string | undefined;
  if (input.dataPagamento !== undefined) {
    const rawData = asNonEmptyString(input.dataPagamento);
    if (!rawData || !/^\d{4}-\d{2}-\d{2}$/.test(rawData)) {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        details: {
          field: "dataPagamento",
          rule: "invalid",
        },
      };
    }

    dataPagamento = rawData;
  }

  return {
    ok: true,
    data: { fatturaId, importo, metodo, dataPagamento },
  };
}

function parseCreateStripeCheckoutLinkInput(
  input: CreateStripeCheckoutLinkInput,
): { ok: true; data: ParsedCreateStripeCheckoutLinkInput } | ValidationFailure {
  const fatturaId = asPositiveInteger(input.fatturaId);
  if (fatturaId === null) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      details: {
        field: "fatturaId",
        rule: "required",
      },
    };
  }

  return {
    ok: true,
    data: { fatturaId },
  };
}

function parseStripeWebhookPayload(
  payload: unknown,
): { ok: true; data: ParsedStripeWebhookPayload } | ValidationFailure {
  if (typeof payload !== "object" || payload === null) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      details: { field: "payload", rule: "invalid" },
    };
  }

  const event = payload as {
    type?: unknown;
    created?: unknown;
    data?: { object?: unknown };
  };
  if (typeof event.type !== "string" || event.type.length === 0) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      details: { field: "type", rule: "required" },
    };
  }

  if (event.type !== "checkout.session.completed") {
    return {
      ok: true,
      data: {
        eventType: event.type,
      },
    };
  }

  const createdTimestamp =
    typeof event.created === "number" && Number.isFinite(event.created)
      ? Math.trunc(event.created)
      : null;
  if (createdTimestamp === null || createdTimestamp <= 0) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      details: { field: "created", rule: "required" },
    };
  }

  const objectPayload =
    typeof event.data === "object" &&
    event.data !== null &&
    typeof event.data.object === "object" &&
    event.data.object !== null
      ? (event.data.object as {
          id?: unknown;
          metadata?: { fatturaId?: unknown };
          amount_total?: unknown;
        })
      : null;

  if (!objectPayload) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      details: { field: "data.object", rule: "required" },
    };
  }

  const sessionId =
    typeof objectPayload.id === "string" ? objectPayload.id.trim() : "";
  if (sessionId.length === 0) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      details: { field: "data.object.id", rule: "required" },
    };
  }

  const fatturaId = asPositiveInteger(objectPayload.metadata?.fatturaId);
  if (fatturaId === null) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      details: { field: "data.object.metadata.fatturaId", rule: "required" },
    };
  }

  const amountTotal =
    typeof objectPayload.amount_total === "number" &&
    Number.isFinite(objectPayload.amount_total)
      ? Math.trunc(objectPayload.amount_total)
      : null;
  if (amountTotal === null || amountTotal <= 0) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      details: { field: "data.object.amount_total", rule: "required" },
    };
  }

  return {
    ok: true,
    data: {
      eventType: event.type,
      sessionId,
      fatturaId,
      amountTotal,
      createdTimestamp,
    },
  };
}

function parseGetFatturaDetailInput(
  input: GetFatturaDetailInput,
): { ok: true; data: ParsedGetFatturaDetailInput } | ValidationFailure {
  const fatturaId = asPositiveInteger(input.fatturaId);
  if (fatturaId === null) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      details: {
        field: "fatturaId",
        rule: "required",
      },
    };
  }

  return {
    ok: true,
    data: { fatturaId },
  };
}

function parseListFattureInput(
  input: ListFattureInput,
): { ok: true; data: ParsedListFattureInput } | ValidationFailure {
  let page = 1;
  if (input.page !== undefined) {
    const parsedPage = asPositiveInteger(input.page);
    if (parsedPage === null) {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        details: {
          field: "page",
          rule: "invalid",
        },
      };
    }

    page = parsedPage;
  }

  let limit = 20;
  if (input.limit !== undefined) {
    const parsedLimit = asPositiveInteger(input.limit);
    if (parsedLimit === null) {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        details: {
          field: "limit",
          rule: "invalid",
        },
      };
    }

    if (parsedLimit > 100) {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        details: {
          field: "limit",
          rule: "too_large",
        },
      };
    }

    limit = parsedLimit;
  }

  let stato: FatturaStato | undefined;
  if (input.stato !== undefined) {
    const parsedStato = asNonEmptyString(input.stato);
    if (!parsedStato || (parsedStato !== "EMESSA" && parsedStato !== "PAGATA")) {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        details: {
          field: "stato",
          rule: "invalid",
        },
      };
    }

    stato = parsedStato;
  }

  let dataDa: string | undefined;
  if (input.dataDa !== undefined) {
    const parsed = asIsoDate(input.dataDa);
    if (!parsed) {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        details: {
          field: "dataDa",
          rule: "invalid",
        },
      };
    }

    dataDa = parsed;
  }

  let dataA: string | undefined;
  if (input.dataA !== undefined) {
    const parsed = asIsoDate(input.dataA);
    if (!parsed) {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        details: {
          field: "dataA",
          rule: "invalid",
        },
      };
    }

    dataA = parsed;
  }

  if (dataDa && dataA && dataDa > dataA) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      details: {
        field: "dataDa",
        rule: "range",
      },
    };
  }

  return {
    ok: true,
    data: {
      page,
      limit,
      stato,
      dataDa,
      dataA,
    },
  };
}

function parseGetFatturaPdfInput(
  input: GetFatturaPdfInput,
): { ok: true; data: ParsedGetFatturaPdfInput } | ValidationFailure {
  const fatturaId = asPositiveInteger(input.fatturaId);
  if (fatturaId === null) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      details: {
        field: "fatturaId",
        rule: "required",
      },
    };
  }

  return {
    ok: true,
    data: { fatturaId },
  };
}

function getCurrentYear(): number {
  return new Date().getFullYear();
}

function parseInvoiceSequence(numeroFattura: string): { year: number; sequence: number } | null {
  const match = numeroFattura.match(/^(\d{4})\/(\d{4})$/);
  if (!match) {
    return null;
  }

  return {
    year: Number(match[1]),
    sequence: Number(match[2]),
  };
}

function toNumeroFattura(year: number, sequence: number): string {
  return `${year}/${String(sequence).padStart(4, "0")}`;
}

function getNextSequenceForYear(year: number): number {
  const mapped = testLastSequenceByYear.get(year) ?? 0;
  const existingMax = testFatture
    .map((row) => parseInvoiceSequence(row.numeroFattura))
    .flatMap((value) => (value && value.year === year ? [value.sequence] : []))
    .reduce((max, sequence) => Math.max(max, sequence), 0);

  const next = Math.max(mapped, existingMax) + 1;
  testLastSequenceByYear.set(year, next);
  return next;
}

function cloneFattura(value: FatturaPayload): FatturaPayload {
  return {
    ...value,
    voci: value.voci.map((voce) => ({ ...voce })),
    pagamenti: value.pagamenti.map((pagamento) => ({ ...pagamento })),
  };
}

async function createFatturaInTestStore(
  payload: ParsedCreateFatturaInput,
): Promise<CreateFatturaResult> {
  const alreadyExists = testFatture.some(
    (row) => row.riparazioneId === payload.riparazioneId,
  );
  if (alreadyExists) {
    return {
      ok: false,
      code: "INVOICE_ALREADY_EXISTS",
    };
  }

  const approvedPreventivo = getApprovedPreventivoForRiparazioneForTests(
    payload.riparazioneId,
  );
  if (!approvedPreventivo) {
    return {
      ok: false,
      code: "NO_APPROVED_PREVENTIVO",
    };
  }

  if (
    approvedPreventivo.voci.length === 0 ||
    !Number.isFinite(approvedPreventivo.subtotale) ||
    !Number.isFinite(approvedPreventivo.iva) ||
    !Number.isFinite(approvedPreventivo.totale)
  ) {
    return {
      ok: false,
      code: "INVALID_APPROVED_PREVENTIVO",
    };
  }

  const year = getCurrentYear();
  const nextSequence = getNextSequenceForYear(year);
  const numeroFattura = toNumeroFattura(year, nextSequence);
  const fatturaId = nextTestFatturaId;
  nextTestFatturaId += 1;

  const totale = roundCurrency(approvedPreventivo.totale);

  const created: FatturaPayload = {
    id: fatturaId,
    riparazioneId: payload.riparazioneId,
    numeroFattura,
    stato: "EMESSA",
    dataEmissione: toIsoDate(),
    subtotale: approvedPreventivo.subtotale,
    iva: approvedPreventivo.iva,
    totale,
    totalePagato: 0,
    residuo: totale,
    pdfPath: createFatturaPdfPath(numeroFattura, fatturaId),
    voci: approvedPreventivo.voci.map((voce) => ({ ...voce })),
    pagamenti: [],
  };
  testFatture.push(created);

  return {
    ok: true,
    data: cloneFattura(created),
  };
}

async function createPagamentoInTestStore(
  payload: ParsedCreatePagamentoInput,
): Promise<CreatePagamentoResult> {
  const fattura = testFatture.find((row) => row.id === payload.fatturaId);
  if (!fattura) {
    return {
      ok: false,
      code: "FATTURA_NOT_FOUND",
    };
  }

  const newTotalePagato = roundCurrency(fattura.totalePagato + payload.importo);
  if (newTotalePagato - fattura.totale > 0.0001) {
    return {
      ok: false,
      code: "OVERPAYMENT_NOT_ALLOWED",
    };
  }

  const pagamento: PagamentoPayload = {
    id: nextTestPagamentoId,
    fatturaId: fattura.id,
    importo: payload.importo,
    metodo: payload.metodo,
    dataPagamento: toIsoDate(payload.dataPagamento),
  };
  nextTestPagamentoId += 1;

  fattura.pagamenti.push(pagamento);
  fattura.totalePagato = newTotalePagato;
  fattura.residuo = roundCurrency(Math.max(0, fattura.totale - newTotalePagato));
  if (fattura.residuo === 0) {
    fattura.stato = "PAGATA";
  }

  return {
    ok: true,
    data: {
      id: pagamento.id,
      fatturaId: pagamento.fatturaId,
      importo: pagamento.importo,
      metodo: pagamento.metodo,
      dataPagamento: pagamento.dataPagamento,
      fattura: {
        id: fattura.id,
        stato: fattura.stato,
        totale: fattura.totale,
        totalePagato: fattura.totalePagato,
        residuo: fattura.residuo,
      },
    },
  };
}

async function createStripeCheckoutLinkInTestStore(
  payload: ParsedCreateStripeCheckoutLinkInput,
): Promise<CreateStripeCheckoutLinkResult> {
  const fattura = testFatture.find((row) => row.id === payload.fatturaId);
  if (!fattura) {
    return {
      ok: false,
      code: "FATTURA_NOT_FOUND",
    };
  }

  if (fattura.stato === "PAGATA") {
    return {
      ok: false,
      code: "INVOICE_ALREADY_PAID",
    };
  }

  const amountCents = Math.round(fattura.totale * 100);
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      details: {
        field: "totale",
        rule: "invalid",
      },
    };
  }

  const checkout = createCheckoutSession({
    fatturaId: fattura.id,
    amountCents,
  });

  return {
    ok: true,
    data: checkout,
  };
}

async function handleStripeWebhookInTestStore(
  signature: string,
  parsedPayload: ParsedStripeWebhookPayload,
): Promise<HandleStripeWebhookResult> {
  if (!verifyWebhookSignature(signature)) {
    return {
      ok: false,
      code: "INVALID_SIGNATURE",
    };
  }

  if (parsedPayload.eventType !== "checkout.session.completed") {
    return {
      ok: true,
      data: {
        duplicate: false,
      },
    };
  }

  if (
    !parsedPayload.sessionId ||
    parsedPayload.fatturaId === undefined ||
    parsedPayload.amountTotal === undefined ||
    parsedPayload.createdTimestamp === undefined
  ) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      details: {
        field: "payload",
        rule: "invalid",
      },
    };
  }

  if (processedStripeSessionIds.has(parsedPayload.sessionId)) {
    return {
      ok: true,
      data: {
        duplicate: true,
      },
    };
  }

  const importo = roundCurrency(parsedPayload.amountTotal / 100);
  const createResult = await createPagamentoInTestStore({
    fatturaId: parsedPayload.fatturaId,
    importo,
    metodo: "STRIPE",
    dataPagamento: unixTimestampToIsoDate(parsedPayload.createdTimestamp),
  });

  if (!createResult.ok) {
    return createResult;
  }

  processedStripeSessionIds.add(parsedPayload.sessionId);

  return {
    ok: true,
    data: {
      duplicate: false,
    },
  };
}

async function listFattureInTestStore(
  payload: ParsedListFattureInput,
): Promise<ListFattureResult> {
  const filtered = testFatture
    .filter((row) => (payload.stato ? row.stato === payload.stato : true))
    .filter((row) => (payload.dataDa ? row.dataEmissione >= payload.dataDa : true))
    .filter((row) => (payload.dataA ? row.dataEmissione <= payload.dataA : true))
    .sort((a, b) => a.id - b.id);

  const total = filtered.length;
  const offset = (payload.page - 1) * payload.limit;
  const data = filtered.slice(offset, offset + payload.limit).map((row) => cloneFattura(row));

  return {
    ok: true,
    data: {
      data,
      meta: {
        page: payload.page,
        limit: payload.limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / payload.limit),
      },
    },
  };
}

async function getFatturaDetailInTestStore(
  payload: ParsedGetFatturaDetailInput,
): Promise<GetFatturaDetailResult> {
  const fattura = testFatture.find((row) => row.id === payload.fatturaId);
  if (!fattura) {
    return {
      ok: false,
      code: "FATTURA_NOT_FOUND",
    };
  }

  return {
    ok: true,
    data: cloneFattura(fattura),
  };
}

async function getFatturaPdfInTestStore(
  payload: ParsedGetFatturaPdfInput,
): Promise<GetFatturaPdfResult> {
  const fattura = testFatture.find((row) => row.id === payload.fatturaId);
  if (!fattura) {
    return {
      ok: false,
      code: "FATTURA_NOT_FOUND",
    };
  }

  const fileName = fattura.pdfPath.split("/").pop() ?? `${fattura.numeroFattura.replace("/", "-")}-${fattura.id}.pdf`;
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT /F1 12 Tf 36 100 Td (Fattura ${fattura.numeroFattura}) Tj ET
endstream
endobj
trailer
<< /Root 1 0 R >>
%%EOF`;
  return {
    ok: true,
    data: {
      fileName,
      content: Buffer.from(pdfContent),
    },
  };
}

async function createFattura(
  input: CreateFatturaInput,
): Promise<CreateFatturaResult> {
  const parsed = parseCreateFatturaInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  if (process.env.NODE_ENV === "test") {
    return createFatturaInTestStore(parsed.data);
  }

  return {
    ok: false,
    code: "SERVICE_UNAVAILABLE",
  };
}

async function createPagamento(
  input: CreatePagamentoInput,
): Promise<CreatePagamentoResult> {
  const parsed = parseCreatePagamentoInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  if (process.env.NODE_ENV === "test") {
    return createPagamentoInTestStore(parsed.data);
  }

  return {
    ok: false,
    code: "SERVICE_UNAVAILABLE",
  };
}

async function createStripeCheckoutLink(
  input: CreateStripeCheckoutLinkInput,
): Promise<CreateStripeCheckoutLinkResult> {
  const parsed = parseCreateStripeCheckoutLinkInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  if (process.env.NODE_ENV === "test") {
    return createStripeCheckoutLinkInTestStore(parsed.data);
  }

  return {
    ok: false,
    code: "SERVICE_UNAVAILABLE",
  };
}

async function handleStripeWebhook(
  input: HandleStripeWebhookInput,
): Promise<HandleStripeWebhookResult> {
  const signature = asNonEmptyString(input.signature);
  if (!signature) {
    return {
      ok: false,
      code: "INVALID_SIGNATURE",
    };
  }

  const parsedPayload = parseStripeWebhookPayload(input.payload);
  if (!parsedPayload.ok) {
    return parsedPayload;
  }

  if (process.env.NODE_ENV === "test") {
    return handleStripeWebhookInTestStore(signature, parsedPayload.data);
  }

  return {
    ok: false,
    code: "SERVICE_UNAVAILABLE",
  };
}

async function getFatturaDetail(
  input: GetFatturaDetailInput,
): Promise<GetFatturaDetailResult> {
  const parsed = parseGetFatturaDetailInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  if (process.env.NODE_ENV === "test") {
    return getFatturaDetailInTestStore(parsed.data);
  }

  return {
    ok: false,
    code: "SERVICE_UNAVAILABLE",
  };
}

async function listFatture(
  input: ListFattureInput,
): Promise<ListFattureResult> {
  const parsed = parseListFattureInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  if (process.env.NODE_ENV === "test") {
    return listFattureInTestStore(parsed.data);
  }

  return {
    ok: false,
    code: "SERVICE_UNAVAILABLE",
  };
}

async function getFatturaPdf(
  input: GetFatturaPdfInput,
): Promise<GetFatturaPdfResult> {
  const parsed = parseGetFatturaPdfInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  if (process.env.NODE_ENV === "test") {
    return getFatturaPdfInTestStore(parsed.data);
  }

  return {
    ok: false,
    code: "SERVICE_UNAVAILABLE",
  };
}

function ensureTestEnvironment(): void {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("TEST_HELPER_ONLY_IN_TEST_ENV");
  }
}

function resetFattureStoreForTests(): void {
  ensureTestEnvironment();
  testFatture = [];
  nextTestFatturaId = 1;
  nextTestPagamentoId = 1;
  testLastSequenceByYear.clear();
  processedStripeSessionIds.clear();
}

function setFatturaSequenceForTests(year: number, sequence: number): void {
  ensureTestEnvironment();
  if (!Number.isSafeInteger(year) || year < 1970 || year > 9999) {
    throw new Error("INVALID_YEAR_FOR_TESTS");
  }

  if (!Number.isSafeInteger(sequence) || sequence < 0 || sequence > 9999) {
    throw new Error("INVALID_SEQUENCE_FOR_TESTS");
  }

  testLastSequenceByYear.set(year, sequence);
}

function countFattureByRiparazioneForTests(riparazioneId: number): number {
  ensureTestEnvironment();
  return testFatture.filter((row) => row.riparazioneId === riparazioneId).length;
}

function seedFattureForReportForTests(entries: SeedFatturaReportInput[]): void {
  ensureTestEnvironment();
  processedStripeSessionIds.clear();
  testFatture = entries.map((entry, index) => {
    const dataEmissione = asIsoDate(entry.dataEmissione);
    if (!dataEmissione) {
      throw new Error("INVALID_DATA_EMISSIONE_FOR_TESTS");
    }
    if (!Number.isFinite(entry.totale) || entry.totale <= 0) {
      throw new Error("INVALID_TOTALE_FOR_TESTS");
    }
    if (!Number.isFinite(entry.totalePagato) || entry.totalePagato < 0) {
      throw new Error("INVALID_TOTALE_PAGATO_FOR_TESTS");
    }
    if (entry.totalePagato - entry.totale > 0.0001) {
      throw new Error("OVERPAYMENT_FOR_TESTS");
    }
    const id = entry.id ?? index + 1;
    const riparazioneId = entry.riparazioneId ?? id;
    const totale = roundCurrency(entry.totale);
    const totalePagato = roundCurrency(entry.totalePagato);
    const residuo = roundCurrency(Math.max(0, totale - totalePagato));
    const stato = entry.stato ?? (residuo === 0 ? "PAGATA" : "EMESSA");
    const year = Number(dataEmissione.slice(0, 4));
    const numeroFattura = `${year}/${String(id).padStart(4, "0")}`;
    return {
      id,
      riparazioneId,
      numeroFattura,
      stato,
      dataEmissione,
      subtotale: roundCurrency(totale / 1.22),
      iva: roundCurrency(totale - roundCurrency(totale / 1.22)),
      totale,
      totalePagato,
      residuo,
      pdfPath: createFatturaPdfPath(numeroFattura, id),
      voci: [
        {
          tipo: "MANODOPERA",
          descrizione: "Voce report seed",
          quantita: 1,
          prezzoUnitario: roundCurrency(totale / 1.22),
        },
      ],
      pagamenti:
        totalePagato > 0
          ? [
              {
                id,
                fatturaId: id,
                importo: totalePagato,
                metodo: "BONIFICO",
                dataPagamento: dataEmissione,
              },
            ]
          : [],
    };
  });
  const maxId = testFatture.reduce((max, row) => Math.max(max, row.id), 0);
  nextTestFatturaId = maxId + 1;
  nextTestPagamentoId = maxId + 1;
}

export {
  createFattura,
  createPagamento,
  createStripeCheckoutLink,
  handleStripeWebhook,
  getFatturaDetail,
  listFatture,
  getFatturaPdf,
  countFattureByRiparazioneForTests,
  resetFattureStoreForTests,
  seedFattureForReportForTests,
  setFatturaSequenceForTests,
  type CreateFatturaInput,
  type CreateFatturaResult,
  type CreatePagamentoInput,
  type CreatePagamentoResult,
  type CreateStripeCheckoutLinkInput,
  type CreateStripeCheckoutLinkResult,
  type HandleStripeWebhookInput,
  type HandleStripeWebhookResult,
  type GetFatturaDetailInput,
  type GetFatturaDetailResult,
  type ListFattureInput,
  type ListFattureResult,
  type GetFatturaPdfInput,
  type GetFatturaPdfResult,
  type SeedFatturaReportInput,
};
