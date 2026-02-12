import { createFatturaPdfPath } from "./fatture-pdf-service.js";
import { getApprovedPreventivoForRiparazioneForTests } from "./preventivi-service.js";

interface CreateFatturaInput {
  riparazioneId: unknown;
}

interface CreatePagamentoInput {
  fatturaId: unknown;
  importo: unknown;
  metodo: unknown;
  dataPagamento?: unknown;
}

interface GetFatturaDetailInput {
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

type GetFatturaDetailResult =
  | { ok: true; data: FatturaPayload }
  | ValidationFailure
  | FatturaNotFoundFailure
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

interface ParsedGetFatturaDetailInput {
  fatturaId: number;
}

let nextTestFatturaId = 1;
let nextTestPagamentoId = 1;
let testFatture: FatturaPayload[] = [];
const testLastSequenceByYear = new Map<number, number>();

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

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function toIsoDate(dateInput?: string): string {
  if (!dateInput) {
    return new Date().toISOString().slice(0, 10);
  }

  return dateInput;
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

export {
  createFattura,
  createPagamento,
  getFatturaDetail,
  countFattureByRiparazioneForTests,
  resetFattureStoreForTests,
  setFatturaSequenceForTests,
  type CreateFatturaInput,
  type CreateFatturaResult,
  type CreatePagamentoInput,
  type CreatePagamentoResult,
  type GetFatturaDetailInput,
  type GetFatturaDetailResult,
};
