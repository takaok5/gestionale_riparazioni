import { PrismaClient, type Prisma } from "@prisma/client";

type Priorita = "BASSA" | "NORMALE" | "ALTA";

interface CreateRiparazioneInput {
  actorUserId: unknown;
  clienteId: unknown;
  tipoDispositivo: unknown;
  marcaDispositivo: unknown;
  modelloDispositivo: unknown;
  serialeDispositivo: unknown;
  descrizioneProblema: unknown;
  accessoriConsegnati: unknown;
  priorita: unknown;
}

interface ValidationDetails extends Record<string, unknown> {
  field: string;
  rule: string;
  values?: Priorita[];
}

interface CreatedRiparazionePayload {
  id: number;
  clienteId: number;
  codiceRiparazione: string;
  stato: string;
  dataRicezione: string;
  tipoDispositivo: string;
  marcaDispositivo: string;
  modelloDispositivo: string;
  serialeDispositivo: string;
  descrizioneProblema: string;
  accessoriConsegnati: string;
  priorita: Priorita;
}

interface TestRiparazioneRecord extends CreatedRiparazionePayload {}

type ValidationFailure = {
  ok: false;
  code: "VALIDATION_ERROR";
  details: ValidationDetails;
  message?: string;
};

type ClienteNotFoundFailure = {
  ok: false;
  code: "CLIENTE_NOT_FOUND";
};

type CreateRiparazioneResult =
  | { ok: true; data: CreatedRiparazionePayload }
  | ValidationFailure
  | ClienteNotFoundFailure;

interface ParsedCreateRiparazioneInput {
  actorUserId: number;
  clienteId: number;
  tipoDispositivo: string;
  marcaDispositivo: string;
  modelloDispositivo: string;
  serialeDispositivo: string;
  descrizioneProblema: string;
  accessoriConsegnati: string;
  priorita: Priorita;
}

const ALLOWED_PRIORITA: Priorita[] = ["BASSA", "NORMALE", "ALTA"];
const INITIAL_STATO = "RICEVUTA";
const TEST_EXISTING_CLIENT_IDS = new Set<number>([5]);

let testRiparazioni: TestRiparazioneRecord[] = [];
let nextTestRiparazioneId = 1;
let prismaClient: PrismaClient | null = null;

function asPositiveInteger(value: unknown): number | null {
  if (typeof value === "number") {
    if (Number.isInteger(value) && value > 0) {
      return value;
    }

    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function asRequiredString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed;
}

function normalizePriorita(value: unknown): Priorita | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  if (!ALLOWED_PRIORITA.includes(normalized as Priorita)) {
    return null;
  }

  return normalized as Priorita;
}

function coercePriorita(value: string): Priorita {
  const normalized = normalizePriorita(value);
  if (normalized) {
    return normalized;
  }

  return "NORMALE";
}

function buildValidationFailure(
  details: ValidationDetails,
  message?: string,
): ValidationFailure {
  return {
    ok: false,
    code: "VALIDATION_ERROR",
    details,
    message,
  };
}

function parseCreateRiparazioneInput(
  input: CreateRiparazioneInput,
):
  | { ok: true; data: ParsedCreateRiparazioneInput }
  | ValidationFailure {
  const actorUserId = asPositiveInteger(input.actorUserId);
  if (actorUserId === null) {
    return buildValidationFailure({
      field: "actorUserId",
      rule: "invalid_integer",
    });
  }

  const clienteId = asPositiveInteger(input.clienteId);
  if (clienteId === null) {
    return buildValidationFailure({
      field: "clienteId",
      rule: "invalid_integer",
    });
  }

  const tipoDispositivo = asRequiredString(input.tipoDispositivo);
  if (!tipoDispositivo) {
    return buildValidationFailure(
      {
        field: "tipoDispositivo",
        rule: "required",
      },
      "tipoDispositivo is required",
    );
  }

  const marcaDispositivo = asRequiredString(input.marcaDispositivo);
  if (!marcaDispositivo) {
    return buildValidationFailure({
      field: "marcaDispositivo",
      rule: "required",
    });
  }

  const modelloDispositivo = asRequiredString(input.modelloDispositivo);
  if (!modelloDispositivo) {
    return buildValidationFailure({
      field: "modelloDispositivo",
      rule: "required",
    });
  }

  const serialeDispositivo = asRequiredString(input.serialeDispositivo);
  if (!serialeDispositivo) {
    return buildValidationFailure({
      field: "serialeDispositivo",
      rule: "required",
    });
  }

  const descrizioneProblema = asRequiredString(input.descrizioneProblema);
  if (!descrizioneProblema) {
    return buildValidationFailure({
      field: "descrizioneProblema",
      rule: "required",
    });
  }

  const accessoriConsegnati = asRequiredString(input.accessoriConsegnati);
  if (!accessoriConsegnati) {
    return buildValidationFailure({
      field: "accessoriConsegnati",
      rule: "required",
    });
  }

  const priorita = normalizePriorita(input.priorita);
  if (!priorita) {
    return buildValidationFailure({
      field: "priorita",
      rule: "invalid_enum",
      values: ALLOWED_PRIORITA,
    });
  }

  return {
    ok: true,
    data: {
      actorUserId,
      clienteId,
      tipoDispositivo,
      marcaDispositivo,
      modelloDispositivo,
      serialeDispositivo,
      descrizioneProblema,
      accessoriConsegnati,
      priorita,
    },
  };
}

function formatDateCode(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function extractRiparazioneCodeSequence(
  codiceRiparazione: string,
  dateCode: string,
): number {
  const match = codiceRiparazione.match(
    new RegExp(`^RIP-${dateCode}-(\\d{4})$`),
  );
  if (!match) {
    return 0;
  }

  return Number.parseInt(match[1], 10);
}

function formatRiparazioneCode(dateCode: string, sequence: number): string {
  return `RIP-${dateCode}-${String(sequence).padStart(4, "0")}`;
}

function computeNextDailySequence(
  riparazioni: Pick<TestRiparazioneRecord, "codiceRiparazione">[],
  dateCode: string,
): number {
  const highest = riparazioni.reduce((max, riparazione) => {
    return Math.max(
      max,
      extractRiparazioneCodeSequence(riparazione.codiceRiparazione, dateCode),
    );
  }, 0);

  return highest + 1;
}

function getPrismaClient(): PrismaClient {
  if (!prismaClient) {
    prismaClient = new PrismaClient();
  }

  return prismaClient;
}

async function createRiparazioneInTestStore(
  payload: ParsedCreateRiparazioneInput,
): Promise<CreateRiparazioneResult> {
  if (!TEST_EXISTING_CLIENT_IDS.has(payload.clienteId)) {
    return { ok: false, code: "CLIENTE_NOT_FOUND" };
  }

  const now = new Date();
  const dateCode = formatDateCode(now);
  const sequence = computeNextDailySequence(testRiparazioni, dateCode);
  const codiceRiparazione = formatRiparazioneCode(dateCode, sequence);

  const created: TestRiparazioneRecord = {
    id: nextTestRiparazioneId,
    clienteId: payload.clienteId,
    codiceRiparazione,
    stato: INITIAL_STATO,
    dataRicezione: now.toISOString(),
    tipoDispositivo: payload.tipoDispositivo,
    marcaDispositivo: payload.marcaDispositivo,
    modelloDispositivo: payload.modelloDispositivo,
    serialeDispositivo: payload.serialeDispositivo,
    descrizioneProblema: payload.descrizioneProblema,
    accessoriConsegnati: payload.accessoriConsegnati,
    priorita: payload.priorita,
  };

  nextTestRiparazioneId += 1;
  testRiparazioni.push(created);

  return {
    ok: true,
    data: created,
  };
}

async function createRiparazioneInDatabase(
  payload: ParsedCreateRiparazioneInput,
): Promise<CreateRiparazioneResult> {
  return getPrismaClient().$transaction(async (tx: Prisma.TransactionClient) => {
    const existingCliente = await tx.cliente.findUnique({
      where: { id: payload.clienteId },
      select: { id: true },
    });

    if (!existingCliente) {
      return { ok: false, code: "CLIENTE_NOT_FOUND" } as const;
    }

    const now = new Date();
    const dateCode = formatDateCode(now);
    const dayStart = new Date(now);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const latest = await tx.riparazione.findFirst({
      where: {
        dataRicezione: {
          gte: dayStart,
          lt: dayEnd,
        },
        codiceRiparazione: {
          startsWith: `RIP-${dateCode}-`,
        },
      },
      orderBy: {
        codiceRiparazione: "desc",
      },
      select: {
        codiceRiparazione: true,
      },
    });

    const sequence =
      extractRiparazioneCodeSequence(latest?.codiceRiparazione ?? "", dateCode) +
      1;
    const codiceRiparazione = formatRiparazioneCode(dateCode, sequence);

    const created = await tx.riparazione.create({
      data: {
        clienteId: payload.clienteId,
        codiceRiparazione,
        stato: INITIAL_STATO,
        dataRicezione: now,
        tipoDispositivo: payload.tipoDispositivo,
        marcaDispositivo: payload.marcaDispositivo,
        modelloDispositivo: payload.modelloDispositivo,
        serialeDispositivo: payload.serialeDispositivo,
        descrizioneProblema: payload.descrizioneProblema,
        accessoriConsegnati: payload.accessoriConsegnati,
        priorita: payload.priorita,
      },
      select: {
        id: true,
        clienteId: true,
        codiceRiparazione: true,
        stato: true,
        dataRicezione: true,
        tipoDispositivo: true,
        marcaDispositivo: true,
        modelloDispositivo: true,
        serialeDispositivo: true,
        descrizioneProblema: true,
        accessoriConsegnati: true,
        priorita: true,
      },
    });

    return {
      ok: true,
      data: {
        ...created,
        dataRicezione: created.dataRicezione.toISOString(),
        priorita: coercePriorita(created.priorita),
      },
    } as const;
  });
}

async function createRiparazione(
  input: CreateRiparazioneInput,
): Promise<CreateRiparazioneResult> {
  const parsed = parseCreateRiparazioneInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  if (process.env.NODE_ENV === "test") {
    return createRiparazioneInTestStore(parsed.data);
  }

  return createRiparazioneInDatabase(parsed.data);
}

function ensureTestEnvironment(): void {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("TEST_HELPER_ONLY_IN_TEST_ENV");
  }
}

function resetRiparazioniStoreForTests(): void {
  ensureTestEnvironment();
  testRiparazioni = [];
  nextTestRiparazioneId = 1;
}

export {
  createRiparazione,
  resetRiparazioniStoreForTests,
  type CreateRiparazioneInput,
  type CreateRiparazioneResult,
};
