import { PrismaClient, type Prisma } from "@prisma/client";

type Priorita = "BASSA" | "NORMALE" | "ALTA";

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

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

interface ListRiparazioniInput {
  page: unknown;
  limit: unknown;
  stato: unknown;
  tecnicoId: unknown;
  priorita: unknown;
  dataRicezioneDa: unknown;
  dataRicezioneA: unknown;
  search: unknown;
}

interface ValidationDetails extends Record<string, unknown> {
  field: string;
  rule: string;
  values?: Priorita[];
}

interface CreatedRiparazionePayload {
  id: number;
  clienteId: number;
  tecnicoId: number | null;
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

interface ListedRiparazionePayload {
  id: number;
  clienteId: number;
  tecnicoId: number | null;
  codiceRiparazione: string;
  stato: string;
  dataRicezione: string;
  tipoDispositivo: string;
  marcaDispositivo: string;
  modelloDispositivo: string;
  priorita: Priorita;
}

interface ListRiparazioniResponsePayload {
  data: ListedRiparazionePayload[];
  meta: PaginationMeta;
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

type ServiceUnavailableFailure = {
  ok: false;
  code: "SERVICE_UNAVAILABLE";
};

type CreateRiparazioneResult =
  | { ok: true; data: CreatedRiparazionePayload }
  | ValidationFailure
  | ClienteNotFoundFailure;

type ListRiparazioniResult =
  | { ok: true; data: ListRiparazioniResponsePayload }
  | ValidationFailure
  | ServiceUnavailableFailure;

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

interface ParsedListRiparazioniInput {
  page: number;
  limit: number;
  stato?: string;
  tecnicoId?: number;
  priorita?: Priorita;
  dataRicezioneDa?: Date;
  dataRicezioneA?: Date;
  search?: string;
}

const ALLOWED_PRIORITA: Priorita[] = ["BASSA", "NORMALE", "ALTA"];
const ALLOWED_STATI = new Set<string>([
  "RICEVUTA",
  "IN_DIAGNOSI",
  "IN_LAVORAZIONE",
  "COMPLETATA",
  "CONSEGNATA",
  "PREVENTIVO_EMESSO",
  "IN_ATTESA_APPROVAZIONE",
  "APPROVATA",
  "IN_ATTESA_RICAMBI",
  "ANNULLATA",
]);
const INITIAL_STATO = "RICEVUTA";
const DEFAULT_LIST_LIMIT = 15;
const MAX_LIST_LIMIT = 100;
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

function normalizeStatoFilter(value: unknown): string | null | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  if (!normalized) {
    return null;
  }

  if (!ALLOWED_STATI.has(normalized)) {
    return null;
  }

  return normalized;
}

function coercePriorita(value: string): Priorita {
  const normalized = normalizePriorita(value);
  if (normalized) {
    return normalized;
  }

  return "NORMALE";
}

function parseDateBoundary(value: unknown, endOfDay: boolean): Date | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  const parts = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!parts) {
    return null;
  }

  const year = Number.parseInt(parts[1], 10);
  const month = Number.parseInt(parts[2], 10);
  const day = Number.parseInt(parts[3], 10);

  const date = endOfDay
    ? new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))
    : new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
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

function parseListRiparazioniInput(
  input: ListRiparazioniInput,
):
  | { ok: true; data: ParsedListRiparazioniInput }
  | ValidationFailure {
  let page = 1;
  if (input.page !== undefined) {
    const parsedPage = asPositiveInteger(input.page);
    if (parsedPage === null) {
      return buildValidationFailure({
        field: "page",
        rule: "invalid_integer",
      });
    }
    page = parsedPage;
  }

  let limit = DEFAULT_LIST_LIMIT;
  if (input.limit !== undefined) {
    const parsedLimit = asPositiveInteger(input.limit);
    if (parsedLimit === null) {
      return buildValidationFailure({
        field: "limit",
        rule: "invalid_integer",
      });
    }
    if (parsedLimit > MAX_LIST_LIMIT) {
      return buildValidationFailure({
        field: "limit",
        rule: "too_large",
      });
    }
    limit = parsedLimit;
  }

  const stato = normalizeStatoFilter(input.stato);
  if (stato === null) {
    return buildValidationFailure({
      field: "stato",
      rule: "invalid_enum",
    });
  }

  let tecnicoId: number | undefined;
  if (input.tecnicoId !== undefined && input.tecnicoId !== null) {
    const parsedTecnicoId = asPositiveInteger(input.tecnicoId);
    if (parsedTecnicoId === null) {
      return buildValidationFailure({
        field: "tecnicoId",
        rule: "invalid_integer",
      });
    }
    tecnicoId = parsedTecnicoId;
  }

  let priorita: Priorita | undefined;
  if (input.priorita !== undefined && input.priorita !== null) {
    const parsedPriorita = normalizePriorita(input.priorita);
    if (!parsedPriorita) {
      return buildValidationFailure({
        field: "priorita",
        rule: "invalid_enum",
        values: ALLOWED_PRIORITA,
      });
    }
    priorita = parsedPriorita;
  }

  let dataRicezioneDa: Date | undefined;
  if (input.dataRicezioneDa !== undefined && input.dataRicezioneDa !== null) {
    const parsed = parseDateBoundary(input.dataRicezioneDa, false);
    if (!parsed) {
      return buildValidationFailure({
        field: "dataRicezioneDa",
        rule: "invalid_date",
      });
    }
    dataRicezioneDa = parsed;
  }

  let dataRicezioneA: Date | undefined;
  if (input.dataRicezioneA !== undefined && input.dataRicezioneA !== null) {
    const parsed = parseDateBoundary(input.dataRicezioneA, true);
    if (!parsed) {
      return buildValidationFailure({
        field: "dataRicezioneA",
        rule: "invalid_date",
      });
    }
    dataRicezioneA = parsed;
  }

  if (
    dataRicezioneDa !== undefined &&
    dataRicezioneA !== undefined &&
    dataRicezioneDa.getTime() > dataRicezioneA.getTime()
  ) {
    return buildValidationFailure({
      field: "dataRicezioneDa",
      rule: "after_end",
    });
  }

  let search: string | undefined;
  if (input.search !== undefined && input.search !== null) {
    if (typeof input.search !== "string" || !input.search.trim()) {
      return buildValidationFailure({
        field: "search",
        rule: "invalid_string",
      });
    }
    search = input.search.trim();
  }

  return {
    ok: true,
    data: {
      page,
      limit,
      stato,
      tecnicoId,
      priorita,
      dataRicezioneDa,
      dataRicezioneA,
      search,
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

function toListPayload(record: TestRiparazioneRecord): ListedRiparazionePayload {
  return {
    id: record.id,
    clienteId: record.clienteId,
    tecnicoId: record.tecnicoId,
    codiceRiparazione: record.codiceRiparazione,
    stato: record.stato,
    dataRicezione: record.dataRicezione,
    tipoDispositivo: record.tipoDispositivo,
    marcaDispositivo: record.marcaDispositivo,
    modelloDispositivo: record.modelloDispositivo,
    priorita: record.priorita,
  };
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
    tecnicoId: payload.actorUserId,
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

    const existingActor = await tx.user.findUnique({
      where: { id: payload.actorUserId },
      select: { id: true },
    });

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
        tecnicoId: existingActor?.id ?? null,
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
        tecnicoId: true,
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
      ok: true as const,
      data: {
        id: created.id,
        clienteId: created.clienteId,
        tecnicoId: created.tecnicoId,
        codiceRiparazione: created.codiceRiparazione,
        stato: created.stato,
        dataRicezione: created.dataRicezione.toISOString(),
        tipoDispositivo: created.tipoDispositivo,
        marcaDispositivo: created.marcaDispositivo,
        modelloDispositivo: created.modelloDispositivo,
        serialeDispositivo: created.serialeDispositivo,
        descrizioneProblema: created.descrizioneProblema,
        accessoriConsegnati: created.accessoriConsegnati,
        priorita: coercePriorita(created.priorita),
      },
    };
  });
}

async function listRiparazioniInTestStore(
  payload: ParsedListRiparazioniInput,
): Promise<ListRiparazioniResult> {
  const searchValue = payload.search?.toLowerCase();

  const filtered = testRiparazioni
    .filter((row) => {
      if (payload.stato && row.stato !== payload.stato) {
        return false;
      }

      if (payload.tecnicoId !== undefined && row.tecnicoId !== payload.tecnicoId) {
        return false;
      }

      if (payload.priorita && row.priorita !== payload.priorita) {
        return false;
      }

      const rowDateValue = new Date(row.dataRicezione).getTime();
      if (
        payload.dataRicezioneDa &&
        rowDateValue < payload.dataRicezioneDa.getTime()
      ) {
        return false;
      }

      if (
        payload.dataRicezioneA &&
        rowDateValue > payload.dataRicezioneA.getTime()
      ) {
        return false;
      }

      if (!searchValue) {
        return true;
      }

      return (
        row.modelloDispositivo.toLowerCase().includes(searchValue) ||
        row.marcaDispositivo.toLowerCase().includes(searchValue) ||
        row.codiceRiparazione.toLowerCase().includes(searchValue)
      );
    })
    .sort((left, right) => {
      const timeDiff =
        new Date(right.dataRicezione).getTime() -
        new Date(left.dataRicezione).getTime();
      if (timeDiff !== 0) {
        return timeDiff;
      }
      return left.id - right.id;
    });

  const total = filtered.length;
  const offset = (payload.page - 1) * payload.limit;
  const data = filtered
    .slice(offset, offset + payload.limit)
    .map((row) => toListPayload(row));

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

async function listRiparazioniInDatabase(
  payload: ParsedListRiparazioniInput,
): Promise<ListRiparazioniResult> {
  try {
    const where: Prisma.RiparazioneWhereInput = {};

    if (payload.stato) {
      where.stato = payload.stato;
    }

    if (payload.tecnicoId !== undefined) {
      where.tecnicoId = payload.tecnicoId;
    }

    if (payload.priorita) {
      where.priorita = payload.priorita;
    }

    if (payload.dataRicezioneDa || payload.dataRicezioneA) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (payload.dataRicezioneDa) {
        dateFilter.gte = payload.dataRicezioneDa;
      }
      if (payload.dataRicezioneA) {
        dateFilter.lte = payload.dataRicezioneA;
      }
      where.dataRicezione = dateFilter;
    }

    if (payload.search) {
      where.OR = [
        {
          modelloDispositivo: {
            contains: payload.search,
            mode: "insensitive",
          },
        },
        {
          marcaDispositivo: {
            contains: payload.search,
            mode: "insensitive",
          },
        },
        {
          codiceRiparazione: {
            contains: payload.search,
            mode: "insensitive",
          },
        },
      ];
    }

    const skip = (payload.page - 1) * payload.limit;
    const [total, rows] = await Promise.all([
      getPrismaClient().riparazione.count({ where }),
      getPrismaClient().riparazione.findMany({
        where,
        orderBy: [
          {
            dataRicezione: "desc",
          },
          {
            id: "asc",
          },
        ],
        skip,
        take: payload.limit,
        select: {
          id: true,
          clienteId: true,
          tecnicoId: true,
          codiceRiparazione: true,
          stato: true,
          dataRicezione: true,
          tipoDispositivo: true,
          marcaDispositivo: true,
          modelloDispositivo: true,
          priorita: true,
        },
      }),
    ]);

    return {
      ok: true,
      data: {
        data: rows.map((row) => ({
          id: row.id,
          clienteId: row.clienteId,
          tecnicoId: row.tecnicoId,
          codiceRiparazione: row.codiceRiparazione,
          stato: row.stato,
          dataRicezione: row.dataRicezione.toISOString(),
          tipoDispositivo: row.tipoDispositivo,
          marcaDispositivo: row.marcaDispositivo,
          modelloDispositivo: row.modelloDispositivo,
          priorita: coercePriorita(row.priorita),
        })),
        meta: {
          page: payload.page,
          limit: payload.limit,
          total,
          totalPages: total === 0 ? 0 : Math.ceil(total / payload.limit),
        },
      },
    };
  } catch {
    return {
      ok: false,
      code: "SERVICE_UNAVAILABLE",
    };
  }
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

async function listRiparazioni(
  input: ListRiparazioniInput,
): Promise<ListRiparazioniResult> {
  const parsed = parseListRiparazioniInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  if (process.env.NODE_ENV === "test") {
    return listRiparazioniInTestStore(parsed.data);
  }

  return listRiparazioniInDatabase(parsed.data);
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

function setRiparazioneStatoForTests(
  riparazioneId: number,
  stato: string,
): void {
  ensureTestEnvironment();

  if (!ALLOWED_STATI.has(stato)) {
    throw new Error("INVALID_STATO_FOR_TESTS");
  }

  const target = testRiparazioni.find((row) => row.id === riparazioneId);
  if (!target) {
    throw new Error("RIPARAZIONE_NOT_FOUND_FOR_TESTS");
  }

  target.stato = stato;
}

export {
  createRiparazione,
  listRiparazioni,
  resetRiparazioniStoreForTests,
  setRiparazioneStatoForTests,
  type CreateRiparazioneInput,
  type CreateRiparazioneResult,
  type ListRiparazioniInput,
  type ListRiparazioniResult,
};
