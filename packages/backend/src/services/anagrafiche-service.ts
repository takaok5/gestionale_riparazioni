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

type DuplicatePartitaIvaFailure = {
  ok: false;
  code: "PARTITA_IVA_EXISTS";
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
type CategoriaFornitore = "RICAMBI" | "SERVIZI" | "ALTRO";

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

interface CreateFornitoreInput {
  actorUserId: unknown;
  nome: unknown;
  categoria: unknown;
  partitaIva: unknown;
  telefono: unknown;
  email: unknown;
  indirizzo: unknown;
  cap: unknown;
  citta: unknown;
  provincia: unknown;
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

interface GetClienteByIdInput {
  clienteId: unknown;
}

interface UpdateClienteInput {
  actorUserId: unknown;
  clienteId: unknown;
  telefono: unknown;
  email: unknown;
}

interface ListClienteRiparazioniInput {
  clienteId: unknown;
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

interface ClienteDetailPayload {
  id: number;
  codiceCliente: string;
  nome: string;
  cognome: string | null;
  ragioneSociale: string | null;
  tipologia: TipologiaCliente;
  telefono: string | null;
  email: string | null;
  indirizzo: string;
  cap: string;
  citta: string;
  provincia: string;
}

interface ClienteRiparazioneItem {
  id: number;
  codiceRiparazione: string;
  stato: string;
  dataRicezione: string;
  tipoDispositivo: string;
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

interface FornitoreCreatePayload {
  id: number;
  codiceFornitore: string;
  nome: string;
  categoria: CategoriaFornitore;
  partitaIva: string | null;
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

type CreateFornitoreResult =
  | { ok: true; data: FornitoreCreatePayload }
  | ValidationFailure
  | DuplicatePartitaIvaFailure
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

type GetClienteByIdResult =
  | { ok: true; data: { data: ClienteDetailPayload } }
  | ValidationFailure
  | NotFoundFailure
  | ServiceUnavailableFailure;

type UpdateClienteResult =
  | { ok: true; data: { data: ClienteDetailPayload } }
  | ValidationFailure
  | DuplicateEmailFailure
  | NotFoundFailure
  | ServiceUnavailableFailure;

type ListClienteRiparazioniResult =
  | { ok: true; data: { data: ClienteRiparazioneItem[] } }
  | ValidationFailure
  | NotFoundFailure
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

interface ParsedCreateFornitoreInput {
  actorUserId: number;
  nome: string;
  categoria: CategoriaFornitore;
  partitaIva: string | null;
  telefono: string | null;
  email: string | null;
  indirizzo: string;
  cap: string;
  citta: string;
  provincia: string;
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

interface ParsedGetClienteByIdInput {
  clienteId: number;
}

interface ParsedUpdateClienteInput {
  actorUserId: number;
  clienteId: number;
  telefono?: string | null;
  email?: string | null;
}

interface ParsedListClienteRiparazioniInput {
  clienteId: number;
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
  codiceFornitore: string;
  nome: string;
  categoria: CategoriaFornitore;
  partitaIva: string | null;
  ragioneSociale: string | null;
  indirizzo: string;
  citta: string;
  cap: string;
  provincia: string;
  telefono: string | null;
  email: string | null;
}

interface TestRiparazioneRecord {
  id: number;
  clienteId: number;
  codiceRiparazione: string;
  stato: string;
  dataRicezione: string;
  tipoDispositivo: string;
}

const TEST_PAGE_SIZE = 10;
const MAX_LIST_LIMIT = 100;
const MAX_CODICE_CLIENTE_GENERATION_ATTEMPTS = 3;
const MAX_CODICE_FORNITORE_GENERATION_ATTEMPTS = 3;
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
    codiceFornitore: "FOR-000000",
    nome: "Ricambi Nord",
    categoria: "RICAMBI",
    partitaIva: "33333333333",
    ragioneSociale: "Ricambi Nord",
    indirizzo: "Via Nord 5",
    citta: "Milano",
    cap: "20100",
    provincia: "MI",
    telefono: "0211122233",
    email: "ricambi.nord@test.local",
  },
];

const baseTestRiparazioni: TestRiparazioneRecord[] = [
  {
    id: 501,
    clienteId: 5,
    codiceRiparazione: "RIP-000501",
    stato: "IN_LAVORAZIONE",
    dataRicezione: "2026-02-10T09:00:00.000Z",
    tipoDispositivo: "SMARTPHONE",
  },
  {
    id: 502,
    clienteId: 5,
    codiceRiparazione: "RIP-000502",
    stato: "IN_ATTESA_RICAMBI",
    dataRicezione: "2026-02-09T09:00:00.000Z",
    tipoDispositivo: "TABLET",
  },
  {
    id: 503,
    clienteId: 5,
    codiceRiparazione: "RIP-000503",
    stato: "COMPLETATA",
    dataRicezione: "2026-02-08T09:00:00.000Z",
    tipoDispositivo: "NOTEBOOK",
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
let testRiparazioni = cloneTestRiparazioni(baseTestRiparazioni);
let testAuditLogs = cloneAuditLogs(baseTestAuditLogs);

let nextTestClienteId = computeNextId(testClienti.map((item) => item.id));
let nextTestClienteCodeSequence = computeNextClienteCodeSequence(testClienti);
let nextTestFornitoreId = computeNextId(testFornitori.map((item) => item.id));
let nextTestFornitoreCodeSequence = computeNextFornitoreCodeSequence(testFornitori);
let nextTestAuditLogId = computeNextId(testAuditLogs.map((item) => item.id));

let prismaClient: PrismaClient | null = null;

function cloneTestClienti(source: TestClienteRecord[]): TestClienteRecord[] {
  return source.map((item) => ({ ...item }));
}

function cloneTestFornitori(source: TestFornitoreRecord[]): TestFornitoreRecord[] {
  return source.map((item) => ({ ...item }));
}

function cloneTestRiparazioni(
  source: TestRiparazioneRecord[],
): TestRiparazioneRecord[] {
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

function extractFornitoreCodeSequence(codiceFornitore: string): number {
  const match = codiceFornitore.match(/(\d+)$/);
  if (!match) {
    return 0;
  }

  const parsed = Number(match[1]);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

function formatFornitoreCode(sequence: number): string {
  return `FOR-${String(sequence).padStart(6, "0")}`;
}

function computeNextClienteCodeSequence(records: TestClienteRecord[]): number {
  const maxSequence = records.reduce(
    (acc, current) => Math.max(acc, extractClienteCodeSequence(current.codiceCliente)),
    0,
  );
  return maxSequence + 1;
}

function computeNextFornitoreCodeSequence(records: TestFornitoreRecord[]): number {
  const maxSequence = records.reduce(
    (acc, current) => Math.max(acc, extractFornitoreCodeSequence(current.codiceFornitore)),
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

function buildDuplicatePartitaIvaFailure(): DuplicatePartitaIvaFailure {
  return {
    ok: false,
    code: "PARTITA_IVA_EXISTS",
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

function normalizeCategoriaFornitore(value: unknown): CategoriaFornitore | null {
  if (value === undefined || value === null) {
    return "ALTRO";
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  if (normalized === "RICAMBI" || normalized === "SERVIZI" || normalized === "ALTRO") {
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

function parseCreateFornitoreInput(
  input: CreateFornitoreInput,
):
  | { ok: true; data: ParsedCreateFornitoreInput }
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

  const categoria = normalizeCategoriaFornitore(input.categoria);
  if (!categoria) {
    return buildValidationFailure({
      field: "categoria",
      rule: "invalid_enum",
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

  const email = asOptionalString(input.email);
  if (email && !isValidEmail(email)) {
    return buildValidationFailure({
      field: "email",
      rule: "invalid_email",
    });
  }

  const partitaIva = asOptionalString(input.partitaIva);
  if (partitaIva && !isValidPartitaIvaFormat(partitaIva)) {
    return buildValidationFailure(
      {
        field: "partitaIva",
        rule: "invalid_partita_iva_format",
      },
      "P.IVA must be 11 digits",
    );
  }

  return {
    ok: true,
    data: {
      actorUserId,
      nome,
      categoria,
      partitaIva,
      telefono: asOptionalString(input.telefono),
      email: email ? email.toLowerCase() : null,
      indirizzo,
      cap,
      citta,
      provincia: provincia.toUpperCase(),
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
    return null;
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
    if (parsedLimit > MAX_LIST_LIMIT) {
      return buildValidationFailure({
        field: "limit",
        rule: "too_large",
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

function parseGetClienteByIdInput(
  input: GetClienteByIdInput,
):
  | { ok: true; data: ParsedGetClienteByIdInput }
  | ValidationFailure {
  const clienteId = asPositiveInteger(input.clienteId);
  if (clienteId === null) {
    return buildValidationFailure({
      field: "clienteId",
      rule: "invalid_integer",
    });
  }

  return {
    ok: true,
    data: {
      clienteId,
    },
  };
}

function parseUpdateClienteInput(
  input: UpdateClienteInput,
):
  | { ok: true; data: ParsedUpdateClienteInput }
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

  const parsedEmail = asNullableString(input.email);
  if (!parsedEmail.ok) {
    return {
      ...parsedEmail,
      details: {
        field: "email",
        rule: parsedEmail.details.rule,
      },
    };
  }

  if (
    parsedEmail.value !== undefined &&
    parsedEmail.value !== null &&
    !isValidEmail(parsedEmail.value)
  ) {
    return buildValidationFailure({
      field: "email",
      rule: "invalid_email",
    });
  }

  const data: ParsedUpdateClienteInput = {
    actorUserId,
    clienteId,
  };

  if (parsedTelefono.value !== undefined) {
    data.telefono = parsedTelefono.value;
  }

  if (parsedEmail.value !== undefined) {
    data.email = parsedEmail.value === null ? null : parsedEmail.value.toLowerCase();
  }

  if (data.telefono === undefined && data.email === undefined) {
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

function parseListClienteRiparazioniInput(
  input: ListClienteRiparazioniInput,
):
  | { ok: true; data: ParsedListClienteRiparazioniInput }
  | ValidationFailure {
  const clienteId = asPositiveInteger(input.clienteId);
  if (clienteId === null) {
    return buildValidationFailure({
      field: "clienteId",
      rule: "invalid_integer",
    });
  }

  return {
    ok: true,
    data: {
      clienteId,
    },
  };
}

function asStoredTipologia(value: unknown): TipologiaCliente {
  return value === "AZIENDA" ? "AZIENDA" : "PRIVATO";
}

function mapTestClienteToDetail(record: TestClienteRecord): ClienteDetailPayload {
  return {
    id: record.id,
    codiceCliente: record.codiceCliente,
    nome: record.nome,
    cognome: record.cognome,
    ragioneSociale: record.ragioneSociale,
    tipologia: record.tipologia,
    telefono: record.telefono,
    email: record.email,
    indirizzo: record.indirizzo,
    cap: record.cap,
    citta: record.citta,
    provincia: record.provincia,
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

async function createFornitoreInTestStore(
  payload: ParsedCreateFornitoreInput,
): Promise<CreateFornitoreResult> {
  if (
    payload.partitaIva &&
    testFornitori.some((item) => item.partitaIva === payload.partitaIva)
  ) {
    return buildDuplicatePartitaIvaFailure();
  }

  const codiceFornitore = formatFornitoreCode(nextTestFornitoreCodeSequence);
  nextTestFornitoreCodeSequence += 1;

  const created: TestFornitoreRecord = {
    id: nextTestFornitoreId,
    codiceFornitore,
    nome: payload.nome,
    categoria: payload.categoria,
    partitaIva: payload.partitaIva,
    ragioneSociale: payload.nome,
    indirizzo: payload.indirizzo,
    citta: payload.citta,
    cap: payload.cap,
    provincia: payload.provincia,
    telefono: payload.telefono,
    email: payload.email,
  };

  nextTestFornitoreId += 1;
  testFornitori.push(created);

  appendTestAuditLog({
    userId: payload.actorUserId,
    action: "CREATE",
    modelName: "Fornitore",
    objectId: String(created.id),
  });

  return {
    ok: true,
    data: {
      id: created.id,
      codiceFornitore: created.codiceFornitore,
      nome: created.nome,
      categoria: created.categoria,
      partitaIva: created.partitaIva,
    },
  };
}

async function createFornitoreInDatabase(
  payload: ParsedCreateFornitoreInput,
): Promise<CreateFornitoreResult> {
  if (payload.partitaIva) {
    try {
      const existing = await getPrismaClient().fornitore.findFirst({
        where: { partitaIva: payload.partitaIva },
        select: { id: true },
      });
      if (existing) {
        return buildDuplicatePartitaIvaFailure();
      }
    } catch {
      return {
        ok: false,
        code: "SERVICE_UNAVAILABLE",
      };
    }
  }

  for (let attempt = 1; attempt <= MAX_CODICE_FORNITORE_GENERATION_ATTEMPTS; attempt += 1) {
    try {
      const created = await getPrismaClient().$transaction(
        async (tx: Prisma.TransactionClient) => {
          const latestFornitore = await tx.fornitore.findFirst({
            orderBy: { id: "desc" },
            select: { codiceFornitore: true },
          });
          const codiceFornitore = formatFornitoreCode(
            extractFornitoreCodeSequence(latestFornitore?.codiceFornitore ?? "") + 1,
          );

          const fornitore = await tx.fornitore.create({
            data: {
              codiceFornitore,
              nome: payload.nome,
              categoria: payload.categoria,
              partitaIva: payload.partitaIva,
              ragioneSociale: payload.nome,
              indirizzo: payload.indirizzo,
              citta: payload.citta,
              cap: payload.cap,
              provincia: payload.provincia,
              telefono: payload.telefono,
              email: payload.email,
            },
            select: {
              id: true,
              codiceFornitore: true,
              nome: true,
              categoria: true,
              partitaIva: true,
            },
          });

          await tx.auditLog.create({
            data: {
              userId: payload.actorUserId,
              action: "CREATE",
              modelName: "Fornitore",
              objectId: String(fornitore.id),
            },
          });

          return fornitore;
        },
      );

      return {
        ok: true,
        data: {
          id: created.id,
          codiceFornitore: created.codiceFornitore,
          nome: created.nome,
          categoria:
            created.categoria === "RICAMBI" || created.categoria === "SERVIZI"
              ? created.categoria
              : "ALTRO",
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

        if (targets.some((target) => target.includes("partitaiva"))) {
          return buildDuplicatePartitaIvaFailure();
        }

        if (
          targets.some((target) => target.includes("codicefornitore")) &&
          attempt < MAX_CODICE_FORNITORE_GENERATION_ATTEMPTS
        ) {
          continue;
        }

        return buildValidationFailure({
          field: "codiceFornitore",
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
    field: "codiceFornitore",
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

async function getClienteByIdInTestStore(
  payload: ParsedGetClienteByIdInput,
): Promise<GetClienteByIdResult> {
  const target = testClienti.find((record) => record.id === payload.clienteId);
  if (!target) {
    return {
      ok: false,
      code: "NOT_FOUND",
    };
  }

  return {
    ok: true,
    data: {
      data: mapTestClienteToDetail(target),
    },
  };
}

async function getClienteByIdInDatabase(
  payload: ParsedGetClienteByIdInput,
): Promise<GetClienteByIdResult> {
  try {
    const row = await getPrismaClient().cliente.findUnique({
      where: { id: payload.clienteId },
      select: {
        id: true,
        codiceCliente: true,
        nome: true,
        cognome: true,
        ragioneSociale: true,
        tipologia: true,
        telefono: true,
        email: true,
        indirizzo: true,
        cap: true,
        citta: true,
        provincia: true,
      },
    });

    if (!row) {
      return {
        ok: false,
        code: "NOT_FOUND",
      };
    }

    return {
      ok: true,
      data: {
        data: {
          id: row.id,
          codiceCliente: row.codiceCliente,
          nome: row.nome,
          cognome: row.cognome,
          ragioneSociale: row.ragioneSociale,
          tipologia: asStoredTipologia(row.tipologia),
          telefono: row.telefono,
          email: row.email,
          indirizzo: row.indirizzo,
          cap: row.cap,
          citta: row.citta,
          provincia: row.provincia,
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

async function updateClienteInTestStore(
  payload: ParsedUpdateClienteInput,
): Promise<UpdateClienteResult> {
  const targetIndex = testClienti.findIndex(
    (record) => record.id === payload.clienteId,
  );
  if (targetIndex === -1) {
    return {
      ok: false,
      code: "NOT_FOUND",
    };
  }

  if (
    payload.email !== undefined &&
    payload.email !== null &&
    testClienti.some(
      (item) =>
        item.id !== payload.clienteId &&
        item.email?.toLowerCase() === payload.email?.toLowerCase(),
    )
  ) {
    return buildDuplicateEmailFailure();
  }

  const current = testClienti[targetIndex];
  const oldSnapshot = {
    telefono: current.telefono,
    email: current.email,
  };

  const updated: TestClienteRecord = {
    ...current,
    telefono:
      payload.telefono !== undefined ? payload.telefono : current.telefono,
    email: payload.email !== undefined ? payload.email : current.email,
  };

  testClienti[targetIndex] = updated;

  appendTestAuditLog({
    userId: payload.actorUserId,
    action: "UPDATE",
    modelName: "Cliente",
    objectId: String(updated.id),
    dettagli: {
      old: oldSnapshot,
      new: {
        telefono: updated.telefono,
        email: updated.email,
      },
    },
  });

  return {
    ok: true,
    data: {
      data: mapTestClienteToDetail(updated),
    },
  };
}

async function updateClienteInDatabase(
  payload: ParsedUpdateClienteInput,
): Promise<UpdateClienteResult> {
  try {
    const result = await getPrismaClient().$transaction(
      async (tx: Prisma.TransactionClient) => {
        const existing = await tx.cliente.findUnique({
          where: { id: payload.clienteId },
          select: {
            id: true,
            codiceCliente: true,
            nome: true,
            cognome: true,
            ragioneSociale: true,
            tipologia: true,
            telefono: true,
            email: true,
            indirizzo: true,
            cap: true,
            citta: true,
            provincia: true,
          },
        });

        if (!existing) {
          return { ok: false, code: "NOT_FOUND" } as const;
        }

        const data: {
          telefono?: string | null;
          email?: string | null;
        } = {};
        if (payload.telefono !== undefined) {
          data.telefono = payload.telefono;
        }
        if (payload.email !== undefined) {
          data.email = payload.email;
        }

        const updated = await tx.cliente.update({
          where: { id: payload.clienteId },
          data,
          select: {
            id: true,
            codiceCliente: true,
            nome: true,
            cognome: true,
            ragioneSociale: true,
            tipologia: true,
            telefono: true,
            email: true,
            indirizzo: true,
            cap: true,
            citta: true,
            provincia: true,
          },
        });

        await tx.auditLog.create({
          data: {
            userId: payload.actorUserId,
            action: "UPDATE",
            modelName: "Cliente",
            objectId: String(payload.clienteId),
            dettagli: {
              old: {
                telefono: existing.telefono,
                email: existing.email,
              },
              new: {
                telefono: updated.telefono,
                email: updated.email,
              },
            },
          },
        });

        return {
          ok: true,
          data: {
            data: {
              id: updated.id,
              codiceCliente: updated.codiceCliente,
              nome: updated.nome,
              cognome: updated.cognome,
              ragioneSociale: updated.ragioneSociale,
              tipologia: asStoredTipologia(updated.tipologia),
              telefono: updated.telefono,
              email: updated.email,
              indirizzo: updated.indirizzo,
              cap: updated.cap,
              citta: updated.citta,
              provincia: updated.provincia,
            },
          },
        } as const;
      },
    );

    return result;
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
    }

    return {
      ok: false,
      code: "SERVICE_UNAVAILABLE",
    };
  }
}

async function listClienteRiparazioniInTestStore(
  payload: ParsedListClienteRiparazioniInput,
): Promise<ListClienteRiparazioniResult> {
  const exists = testClienti.some((record) => record.id === payload.clienteId);
  if (!exists) {
    return {
      ok: false,
      code: "NOT_FOUND",
    };
  }

  const rows = testRiparazioni
    .filter((row) => row.clienteId === payload.clienteId)
    .sort((left, right) => left.id - right.id)
    .map((row) => ({
      id: row.id,
      codiceRiparazione: row.codiceRiparazione,
      stato: row.stato,
      dataRicezione: row.dataRicezione,
      tipoDispositivo: row.tipoDispositivo,
    }));

  return {
    ok: true,
    data: {
      data: rows,
    },
  };
}

async function listClienteRiparazioniInDatabase(
  payload: ParsedListClienteRiparazioniInput,
): Promise<ListClienteRiparazioniResult> {
  try {
    const existing = await getPrismaClient().cliente.findUnique({
      where: { id: payload.clienteId },
      select: { id: true },
    });

    if (!existing) {
      return {
        ok: false,
        code: "NOT_FOUND",
      };
    }

    const rows = await getPrismaClient().riparazione.findMany({
      where: { clienteId: payload.clienteId },
      orderBy: [
        { dataRicezione: "desc" },
        { id: "asc" },
      ],
      select: {
        id: true,
        codiceRiparazione: true,
        stato: true,
        dataRicezione: true,
        tipoDispositivo: true,
      },
    });

    return {
      ok: true,
      data: {
        data: rows.map((row) => ({
          id: row.id,
          codiceRiparazione: row.codiceRiparazione,
          stato: row.stato,
          dataRicezione: row.dataRicezione.toISOString(),
          tipoDispositivo: row.tipoDispositivo,
        })),
      },
    };
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2021"
    ) {
      return {
        ok: true,
        data: {
          data: [],
        },
      };
    }

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

async function createFornitore(
  input: CreateFornitoreInput,
): Promise<CreateFornitoreResult> {
  const parsed = parseCreateFornitoreInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  if (process.env.NODE_ENV === "test") {
    return createFornitoreInTestStore(parsed.data);
  }

  return createFornitoreInDatabase(parsed.data);
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

async function getClienteById(
  input: GetClienteByIdInput,
): Promise<GetClienteByIdResult> {
  const parsed = parseGetClienteByIdInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  if (process.env.NODE_ENV === "test") {
    return getClienteByIdInTestStore(parsed.data);
  }

  return getClienteByIdInDatabase(parsed.data);
}

async function updateCliente(
  input: UpdateClienteInput,
): Promise<UpdateClienteResult> {
  const parsed = parseUpdateClienteInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  if (process.env.NODE_ENV === "test") {
    return updateClienteInTestStore(parsed.data);
  }

  return updateClienteInDatabase(parsed.data);
}

async function listClienteRiparazioni(
  input: ListClienteRiparazioniInput,
): Promise<ListClienteRiparazioniResult> {
  const parsed = parseListClienteRiparazioniInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  if (process.env.NODE_ENV === "test") {
    return listClienteRiparazioniInTestStore(parsed.data);
  }

  return listClienteRiparazioniInDatabase(parsed.data);
}

function resetAnagraficheStoreForTests(): void {
  ensureTestEnvironment();
  testClienti = cloneTestClienti(baseTestClienti);
  testFornitori = cloneTestFornitori(baseTestFornitori);
  testRiparazioni = cloneTestRiparazioni(baseTestRiparazioni);
  testAuditLogs = cloneAuditLogs(baseTestAuditLogs);
  nextTestClienteId = computeNextId(testClienti.map((item) => item.id));
  nextTestClienteCodeSequence = computeNextClienteCodeSequence(testClienti);
  nextTestFornitoreId = computeNextId(testFornitori.map((item) => item.id));
  nextTestFornitoreCodeSequence = computeNextFornitoreCodeSequence(testFornitori);
  nextTestAuditLogId = computeNextId(testAuditLogs.map((item) => item.id));
}

function ensureTestEnvironment(): void {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("TEST_HELPER_ONLY_IN_TEST_ENV");
  }
}

export {
  createCliente,
  createFornitore,
  getClienteById,
  updateCliente,
  updateFornitore,
  listAuditLogs,
  listClienti,
  listClienteRiparazioni,
  resetAnagraficheStoreForTests,
  type CreateClienteInput,
  type CreateClienteResult,
  type CreateFornitoreInput,
  type CreateFornitoreResult,
  type GetClienteByIdInput,
  type GetClienteByIdResult,
  type UpdateClienteInput,
  type UpdateClienteResult,
  type UpdateFornitoreInput,
  type UpdateFornitoreResult,
  type ListAuditLogsInput,
  type ListAuditLogsResult,
  type ListClientiInput,
  type ListClientiResult,
  type ListClienteRiparazioniInput,
  type ListClienteRiparazioniResult,
};
