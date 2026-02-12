import { createFatturaPdfPath } from "./fatture-pdf-service.js";
import { getApprovedPreventivoForRiparazioneForTests } from "./preventivi-service.js";

interface CreateFatturaInput {
  riparazioneId: unknown;
}

interface FatturaVocePayload {
  tipo: string;
  descrizione: string;
  articoloId?: number;
  quantita: number;
  prezzoUnitario: number;
}

interface FatturaPayload {
  id: number;
  riparazioneId: number;
  numeroFattura: string;
  stato: "EMESSA";
  subtotale: number;
  iva: number;
  totale: number;
  pdfPath: string;
  voci: FatturaVocePayload[];
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

type CreateFatturaResult =
  | { ok: true; data: FatturaPayload }
  | ValidationFailure
  | NoApprovedPreventivoFailure
  | InvoiceAlreadyExistsFailure
  | InvalidApprovedPreventivoFailure
  | ServiceUnavailableFailure;

interface ParsedCreateFatturaInput {
  riparazioneId: number;
}

let nextTestFatturaId = 1;
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
  const created: FatturaPayload = {
    id: fatturaId,
    riparazioneId: payload.riparazioneId,
    numeroFattura,
    stato: "EMESSA",
    subtotale: approvedPreventivo.subtotale,
    iva: approvedPreventivo.iva,
    totale: approvedPreventivo.totale,
    pdfPath: createFatturaPdfPath(numeroFattura, fatturaId),
    voci: approvedPreventivo.voci.map((voce) => ({ ...voce })),
  };
  testFatture.push(created);

  return {
    ok: true,
    data: {
      ...created,
      voci: created.voci.map((voce) => ({ ...voce })),
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

function ensureTestEnvironment(): void {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("TEST_HELPER_ONLY_IN_TEST_ENV");
  }
}

function resetFattureStoreForTests(): void {
  ensureTestEnvironment();
  testFatture = [];
  nextTestFatturaId = 1;
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
  countFattureByRiparazioneForTests,
  resetFattureStoreForTests,
  setFatturaSequenceForTests,
  type CreateFatturaInput,
  type CreateFatturaResult,
};
