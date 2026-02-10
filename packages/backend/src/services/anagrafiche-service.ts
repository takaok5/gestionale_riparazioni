import { PrismaClient, type Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

type ValidationDetails = Record<string, unknown> & {
  field: string;
  rule: string;
};

type ValidationFailure = {
  ok: false;
  code: "VALIDATION_ERROR";
  details: ValidationDetails;
  message?: string;
};

type DuplicateEmailFailure = {
  ok: false;
  code: "EMAIL_ALREADY_EXISTS";
};

type NotFoundFailure = {
  ok: false;
  code: "NOT_FOUND";
};

type ServiceUnavailableFailure = {
  ok: false;
  code: "SERVICE_UNAVAILABLE";
};

type TipologiaCliente = "PRIVATO" | "AZIENDA";

interface CreateClienteInput {
  actorUserId: unknown;
  nome: unknown;
  cognome: unknown;
  ragioneSociale: unknown;
  tipologia: unknown;
  indirizzo: unknown;
  citta: unknown;
  cap: unknown;
  provincia: unknown;
  telefono: unknown;
  email: unknown;
  partitaIva: unknown;
  codiceFiscale: unknown;
}

interface UpdateFornitoreInput {
  actorUserId: unknown;
  fornitoreId: unknown;
  ragioneSociale: unknown;
  telefono: unknown;
}

interface ListAuditLogsInput {
  modelName: unknown;
  page: unknown;
}

interface ListClientiInput {
  page: unknown;
  limit: unknown;
  search: unknown;
  tipologia: unknown;
}

interface AuditLogDettagli {
  old: Record<string, unknown>;
  new: Record<string, unknown>;
}

interface AuditLogListItem {
  id: number;
  userId: number | null;
  action: "CREATE" | "UPDATE" | "DELETE";
  modelName: string;
  objectId: string;
  timestamp: string;
  dettagli?: AuditLogDettagli;
}

interface AuditLogListPayload {
  results: AuditLogListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

interface ClienteListItem {
  id: number;
  codiceCliente: string;
  nome: string;
  tipologia: TipologiaCliente;
}

interface ClienteListPayload {
  data: ClienteListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type CreateClienteResult =
  | {
      ok: true;
      data: {
        id: number;
        codiceCliente: string;
        nome: string;
        tipologia: TipologiaCliente;
        email: string | null;
        partitaIva: string | null;
      };
    }
  | ValidationFailure
  | DuplicateEmailFailure
  | ServiceUnavailableFailure;

type UpdateFornitoreResult =
  | { ok: true; data: { id: number; ragioneSociale: string | null } }
  | ValidationFailure
  | NotFoundFailure
  | ServiceUnavailableFailure;

type ListAuditLogsResult =
  | { ok: true; data: AuditLogListPayload }
  | ValidationFailure
  | ServiceUnavailableFailure;

type ListClientiResult =
  | { ok: true; data: ClienteListPayload }
  | ValidationFailure
  | ServiceUnavailableFailure;

interface ParsedCreateClienteInput {
  actorUserId: number;
  nome: string;
  cognome: string | null;
  ragioneSociale: string | null;
  tipologia: TipologiaCliente;
  indirizzo: string;
  citta: string;
  cap: string;
  provincia: string;
  telefono: string | null;
  email: string | null;
  partitaIva: string | null;
  codiceFiscale: string | null;
}

interface ParsedUpdateFornitoreInput {
  actorUserId: number;
  fornitoreId: number;
  ragioneSociale?: string | null;
  telefono?: string | null;
}

interface ParsedListAuditLogsInput {
  modelName?: string;
  page: number;
  pageSize: number;
}

interface ParsedListClientiInput {
  page: number;
  limit: number;
  search?: string;
  tipologia?: TipologiaCliente;
}

interface TestClienteRecord {
  id: number;
  nome: string;
  cognome: string | null;
  ragioneSociale: string | null;
  tipologia: TipologiaCliente;
  indirizzo: string;
  citta: string;
  cap: string;
  provincia: string;
  codiceCliente: string;
  telefono: string | null;
  email: string | null;
  partitaIva: string | null;
  codiceFiscale: string | null;
}

interface TestFornitoreRecord {
  id: number;
  ragioneSociale: string | null;
  telefono: string | null;
}

const TEST_PAGE_SIZE = 10;
const MAX_CODICE_CLIENTE_GENERATION_ATTEMPTS = 3;
const VALID_PROVINCE_CODES = new Set([
  "AG", "AL", "AN", "AO", "AR", "AP", "AT", "AV", "BA", "BT", "BL", "BN", "BG", "BI",
  "BO", "BZ", "BS", "BR", "CA", "CL", "CB", "CI", "CE", "CT", "CZ", "CH", "CO", "CS",
  "CR", "KR", "CN", "EN", "FM", "FE", "FI", "FG", "FC", "FR", "GE", "GO", "GR", "IM",
  "IS", "AQ", "SP", "LT", "LE", "LC", "LI", "LO", "LU", "MC", "MN", "MS", "MT", "ME",
  "MI", "MO", "MB", "NA", "NO", "NU", "OR", "OT", "PD", "PA", "PR", "PV", "PG", "PU",
  "PE", "PC", "PI", "PT", "PN", "PZ", "PO", "RG", "RA", "RC", "RE", "RI", "RN", "RM",
  "RO", "SA", "SS", "SV", "SI", "SR", "SO", "TA", "TE", "TR", "TO", "TP", "TN", "TV",
  "TS", "UD", "VA", "VE", "VB", "VC", "VR", "VV", "VI", "VT", "SU",
]);

const baseTestClienti: TestClienteRecord[] = [
  {
    id: 1,
    nome: "Cliente",
    cognome: "Base",
    ragioneSociale: "Cliente Base SRL",
    tipologia: "AZIENDA",
    indirizzo: "Via Test 1",
    citta: "Milano",
    cap: "20100",
    provincia: "MI",
    codiceCliente: "CLI-000000",
    telefono: "0212345678",
    email: "cliente.base@test.local",
    partitaIva: "12345678901",
    codiceFiscale: null,
  },
];

const baseTestFornitori: TestFornitoreRecord[] = [
  {
    id: 5,
    ragioneSociale: "Ricambi Nord",
    telefono: "0211122233",
  },
];

const baseTestAuditLogs: AuditLogListItem[] = [
  {
    id: 1,
    userId: 1000,
    action: "CREATE",
    modelName: "Cliente",
    objectId: "1",
    timestamp: "2026-02-10T08:00:00.000Z",
  },
  {
    id: 2,
    userId: 1000,
    action: "UPDATE",
    modelName: "Fornitore",
    objectId: "5",
    timestamp: "2026-02-10T08:05:00.000Z",
    dettagli: {
      old: {
        ragioneSociale: "Ricambi Nord",
        telefono: "0211122233",
      },
      new: {
        ragioneSociale: "Ricambi Nord",
        telefono: "0211122233",
      },
    },
  },
];

let testClienti = cloneTestClienti(baseTestClienti);
let testFornitori = cloneTestFornitori(baseTestFornitori);
let testAuditLogs = cloneAuditLogs(baseTestAuditLogs);

let nextTestClienteId = computeNextId(testClienti.map((item) => item.id));
let nextTestClienteCodeSequence = computeNextClienteCodeSequence(testClienti);
let nextTestAuditLogId = computeNextId(testAuditLogs.map((item) => item.id));

let prismaClient: PrismaClient | null = null;

function cloneTestClienti(source: TestClienteRecord[]): TestClienteRecord[] {
  return source.map((item) => ({ ...item }));
}

function cloneTestFornitori(source: TestFornitoreRecord[]): TestFornitoreRecord[] {
  return source.map((item) => ({ ...item }));
}

function cloneAuditLogs(source: AuditLogListItem[]): AuditLogListItem[] {
  return source.map((item) => ({
    ...item,
    dettagli: item.dettagli
      ? {
          old: { ...item.dettagli.old },
          new: { ...item.dettagli.new },
        }
      : undefined,
  }));
}

function computeNextId(ids: number[]): number {
  const maxId = ids.reduce((acc, current) => Math.max(acc, current), 0);
  return maxId + 1;
}

function extractClienteCodeSequence(codiceCliente: string): number {
  const match = codiceCliente.match(/(\d+)$/);
  if (!match) {
    return 0;
  }

  const parsed = Number(match[1]);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

function formatClienteCode(sequence: number): string {
  return `CLI-${String(sequence).padStart(6, "0")}`;
}

function computeNextClienteCodeSequence(records: TestClienteRecord[]): number {
  const maxSequence = records.reduce(
    (acc, current) => Math.max(acc, extractClienteCodeSequence(current.codiceCliente)),
    0,
  );
  return maxSequence + 1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asAuditDettagli(value: unknown): AuditLogDettagli | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const oldValue = value.old;
  const newValue = value.new;
  if (!isRecord(oldValue) || !isRecord(newValue)) {
    return undefined;
  }

  return {
    old: oldValue,
    new: newValue,
  };
}

function getPrismaClient(): PrismaClient {
  if (!prismaClient) {
    prismaClient = new PrismaClient();
  }

  return prismaClient;
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

function buildDuplicateEmailFailure(): DuplicateEmailFailure {
  return {
    ok: false,
    code: "EMAIL_ALREADY_EXISTS",
  };
}

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

function asOptionalString(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed;
}

function asNullableString(
  value: unknown,
): { ok: true; value?: string | null } | ValidationFailure {
  if (value === undefined) {
    return { ok: true };
  }

  if (value === null) {
    return { ok: true, value: null };
  }

  if (typeof value !== "string") {
    return buildValidationFailure({
      field: "payload",
      rule: "invalid_type",
    });
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return buildValidationFailure({
      field: "payload",
      rule: "empty_string",
    });
  }

  return { ok: true, value: trimmed };
}

function normalizeTipologia(value: unknown): TipologiaCliente | null {
  if (value === undefined || value === null) {
    return "PRIVATO";
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  if (normalized === "PRIVATO" || normalized === "AZIENDA") {
    return normalized;
  }

  return null;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPartitaIvaFormat(value: string): boolean {
  return /^\d{11}$/.test(value);
}

function isValidCodiceFiscaleFormat(value: string): boolean {
  return /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/i.test(value);
}

function isValidProvinciaCode(value: string): boolean {
  const normalized = value.toUpperCase();
  return VALID_PROVINCE_CODES.has(normalized);
}

function parseCreateClienteInput(
  input: CreateClienteInput,
):
  | { ok: true; data: ParsedCreateClienteInput }
  | ValidationFailure {
  const actorUserId = asPositiveInteger(input.actorUserId);
  if (actorUserId === null) {
    return buildValidationFailure({
      field: "actorUserId",
      rule: "invalid_integer",
    });
  }

  const nome = asRequiredString(input.nome);
  if (!nome) {
    return buildValidationFailure({
      field: "nome",
      rule: "required",
    });
  }

  const indirizzo = asRequiredString(input.indirizzo);
  if (!indirizzo) {
    return buildValidationFailure({
      field: "indirizzo",
      rule: "required",
    });
  }

  const citta = asRequiredString(input.citta);
  if (!citta) {
    return buildValidationFailure({
      field: "citta",
      rule: "required",
    });
  }

  const cap = asRequiredString(input.cap);
  if (!cap || !/^\d{5}$/.test(cap)) {
    return buildValidationFailure({
      field: "cap",
      rule: "invalid_cap",
    });
  }

  const provincia = asRequiredString(input.provincia);
  if (!provincia || !isValidProvinciaCode(provincia.toUpperCase())) {
    return buildValidationFailure({
      field: "provincia",
      rule: "invalid_provincia",
    });
  }

  const tipologia = normalizeTipologia(input.tipologia);
  if (!tipologia) {
    return buildValidationFailure({
      field: "tipologia",
      rule: "invalid_enum",
    });
  }

  const email = asOptionalString(input.email);
  if (email && !isValidEmail(email)) {
    return buildValidationFailure({
      field: "email",
      rule: "invalid_email",
    });
  }

  const partitaIva = asOptionalString(input.partitaIva);
  if (partitaIva && !isValidPartitaIvaFormat(partitaIva)) {
    return buildValidationFailure({
      field: "partitaIva",
      rule: "invalid_partita_iva_format",
    });
  }

  const codiceFiscale = asOptionalString(input.codiceFiscale);
  if (codiceFiscale && !isValidCodiceFiscaleFormat(codiceFiscale)) {
    return buildValidationFailure(
      {
        field: "codiceFiscale",
        rule: "invalid_fiscal_code_format",
      },
      "Invalid fiscal code format",
    );
  }

  return {
    ok: true,
    data: {
      actorUserId,
      nome,
      cognome: asOptionalString(input.cognome),
      ragioneSociale: asOptionalString(input.ragioneSociale),
      tipologia,
      indirizzo,
      citta,
      cap,
      provincia: provincia.toUpperCase(),
      telefono: asOptionalString(input.telefono),
      email: email ? email.toLowerCase() : null,
      partitaIva,
      codiceFiscale,
    },
  };
}

function parseUpdateFornitoreInput(
  input: UpdateFornitoreInput,
):
  | { ok: true; data: ParsedUpdateFornitoreInput }
  | ValidationFailure {
  const actorUserId = asPositiveInteger(input.actorUserId);
  if (actorUserId === null) {
    return buildValidationFailure({
      field: "actorUserId",
      rule: "invalid_integer",
    });
  }

  const fornitoreId = asPositiveInteger(input.fornitoreId);
  if (fornitoreId === null) {
    return buildValidationFailure({
      field: "fornitoreId",
      rule: "invalid_integer",
    });
  }

  const parsedRagioneSociale = asNullableString(input.ragioneSociale);
  if (!parsedRagioneSociale.ok) {
    return {
      ...parsedRagioneSociale,
      details: {
        field: "ragioneSociale",
        rule: parsedRagioneSociale.details.rule,
      },
    };
  }

  const parsedTelefono = asNullableString(input.telefono);
  if (!parsedTelefono.ok) {
    return {
      ...parsedTelefono,
      details: {
        field: "telefono",
        rule: parsedTelefono.details.rule,
      },
    };
  }

  const data: ParsedUpdateFornitoreInput = {
    actorUserId,
    fornitoreId,
  };

  if (parsedRagioneSociale.value !== undefined) {
    data.ragioneSociale = parsedRagioneSociale.value;
  }

  if (parsedTelefono.value !== undefined) {
    data.telefono = parsedTelefono.value;
  }

  if (data.ragioneSociale === undefined && data.telefono === undefined) {
    return buildValidationFailure({
      field: "payload",
      rule: "at_least_one_field_required",
    });
  }

  return {
    ok: true,
    data,
  };
}

function parseListAuditLogsInput(
  input: ListAuditLogsInput,
):
  | { ok: true; data: ParsedListAuditLogsInput }
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

  let modelName: string | undefined;
  if (input.modelName !== undefined) {
    if (typeof input.modelName !== "string" || !input.modelName.trim()) {
      return buildValidationFailure({
        field: "modelName",
        rule: "invalid_string",
      });
    }
    modelName = input.modelName.trim();
  }

  return {
    ok: true,
    data: {
      modelName,
      page,
      pageSize: TEST_PAGE_SIZE,
    },
  };
}

function normalizeTipologiaFilter(
  value: unknown,
): TipologiaCliente | null | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  if (!normalized) {
    return undefined;
  }

  if (normalized === "PRIVATO" || normalized === "AZIENDA") {
    return normalized;
  }

  return null;
}

function parseListClientiInput(
  input: ListClientiInput,
):
  | { ok: true; data: ParsedListClientiInput }
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

  let limit = TEST_PAGE_SIZE;
  if (input.limit !== undefined) {
    const parsedLimit = asPositiveInteger(input.limit);
    if (parsedLimit === null) {
      return buildValidationFailure({
        field: "limit",
        rule: "invalid_integer",
      });
    }
    limit = parsedLimit;
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

  const tipologia = normalizeTipologiaFilter(input.tipologia);
  if (tipologia === null) {
    return buildValidationFailure({
      field: "tipologia",
      rule: "invalid_enum",
    });
  }

  return {
    ok: true,
    data: {
      page,
      limit,
      search,
      tipologia,
    },
  };
}

function appendTestAuditLog(payload: {
  userId: number | null;
  action: "CREATE" | "UPDATE" | "DELETE";
  modelName: string;
  objectId: string;
  dettagli?: AuditLogDettagli;
}): AuditLogListItem {
  const created: AuditLogListItem = {
    id: nextTestAuditLogId,
    userId: payload.userId,
    action: payload.action,
    modelName: payload.modelName,
    objectId: payload.objectId,
    timestamp: new Date().toISOString(),
    dettagli: payload.dettagli
      ? {
          old: { ...payload.dettagli.old },
          new: { ...payload.dettagli.new },
        }
      : undefined,
  };
  nextTestAuditLogId += 1;
  testAuditLogs.unshift(created);
  return created;
}

async function createClienteInTestStore(
  payload: ParsedCreateClienteInput,
): Promise<CreateClienteResult> {
  if (
    payload.email &&
    testClienti.some(
      (item) => item.email?.toLowerCase() === payload.email?.toLowerCase(),
    )
  ) {
    return buildDuplicateEmailFailure();
  }

  const codiceCliente = formatClienteCode(nextTestClienteCodeSequence);
  nextTestClienteCodeSequence += 1;

  const created: TestClienteRecord = {
    id: nextTestClienteId,
    nome: payload.nome,
    cognome: payload.cognome,
    ragioneSociale: payload.ragioneSociale,
    tipologia: payload.tipologia,
    indirizzo: payload.indirizzo,
    citta: payload.citta,
    cap: payload.cap,
    provincia: payload.provincia,
    codiceCliente,
    telefono: payload.telefono,
    email: payload.email,
    partitaIva: payload.partitaIva,
    codiceFiscale: payload.codiceFiscale,
  };

  nextTestClienteId += 1;
  testClienti.push(created);

  appendTestAuditLog({
    userId: payload.actorUserId,
    action: "CREATE",
    modelName: "Cliente",
    objectId: String(created.id),
  });

  return {
    ok: true,
    data: {
      id: created.id,
      codiceCliente: created.codiceCliente,
      nome: created.nome,
      tipologia: created.tipologia,
      email: created.email,
      partitaIva: created.partitaIva,
    },
  };
}

async function createClienteInDatabase(
  payload: ParsedCreateClienteInput,
): Promise<CreateClienteResult> {
  for (let attempt = 1; attempt <= MAX_CODICE_CLIENTE_GENERATION_ATTEMPTS; attempt += 1) {
    try {
      const created = await getPrismaClient().$transaction(
        async (tx: Prisma.TransactionClient) => {
          const latestCliente = await tx.cliente.findFirst({
            orderBy: { id: "desc" },
            select: { codiceCliente: true },
          });
          const codiceCliente = formatClienteCode(
            extractClienteCodeSequence(latestCliente?.codiceCliente ?? "") + 1,
          );

          const cliente = await tx.cliente.create({
            data: {
              nome: payload.nome,
              cognome: payload.cognome,
              ragioneSociale: payload.ragioneSociale,
              tipologia: payload.tipologia,
              indirizzo: payload.indirizzo,
              citta: payload.citta,
              cap: payload.cap,
              provincia: payload.provincia,
              codiceCliente,
              telefono: payload.telefono,
              email: payload.email,
              partitaIva: payload.partitaIva,
              codiceFiscale: payload.codiceFiscale,
            },
            select: {
              id: true,
              codiceCliente: true,
              nome: true,
              tipologia: true,
              email: true,
              partitaIva: true,
            },
          });

          await tx.auditLog.create({
            data: {
              userId: payload.actorUserId,
              action: "CREATE",
              modelName: "Cliente",
              objectId: String(cliente.id),
            },
          });

          return cliente;
        },
      );

      return {
        ok: true,
        data: {
          id: created.id,
          codiceCliente: created.codiceCliente,
          nome: created.nome,
          tipologia: created.tipologia,
          email: created.email,
          partitaIva: created.partitaIva,
        },
      };
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const targets = Array.isArray(error.meta?.target)
          ? error.meta.target.map((item) => String(item).toLowerCase())
          : [];
        if (targets.some((target) => target.includes("email"))) {
          return buildDuplicateEmailFailure();
        }

        if (
          targets.some((target) => target.includes("codicecliente")) &&
          attempt < MAX_CODICE_CLIENTE_GENERATION_ATTEMPTS
        ) {
          continue;
        }

        return buildValidationFailure({
          field: "codiceCliente",
          rule: "unique",
        });
      }

      return {
        ok: false,
        code: "SERVICE_UNAVAILABLE",
      };
    }
  }

  return buildValidationFailure({
    field: "codiceCliente",
    rule: "unique",
  });
}

async function updateFornitoreInTestStore(
  payload: ParsedUpdateFornitoreInput,
): Promise<UpdateFornitoreResult> {
  const targetIndex = testFornitori.findIndex(
    (record) => record.id === payload.fornitoreId,
  );
  if (targetIndex === -1) {
    return {
      ok: false,
      code: "NOT_FOUND",
    };
  }

  const current = testFornitori[targetIndex];
  const oldSnapshot = {
    ragioneSociale: current.ragioneSociale,
    telefono: current.telefono,
  };

  const updated: TestFornitoreRecord = {
    ...current,
    ragioneSociale:
      payload.ragioneSociale !== undefined
        ? payload.ragioneSociale
        : current.ragioneSociale,
    telefono:
      payload.telefono !== undefined ? payload.telefono : current.telefono,
  };

  testFornitori[targetIndex] = updated;

  appendTestAuditLog({
    userId: payload.actorUserId,
    action: "UPDATE",
    modelName: "Fornitore",
    objectId: String(updated.id),
    dettagli: {
      old: oldSnapshot,
      new: {
        ragioneSociale: updated.ragioneSociale,
        telefono: updated.telefono,
      },
    },
  });

  return {
    ok: true,
    data: {
      id: updated.id,
      ragioneSociale: updated.ragioneSociale,
    },
  };
}

async function updateFornitoreInDatabase(
  payload: ParsedUpdateFornitoreInput,
): Promise<UpdateFornitoreResult> {
  try {
    const result = await getPrismaClient().$transaction(
      async (tx: Prisma.TransactionClient) => {
        const existing = await tx.fornitore.findUnique({
          where: { id: payload.fornitoreId },
          select: {
            id: true,
            ragioneSociale: true,
            telefono: true,
          },
        });

        if (!existing) {
          return { ok: false, code: "NOT_FOUND" } as const;
        }

        const data: {
          ragioneSociale?: string | null;
          telefono?: string | null;
        } = {};
        if (payload.ragioneSociale !== undefined) {
          data.ragioneSociale = payload.ragioneSociale;
        }
        if (payload.telefono !== undefined) {
          data.telefono = payload.telefono;
        }

        const updated = await tx.fornitore.update({
          where: { id: payload.fornitoreId },
          data,
          select: {
            id: true,
            ragioneSociale: true,
            telefono: true,
          },
        });

        await tx.auditLog.create({
          data: {
            userId: payload.actorUserId,
            action: "UPDATE",
            modelName: "Fornitore",
            objectId: String(payload.fornitoreId),
            dettagli: {
              old: {
                ragioneSociale: existing.ragioneSociale,
                telefono: existing.telefono,
              },
              new: {
                ragioneSociale: updated.ragioneSociale,
                telefono: updated.telefono,
              },
            },
          },
        });

        return {
          ok: true,
          data: {
            id: updated.id,
            ragioneSociale: updated.ragioneSociale,
          },
        } as const;
      },
    );

    return result;
  } catch {
    return {
      ok: false,
      code: "SERVICE_UNAVAILABLE",
    };
  }
}

async function listAuditLogsInTestStore(
  payload: ParsedListAuditLogsInput,
): Promise<ListAuditLogsResult> {
  const filtered = testAuditLogs.filter((row) => {
    if (!payload.modelName) {
      return true;
    }
    return row.modelName === payload.modelName;
  });

  const offset = (payload.page - 1) * payload.pageSize;
  const results = filtered.slice(offset, offset + payload.pageSize);

  return {
    ok: true,
    data: {
      results,
      pagination: {
        page: payload.page,
        pageSize: payload.pageSize,
        total: filtered.length,
      },
    },
  };
}

async function listAuditLogsInDatabase(
  payload: ParsedListAuditLogsInput,
): Promise<ListAuditLogsResult> {
  try {
    const where: { modelName?: string } = {};
    if (payload.modelName) {
      where.modelName = payload.modelName;
    }

    const skip = (payload.page - 1) * payload.pageSize;
    const [total, rows] = await Promise.all([
      getPrismaClient().auditLog.count({ where }),
      getPrismaClient().auditLog.findMany({
        where,
        orderBy: {
          timestamp: "desc",
        },
        skip,
        take: payload.pageSize,
        select: {
          id: true,
          userId: true,
          action: true,
          modelName: true,
          objectId: true,
          timestamp: true,
          dettagli: true,
        },
      }),
    ]);

    return {
      ok: true,
      data: {
        results: rows.map((row: {
          id: number;
          userId: number | null;
          action: string;
          modelName: string;
          objectId: string;
          timestamp: Date;
          dettagli?: unknown;
        }) => ({
          id: row.id,
          userId: row.userId,
          action:
            row.action === "UPDATE" || row.action === "DELETE"
              ? row.action
              : "CREATE",
          modelName: row.modelName,
          objectId: row.objectId,
          timestamp: row.timestamp.toISOString(),
          dettagli: asAuditDettagli(row.dettagli),
        })),
        pagination: {
          page: payload.page,
          pageSize: payload.pageSize,
          total,
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

async function listClientiInTestStore(
  payload: ParsedListClientiInput,
): Promise<ListClientiResult> {
  const searchValue = payload.search?.toLowerCase();

  const filtered = testClienti
    .filter((row) => {
      if (payload.tipologia && row.tipologia !== payload.tipologia) {
        return false;
      }

      if (!searchValue) {
        return true;
      }

      return (
        row.nome.toLowerCase().includes(searchValue) ||
        row.codiceCliente.toLowerCase().includes(searchValue)
      );
    })
    .sort((left, right) => left.id - right.id);

  const total = filtered.length;
  const offset = (payload.page - 1) * payload.limit;
  const data = filtered.slice(offset, offset + payload.limit).map((row) => ({
    id: row.id,
    codiceCliente: row.codiceCliente,
    nome: row.nome,
    tipologia: row.tipologia,
  }));

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

async function listClientiInDatabase(
  payload: ParsedListClientiInput,
): Promise<ListClientiResult> {
  try {
    const where: Prisma.ClienteWhereInput = {};

    if (payload.tipologia) {
      where.tipologia = payload.tipologia;
    }

    if (payload.search) {
      where.OR = [
        {
          nome: {
            contains: payload.search,
            mode: "insensitive",
          },
        },
        {
          codiceCliente: {
            contains: payload.search,
            mode: "insensitive",
          },
        },
      ];
    }

    const skip = (payload.page - 1) * payload.limit;
    const [total, rows] = await Promise.all([
      getPrismaClient().cliente.count({ where }),
      getPrismaClient().cliente.findMany({
        where,
        orderBy: {
          id: "asc",
        },
        skip,
        take: payload.limit,
        select: {
          id: true,
          codiceCliente: true,
          nome: true,
          tipologia: true,
        },
      }),
    ]);

    return {
      ok: true,
      data: {
        data: rows.map((row) => ({
          id: row.id,
          codiceCliente: row.codiceCliente,
          nome: row.nome,
          tipologia: row.tipologia as TipologiaCliente,
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

async function createCliente(input: CreateClienteInput): Promise<CreateClienteResult> {
  const parsed = parseCreateClienteInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  if (process.env.NODE_ENV === "test") {
    return createClienteInTestStore(parsed.data);
  }

  return createClienteInDatabase(parsed.data);
}

async function updateFornitore(
  input: UpdateFornitoreInput,
): Promise<UpdateFornitoreResult> {
  const parsed = parseUpdateFornitoreInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  if (process.env.NODE_ENV === "test") {
    return updateFornitoreInTestStore(parsed.data);
  }

  return updateFornitoreInDatabase(parsed.data);
}

async function listAuditLogs(
  input: ListAuditLogsInput,
): Promise<ListAuditLogsResult> {
  const parsed = parseListAuditLogsInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  if (process.env.NODE_ENV === "test") {
    return listAuditLogsInTestStore(parsed.data);
  }

  return listAuditLogsInDatabase(parsed.data);
}

async function listClienti(
  input: ListClientiInput,
): Promise<ListClientiResult> {
  const parsed = parseListClientiInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  if (process.env.NODE_ENV === "test") {
    return listClientiInTestStore(parsed.data);
  }

  return listClientiInDatabase(parsed.data);
}

function resetAnagraficheStoreForTests(): void {
  ensureTestEnvironment();
  testClienti = cloneTestClienti(baseTestClienti);
  testFornitori = cloneTestFornitori(baseTestFornitori);
  testAuditLogs = cloneAuditLogs(baseTestAuditLogs);
  nextTestClienteId = computeNextId(testClienti.map((item) => item.id));
  nextTestClienteCodeSequence = computeNextClienteCodeSequence(testClienti);
  nextTestAuditLogId = computeNextId(testAuditLogs.map((item) => item.id));
}

function ensureTestEnvironment(): void {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("TEST_HELPER_ONLY_IN_TEST_ENV");
  }
}

export {
  createCliente,
  updateFornitore,
  listAuditLogs,
  listClienti,
  resetAnagraficheStoreForTests,
  type CreateClienteInput,
  type CreateClienteResult,
  type UpdateFornitoreInput,
  type UpdateFornitoreResult,
  type ListAuditLogsInput,
  type ListAuditLogsResult,
  type ListClientiInput,
  type ListClientiResult,
};
