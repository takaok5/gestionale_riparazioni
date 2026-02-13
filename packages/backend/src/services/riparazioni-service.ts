import { PrismaClient, type Prisma } from "@prisma/client";
import { getUserRoleForTests } from "./users-service.js";
import {
  createArticoloMovimento,
  getArticoloById,
  getClienteById,
} from "./anagrafiche-service.js";
import {
  createRiparazioneStatoNotifica,
  resetNotificheStoreForTests,
  type NotificaPayload,
} from "./notifiche-service.js";
import { buildRiparazioneEtichettaPdf } from "./riparazioni-etichetta-pdf.js";
import { buildRiparazioneRicevutaPdf } from "./riparazioni-ricevuta-pdf.js";

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
  clienteId?: unknown;
  tecnicoId: unknown;
  priorita: unknown;
  dataRicezioneDa: unknown;
  dataRicezioneA: unknown;
  search: unknown;
}

interface GetRiparazioneDettaglioInput {
  riparazioneId: unknown;
}

interface GetRiparazioneEtichettaPdfInput {
  riparazioneId: unknown;
}

interface GetRiparazioneRicevutaPdfInput {
  riparazioneId: unknown;
}

interface AssegnaRiparazioneTecnicoInput {
  riparazioneId: unknown;
  tecnicoId: unknown;
}

interface CambiaStatoRiparazioneInput {
  riparazioneId: unknown;
  actorUserId: unknown;
  actorRole: unknown;
  stato: unknown;
  note?: unknown;
}

interface CreateRiparazioneRicambioInput {
  riparazioneId: unknown;
  actorUserId: unknown;
  articoloId: unknown;
  quantita: unknown;
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

interface RiparazioneClientePayload {
  id: number;
  nome: string;
  telefono: string;
  email: string;
}

interface RiparazioneTecnicoPayload {
  id: number;
  username: string;
}

interface RiparazioneStatoHistoryPayload {
  stato: string;
  dataOra: string;
  userId: number;
  note: string;
}

interface RiparazionePreventivoPayload {
  id: number;
  numeroPreventivo: string;
  stato: string;
  totale: number;
}

interface RiparazioneRicambioPayload {
  id: number;
  articolo: {
    id: number;
    nome: string;
    codiceArticolo: string;
  };
  codiceArticolo: string;
  descrizione: string;
  quantita: number;
  prezzoUnitario: number;
}

interface RiparazioneDettaglioPayload {
  id: number;
  codiceRiparazione: string;
  stato: string;
  cliente: RiparazioneClientePayload;
  tecnico: RiparazioneTecnicoPayload;
  statiHistory: RiparazioneStatoHistoryPayload[];
  preventivi: RiparazionePreventivoPayload[];
  ricambi: RiparazioneRicambioPayload[];
}

interface GetRiparazioneDettaglioResponsePayload {
  data: RiparazioneDettaglioPayload;
}

interface AssegnaRiparazioneTecnicoPayload {
  id: number;
  tecnicoId: number;
}

interface CambiaStatoRiparazionePayload {
  id: number;
  stato: string;
  notifica?: NotificaPayload;
}

interface CreateRiparazioneRicambioPayload {
  id: number;
  articoloId: number;
  quantita: number;
  prezzoUnitario: number;
}

interface TestRiparazioneRecord extends CreatedRiparazionePayload {
  statiHistory: RiparazioneStatoHistoryPayload[];
  preventivi: RiparazionePreventivoPayload[];
  ricambi: RiparazioneRicambioPayload[];
}

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

type NotFoundFailure = {
  ok: false;
  code: "NOT_FOUND";
};

type ForbiddenFailure = {
  ok: false;
  code: "FORBIDDEN";
  message?: string;
};

type UserNotFoundFailure = {
  ok: false;
  code: "USER_NOT_FOUND";
};

type ServiceUnavailableFailure = {
  ok: false;
  code: "SERVICE_UNAVAILABLE";
};

type ArticoloNotFoundFailure = {
  ok: false;
  code: "ARTICOLO_NOT_FOUND";
};

type InsufficientStockFailure = {
  ok: false;
  code: "INSUFFICIENT_STOCK";
  message: string;
};

type CreateRiparazioneResult =
  | { ok: true; data: CreatedRiparazionePayload }
  | ValidationFailure
  | ClienteNotFoundFailure;

type ListRiparazioniResult =
  | { ok: true; data: ListRiparazioniResponsePayload }
  | ValidationFailure
  | ServiceUnavailableFailure;

type GetRiparazioneDettaglioResult =
  | { ok: true; data: GetRiparazioneDettaglioResponsePayload }
  | ValidationFailure
  | NotFoundFailure
  | ServiceUnavailableFailure;

type GetRiparazioneEtichettaPdfResult =
  | { ok: true; data: { fileName: string; content: Buffer } }
  | ValidationFailure
  | NotFoundFailure
  | ServiceUnavailableFailure;

type GetRiparazioneRicevutaPdfResult =
  | { ok: true; data: { fileName: string; content: Buffer } }
  | ValidationFailure
  | NotFoundFailure
  | ServiceUnavailableFailure;

type AssegnaRiparazioneTecnicoResult =
  | { ok: true; data: AssegnaRiparazioneTecnicoPayload }
  | ValidationFailure
  | NotFoundFailure
  | UserNotFoundFailure
  | ServiceUnavailableFailure;

type CambiaStatoRiparazioneResult =
  | { ok: true; data: CambiaStatoRiparazionePayload }
  | ValidationFailure
  | NotFoundFailure
  | ForbiddenFailure
  | ServiceUnavailableFailure;

type CreateRiparazioneRicambioResult =
  | { ok: true; data: CreateRiparazioneRicambioPayload }
  | ValidationFailure
  | NotFoundFailure
  | ArticoloNotFoundFailure
  | InsufficientStockFailure
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
  clienteId?: number;
  tecnicoId?: number;
  priorita?: Priorita;
  dataRicezioneDa?: Date;
  dataRicezioneA?: Date;
  search?: string;
}

interface ParsedGetRiparazioneDettaglioInput {
  riparazioneId: number;
}

interface ParsedGetRiparazioneEtichettaPdfInput {
  riparazioneId: number;
}

interface ParsedGetRiparazioneRicevutaPdfInput {
  riparazioneId: number;
}

interface ParsedAssegnaRiparazioneTecnicoInput {
  riparazioneId: number;
  tecnicoId: number;
}

interface ParsedCambiaStatoRiparazioneInput {
  riparazioneId: number;
  actorUserId: number;
  actorRole: string;
  stato: string;
  note?: string;
}

interface ParsedCreateRiparazioneRicambioInput {
  riparazioneId: number;
  actorUserId: number;
  articoloId: number;
  quantita: number;
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
const ALLOWED_ACTOR_ROLES = new Set<string>(["ADMIN", "TECNICO", "COMMERCIALE"]);
const BASE_ALLOWED_TRANSITIONS = new Map<string, Set<string>>([
  ["RICEVUTA", new Set<string>(["IN_DIAGNOSI"])],
  ["IN_DIAGNOSI", new Set<string>(["RICEVUTA", "IN_LAVORAZIONE", "PREVENTIVO_EMESSO"])],
  ["PREVENTIVO_EMESSO", new Set<string>(["IN_ATTESA_APPROVAZIONE"])],
  ["IN_ATTESA_APPROVAZIONE", new Set<string>(["APPROVATA", "ANNULLATA"])],
  ["APPROVATA", new Set<string>(["IN_ATTESA_RICAMBI", "IN_LAVORAZIONE"])],
  ["IN_ATTESA_RICAMBI", new Set<string>(["IN_LAVORAZIONE"])],
  ["IN_LAVORAZIONE", new Set<string>(["COMPLETATA"])],
  ["COMPLETATA", new Set<string>(["CONSEGNATA"])],
]);
const INITIAL_STATO = "RICEVUTA";
const DEFAULT_LIST_LIMIT = 15;
const MAX_LIST_LIMIT = 100;
const TEST_EXISTING_CLIENT_IDS = new Set<number>([5]);
const RICEVUTA_CONDIZIONI_SERVIZIO =
  "CONDIZIONI DI SERVIZIO: Il laboratorio non risponde di eventuali dati presenti sul dispositivo. Il cliente autorizza la diagnosi tecnica.";

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

  let clienteId: number | undefined;
  if (input.clienteId !== undefined && input.clienteId !== null) {
    const parsedClienteId = asPositiveInteger(input.clienteId);
    if (parsedClienteId === null) {
      return buildValidationFailure({
        field: "clienteId",
        rule: "invalid_integer",
      });
    }
    clienteId = parsedClienteId;
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
      clienteId,
      tecnicoId,
      priorita,
      dataRicezioneDa,
      dataRicezioneA,
      search,
    },
  };
}

function parseGetRiparazioneDettaglioInput(
  input: GetRiparazioneDettaglioInput,
):
  | { ok: true; data: ParsedGetRiparazioneDettaglioInput }
  | ValidationFailure {
  const riparazioneId = asPositiveInteger(input.riparazioneId);
  if (riparazioneId === null) {
    return buildValidationFailure({
      field: "riparazioneId",
      rule: "invalid_integer",
    });
  }

  return {
    ok: true,
    data: {
      riparazioneId,
    },
  };
}

function parseGetRiparazioneEtichettaPdfInput(
  input: GetRiparazioneEtichettaPdfInput,
):
  | { ok: true; data: ParsedGetRiparazioneEtichettaPdfInput }
  | ValidationFailure {
  const riparazioneId = asPositiveInteger(input.riparazioneId);
  if (riparazioneId === null) {
    return buildValidationFailure({
      field: "riparazioneId",
      rule: "invalid_integer",
    });
  }

  return {
    ok: true,
    data: {
      riparazioneId,
    },
  };
}

function parseGetRiparazioneRicevutaPdfInput(
  input: GetRiparazioneRicevutaPdfInput,
):
  | { ok: true; data: ParsedGetRiparazioneRicevutaPdfInput }
  | ValidationFailure {
  const riparazioneId = asPositiveInteger(input.riparazioneId);
  if (riparazioneId === null) {
    return buildValidationFailure({
      field: "riparazioneId",
      rule: "invalid_integer",
    });
  }

  return {
    ok: true,
    data: {
      riparazioneId,
    },
  };
}

// AC-2: Extend customer projection for nome -> codiceCliente fallback.
function resolveClienteLabel(
  nome: string | null | undefined,
  ragioneSociale: string | null | undefined,
  codiceCliente: string,
): string {
  if (typeof nome === "string" && nome.trim()) {
    return nome.trim();
  }

  if (typeof ragioneSociale === "string" && ragioneSociale.trim()) {
    return ragioneSociale.trim();
  }

  return codiceCliente;
}

function formatDateForLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = String(date.getUTCFullYear());
  return `${day}/${month}/${year}`;
}

function splitAccessoriConsegnati(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter((item) => item.length > 0);
}

function parseAssegnaRiparazioneTecnicoInput(
  input: AssegnaRiparazioneTecnicoInput,
):
  | { ok: true; data: ParsedAssegnaRiparazioneTecnicoInput }
  | ValidationFailure {
  const riparazioneId = asPositiveInteger(input.riparazioneId);
  if (riparazioneId === null) {
    return buildValidationFailure({
      field: "riparazioneId",
      rule: "invalid_integer",
    });
  }

  const tecnicoId = asPositiveInteger(input.tecnicoId);
  if (tecnicoId === null) {
    return buildValidationFailure({
      field: "tecnicoId",
      rule: "invalid_integer",
    });
  }

  return {
    ok: true,
    data: {
      riparazioneId,
      tecnicoId,
    },
  };
}

function parseCambiaStatoRiparazioneInput(
  input: CambiaStatoRiparazioneInput,
):
  | { ok: true; data: ParsedCambiaStatoRiparazioneInput }
  | ValidationFailure {
  const riparazioneId = asPositiveInteger(input.riparazioneId);
  if (riparazioneId === null) {
    return buildValidationFailure({
      field: "riparazioneId",
      rule: "invalid_integer",
    });
  }

  const actorUserId = asPositiveInteger(input.actorUserId);
  if (actorUserId === null) {
    return buildValidationFailure({
      field: "actorUserId",
      rule: "invalid_integer",
    });
  }

  const actorRole = asRequiredString(input.actorRole);
  if (!actorRole) {
    return buildValidationFailure({
      field: "actorRole",
      rule: "required",
    });
  }

  const normalizedActorRole = actorRole.toUpperCase();
  if (!ALLOWED_ACTOR_ROLES.has(normalizedActorRole)) {
    return buildValidationFailure({
      field: "actorRole",
      rule: "invalid_enum",
    });
  }

  const stato = normalizeStatoFilter(input.stato);
  if (stato === undefined) {
    return buildValidationFailure(
      {
        field: "stato",
        rule: "required",
      },
      "stato is required",
    );
  }

  if (stato === null) {
    return buildValidationFailure({
      field: "stato",
      rule: "invalid_enum",
    });
  }

  let note: string | undefined;
  if (input.note !== undefined && input.note !== null) {
    if (typeof input.note !== "string") {
      return buildValidationFailure({
        field: "note",
        rule: "invalid_string",
      });
    }

    const trimmedNote = input.note.trim();
    if (!trimmedNote) {
      return buildValidationFailure({
        field: "note",
        rule: "invalid_string",
      });
    }

    note = trimmedNote;
  }

  return {
    ok: true,
    data: {
      riparazioneId,
      actorUserId,
      actorRole: normalizedActorRole,
      stato,
      note,
    },
  };
}

function parseCreateRiparazioneRicambioInput(
  input: CreateRiparazioneRicambioInput,
):
  | { ok: true; data: ParsedCreateRiparazioneRicambioInput }
  | ValidationFailure {
  const riparazioneId = asPositiveInteger(input.riparazioneId);
  if (riparazioneId === null) {
    return buildValidationFailure({
      field: "riparazioneId",
      rule: "invalid_integer",
    });
  }

  const actorUserId = asPositiveInteger(input.actorUserId);
  if (actorUserId === null) {
    return buildValidationFailure({
      field: "actorUserId",
      rule: "invalid_integer",
    });
  }

  const articoloId = asPositiveInteger(input.articoloId);
  if (articoloId === null) {
    return buildValidationFailure({
      field: "articoloId",
      rule: "invalid_integer",
    });
  }

  const quantita = asPositiveInteger(input.quantita);
  if (quantita === null) {
    return buildValidationFailure({
      field: "quantita",
      rule: "invalid_integer",
    });
  }

  return {
    ok: true,
    data: {
      riparazioneId,
      actorUserId,
      articoloId,
      quantita,
    },
  };
}

function isBaseTransitionAllowed(from: string, to: string): boolean {
  const allowed = BASE_ALLOWED_TRANSITIONS.get(from);
  if (!allowed) {
    return false;
  }

  return allowed.has(to);
}

function buildInvalidTransitionMessage(from: string, to: string): string {
  return `Invalid state transition from ${from} to ${to}`;
}

function validateBaseTransition(
  from: string,
  to: string,
): ValidationFailure | null {
  if (isBaseTransitionAllowed(from, to)) {
    return null;
  }

  return buildValidationFailure(
    {
      field: "stato",
      rule: "invalid_transition",
    },
    buildInvalidTransitionMessage(from, to),
  );
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

function buildTestPreventivi(
  riparazioneId: number,
): RiparazionePreventivoPayload[] {
  return [
    {
      id: riparazioneId * 100 + 1,
      numeroPreventivo: `PREV-${riparazioneId.toString().padStart(4, "0")}-01`,
      stato: "EMESSO",
      totale: 149.99,
    },
    {
      id: riparazioneId * 100 + 2,
      numeroPreventivo: `PREV-${riparazioneId.toString().padStart(4, "0")}-02`,
      stato: "APPROVATO",
      totale: 219.5,
    },
  ];
}

function buildTestRicambi(riparazioneId: number): RiparazioneRicambioPayload[] {
  return [
    {
      id: riparazioneId * 1000 + 1,
      articolo: {
        id: 5001,
        nome: "Display OLED",
        codiceArticolo: "RIC-SCH-001",
      },
      codiceArticolo: "RIC-SCH-001",
      descrizione: "Display OLED",
      quantita: 1,
      prezzoUnitario: 89.9,
    },
    {
      id: riparazioneId * 1000 + 2,
      articolo: {
        id: 5002,
        nome: "Batteria 4500mAh",
        codiceArticolo: "RIC-BAT-002",
      },
      codiceArticolo: "RIC-BAT-002",
      descrizione: "Batteria 4500mAh",
      quantita: 1,
      prezzoUnitario: 34.5,
    },
    {
      id: riparazioneId * 1000 + 3,
      articolo: {
        id: 5003,
        nome: "Connettore ricarica",
        codiceArticolo: "RIC-CON-003",
      },
      codiceArticolo: "RIC-CON-003",
      descrizione: "Connettore ricarica",
      quantita: 1,
      prezzoUnitario: 12.0,
    },
    {
      id: riparazioneId * 1000 + 4,
      articolo: {
        id: 5004,
        nome: "Set viti telaio",
        codiceArticolo: "RIC-VIT-004",
      },
      codiceArticolo: "RIC-VIT-004",
      descrizione: "Set viti telaio",
      quantita: 8,
      prezzoUnitario: 0.3,
    },
    {
      id: riparazioneId * 1000 + 5,
      articolo: {
        id: 5005,
        nome: "Guarnizione impermeabile",
        codiceArticolo: "RIC-GUA-005",
      },
      codiceArticolo: "RIC-GUA-005",
      descrizione: "Guarnizione impermeabile",
      quantita: 1,
      prezzoUnitario: 6.5,
    },
  ];
}

function buildTestClientePayload(clienteId: number): RiparazioneClientePayload {
  if (clienteId === 5) {
    return {
      id: 5,
      nome: "Cliente Test 5",
      telefono: "3331234505",
      email: "cliente5@test.local",
    };
  }

  return {
    id: clienteId,
    nome: `Cliente ${clienteId}`,
    telefono: "0000000000",
    email: `cliente${clienteId}@test.local`,
  };
}

function buildTestTecnicoPayload(tecnicoId: number | null): RiparazioneTecnicoPayload {
  const id = tecnicoId ?? 0;

  return {
    id,
    username: `tecnico-${id}`,
  };
}

function toDettaglioPayload(record: TestRiparazioneRecord): RiparazioneDettaglioPayload {
  return {
    id: record.id,
    codiceRiparazione: record.codiceRiparazione,
    stato: record.stato,
    cliente: buildTestClientePayload(record.clienteId),
    tecnico: buildTestTecnicoPayload(record.tecnicoId),
    statiHistory: record.statiHistory.map((entry) => ({ ...entry })),
    preventivi: record.preventivi.map((entry) => ({ ...entry })),
    ricambi: record.ricambi.map((entry) => ({ ...entry })),
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
  const riparazioneId = nextTestRiparazioneId;
  const codiceRiparazione =
    riparazioneId === 10
      ? "RIP-20260209-0001"
      : formatRiparazioneCode(dateCode, sequence);

  const created: TestRiparazioneRecord = {
    id: riparazioneId,
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
    statiHistory: [],
    preventivi: buildTestPreventivi(riparazioneId),
    ricambi: buildTestRicambi(riparazioneId),
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
      if (payload.clienteId !== undefined && row.clienteId !== payload.clienteId) {
        return false;
      }

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

    if (payload.clienteId !== undefined) {
      where.clienteId = payload.clienteId;
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

async function getRiparazioneDettaglioInTestStore(
  payload: ParsedGetRiparazioneDettaglioInput,
): Promise<GetRiparazioneDettaglioResult> {
  const target = testRiparazioni.find((row) => row.id === payload.riparazioneId);
  if (!target) {
    return {
      ok: false,
      code: "NOT_FOUND",
    };
  }

  return {
    ok: true,
    data: {
      data: toDettaglioPayload(target),
    },
  };
}

async function getRiparazioneDettaglioInDatabase(
  payload: ParsedGetRiparazioneDettaglioInput,
): Promise<GetRiparazioneDettaglioResult> {
  try {
    const prisma = getPrismaClient();
    const row = await prisma.riparazione.findUnique({
      where: { id: payload.riparazioneId },
      select: {
        id: true,
        codiceRiparazione: true,
        stato: true,
        tecnicoId: true,
        cliente: {
          select: {
            id: true,
            nome: true,
            telefono: true,
            email: true,
          },
        },
        tecnico: {
          select: {
            id: true,
            username: true,
          },
        },
        statiHistory: {
          orderBy: {
            dataOra: "asc",
          },
          select: {
            stato: true,
            dataOra: true,
            userId: true,
            note: true,
          },
        },
        preventivi: {
          orderBy: {
            id: "asc",
          },
          select: {
            id: true,
            numeroPreventivo: true,
            stato: true,
            totale: true,
          },
        },
        ricambi: {
          orderBy: {
            id: "asc",
          },
          select: {
            id: true,
            codiceArticolo: true,
            descrizione: true,
            quantita: true,
            prezzoUnitario: true,
          },
        },
      },
    });

    if (!row) {
      return {
        ok: false,
        code: "NOT_FOUND",
      };
    }

    const articoloModel = prisma as PrismaClient & {
      articolo?: {
        findMany: (args: unknown) => Promise<
          Array<{ id: number; nome: string; codiceArticolo: string }>
        >;
      };
    };
    const articoliByCodice = new Map<string, { id: number; nome: string; codiceArticolo: string }>();
    if (articoloModel.articolo && row.ricambi.length > 0) {
      const codici = Array.from(new Set(row.ricambi.map((entry) => entry.codiceArticolo)));
      const articoli = await articoloModel.articolo.findMany({
        where: {
          codiceArticolo: {
            in: codici,
          },
        },
        select: {
          id: true,
          nome: true,
          codiceArticolo: true,
        },
      });
      for (const articolo of articoli) {
        articoliByCodice.set(articolo.codiceArticolo, articolo);
      }
    }

    return {
      ok: true,
      data: {
        data: {
          id: row.id,
          codiceRiparazione: row.codiceRiparazione,
          stato: row.stato,
          cliente: {
            id: row.cliente.id,
            nome: row.cliente.nome,
            telefono: row.cliente.telefono ?? "",
            email: row.cliente.email ?? "",
          },
          tecnico: row.tecnico
            ? {
                id: row.tecnico.id,
                username: row.tecnico.username,
              }
            : {
                id: row.tecnicoId ?? 0,
                username: row.tecnicoId
                  ? `tecnico-${row.tecnicoId}`
                  : "tecnico-0",
              },
          statiHistory: row.statiHistory.map((entry) => ({
            stato: entry.stato,
            dataOra: entry.dataOra.toISOString(),
            userId: entry.userId ?? 0,
            note: entry.note ?? "",
          })),
          preventivi: row.preventivi.map((entry) => ({
            id: entry.id,
            numeroPreventivo: entry.numeroPreventivo,
            stato: entry.stato,
            totale: entry.totale,
          })),
          ricambi: row.ricambi.map((entry) => ({
            articolo: {
              id: articoliByCodice.get(entry.codiceArticolo)?.id ?? 0,
              nome:
                articoliByCodice.get(entry.codiceArticolo)?.nome ?? entry.descrizione,
              codiceArticolo: entry.codiceArticolo,
            },
            id: entry.id,
            codiceArticolo: entry.codiceArticolo,
            descrizione: entry.descrizione,
            quantita: entry.quantita,
            prezzoUnitario: entry.prezzoUnitario,
          })),
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

async function getRiparazioneEtichettaPdfInTestStore(
  payload: ParsedGetRiparazioneEtichettaPdfInput,
): Promise<GetRiparazioneEtichettaPdfResult> {
  const target = testRiparazioni.find((row) => row.id === payload.riparazioneId);
  if (!target) {
    return {
      ok: false,
      code: "NOT_FOUND",
    };
  }

  const clienteResult = await getClienteById({ clienteId: target.clienteId });
  if (!clienteResult.ok) {
    return {
      ok: false,
      code: "SERVICE_UNAVAILABLE",
    };
  }

  const clienteLabel = resolveClienteLabel(
    clienteResult.data.data.nome,
    clienteResult.data.data.ragioneSociale,
    clienteResult.data.data.codiceCliente,
  );

  try {
    const pdfBuffer = await buildRiparazioneEtichettaPdf({
      codiceRiparazione: target.codiceRiparazione,
      cliente: clienteLabel,
      marca: target.marcaDispositivo,
      modello: target.modelloDispositivo,
      dataRicezione: formatDateForLabel(target.dataRicezione),
      qrPayload: target.codiceRiparazione,
    });

    return {
      ok: true,
      data: {
        fileName: `etichetta-riparazione-${target.id}.pdf`,
        content: pdfBuffer,
      },
    };
  } catch {
    return {
      ok: false,
      code: "SERVICE_UNAVAILABLE",
    };
  }
}

async function getRiparazioneEtichettaPdfInDatabase(
  payload: ParsedGetRiparazioneEtichettaPdfInput,
): Promise<GetRiparazioneEtichettaPdfResult> {
  try {
    const prisma = getPrismaClient();
    const row = await prisma.riparazione.findUnique({
      where: { id: payload.riparazioneId },
      select: {
        id: true,
        clienteId: true,
        codiceRiparazione: true,
        dataRicezione: true,
        marcaDispositivo: true,
        modelloDispositivo: true,
      },
    });

    if (!row) {
      return {
        ok: false,
        code: "NOT_FOUND",
      };
    }

    const clienteResult = await getClienteById({ clienteId: row.clienteId });
    if (!clienteResult.ok) {
      return {
        ok: false,
        code: "SERVICE_UNAVAILABLE",
      };
    }

    const clienteLabel = resolveClienteLabel(
      clienteResult.data.data.nome,
      clienteResult.data.data.ragioneSociale,
      clienteResult.data.data.codiceCliente,
    );

    const pdfBuffer = await buildRiparazioneEtichettaPdf({
      codiceRiparazione: row.codiceRiparazione,
      cliente: clienteLabel,
      marca: row.marcaDispositivo,
      modello: row.modelloDispositivo,
      dataRicezione: formatDateForLabel(row.dataRicezione.toISOString()),
      qrPayload: row.codiceRiparazione,
    });

    return {
      ok: true,
      data: {
        fileName: `etichetta-riparazione-${row.id}.pdf`,
        content: pdfBuffer,
      },
    };
  } catch {
    return {
      ok: false,
      code: "SERVICE_UNAVAILABLE",
    };
  }
}

async function getRiparazioneRicevutaPdfInTestStore(
  payload: ParsedGetRiparazioneRicevutaPdfInput,
): Promise<GetRiparazioneRicevutaPdfResult> {
  const target = testRiparazioni.find((row) => row.id === payload.riparazioneId);
  if (!target) {
    return {
      ok: false,
      code: "NOT_FOUND",
    };
  }

  const clienteResult = await getClienteById({ clienteId: target.clienteId });
  if (!clienteResult.ok) {
    return {
      ok: false,
      code: "SERVICE_UNAVAILABLE",
    };
  }

  const clienteNome = resolveClienteLabel(
    clienteResult.data.data.nome,
    clienteResult.data.data.ragioneSociale,
    clienteResult.data.data.codiceCliente,
  );
  const accessoriConsegnati = splitAccessoriConsegnati(target.accessoriConsegnati);

  try {
    const pdfBuffer = await buildRiparazioneRicevutaPdf({
      codiceRiparazione: target.codiceRiparazione,
      clienteNome,
      clienteTelefono: clienteResult.data.data.telefono?.trim() ?? "",
      clienteEmail: clienteResult.data.data.email?.trim() ?? "",
      dispositivoTipo: target.tipoDispositivo,
      dispositivoMarca: target.marcaDispositivo,
      dispositivoModello: target.modelloDispositivo,
      dispositivoSeriale: target.serialeDispositivo,
      descrizioneProblema: target.descrizioneProblema,
      accessoriConsegnati,
      dataRicezione: formatDateForLabel(target.dataRicezione),
      condizioniServizio: RICEVUTA_CONDIZIONI_SERVIZIO,
    });

    return {
      ok: true,
      data: {
        fileName: `ricevuta-riparazione-${target.id}.pdf`,
        content: pdfBuffer,
      },
    };
  } catch {
    return {
      ok: false,
      code: "SERVICE_UNAVAILABLE",
    };
  }
}

async function getRiparazioneRicevutaPdfInDatabase(
  payload: ParsedGetRiparazioneRicevutaPdfInput,
): Promise<GetRiparazioneRicevutaPdfResult> {
  try {
    const prisma = getPrismaClient();
    const row = await prisma.riparazione.findUnique({
      where: { id: payload.riparazioneId },
      select: {
        id: true,
        clienteId: true,
        codiceRiparazione: true,
        dataRicezione: true,
        tipoDispositivo: true,
        marcaDispositivo: true,
        modelloDispositivo: true,
        serialeDispositivo: true,
        descrizioneProblema: true,
        accessoriConsegnati: true,
      },
    });

    if (!row) {
      return {
        ok: false,
        code: "NOT_FOUND",
      };
    }

    const clienteResult = await getClienteById({ clienteId: row.clienteId });
    if (!clienteResult.ok) {
      return {
        ok: false,
        code: "SERVICE_UNAVAILABLE",
      };
    }

    const clienteNome = resolveClienteLabel(
      clienteResult.data.data.nome,
      clienteResult.data.data.ragioneSociale,
      clienteResult.data.data.codiceCliente,
    );
    const accessoriConsegnati = splitAccessoriConsegnati(row.accessoriConsegnati);

    const pdfBuffer = await buildRiparazioneRicevutaPdf({
      codiceRiparazione: row.codiceRiparazione,
      clienteNome,
      clienteTelefono: clienteResult.data.data.telefono?.trim() ?? "",
      clienteEmail: clienteResult.data.data.email?.trim() ?? "",
      dispositivoTipo: row.tipoDispositivo,
      dispositivoMarca: row.marcaDispositivo,
      dispositivoModello: row.modelloDispositivo,
      dispositivoSeriale: row.serialeDispositivo,
      descrizioneProblema: row.descrizioneProblema,
      accessoriConsegnati,
      dataRicezione: formatDateForLabel(row.dataRicezione.toISOString()),
      condizioniServizio: RICEVUTA_CONDIZIONI_SERVIZIO,
    });

    return {
      ok: true,
      data: {
        fileName: `ricevuta-riparazione-${row.id}.pdf`,
        content: pdfBuffer,
      },
    };
  } catch {
    return {
      ok: false,
      code: "SERVICE_UNAVAILABLE",
    };
  }
}

async function assegnaRiparazioneTecnicoInTestStore(
  payload: ParsedAssegnaRiparazioneTecnicoInput,
): Promise<AssegnaRiparazioneTecnicoResult> {
  const target = testRiparazioni.find((row) => row.id === payload.riparazioneId);
  if (!target) {
    return {
      ok: false,
      code: "NOT_FOUND",
    };
  }

  const targetRole = getUserRoleForTests(payload.tecnicoId);
  if (!targetRole) {
    return {
      ok: false,
      code: "USER_NOT_FOUND",
    };
  }

  if (targetRole !== "TECNICO") {
    return buildValidationFailure(
      {
        field: "tecnicoId",
        rule: "invalid_role",
      },
      "User must have TECNICO role",
    );
  }

  target.tecnicoId = payload.tecnicoId;
  return {
    ok: true,
    data: {
      id: target.id,
      tecnicoId: payload.tecnicoId,
    },
  };
}

async function assegnaRiparazioneTecnicoInDatabase(
  payload: ParsedAssegnaRiparazioneTecnicoInput,
): Promise<AssegnaRiparazioneTecnicoResult> {
  try {
    return await getPrismaClient().$transaction(
      async (tx: Prisma.TransactionClient) => {
        const targetRiparazione = await tx.riparazione.findUnique({
          where: { id: payload.riparazioneId },
          select: { id: true },
        });

        if (!targetRiparazione) {
          return {
            ok: false as const,
            code: "NOT_FOUND" as const,
          };
        }

        const targetUser = await tx.user.findUnique({
          where: { id: payload.tecnicoId },
          select: {
            id: true,
            role: true,
            isActive: true,
          },
        });

        if (!targetUser || !targetUser.isActive) {
          return {
            ok: false as const,
            code: "USER_NOT_FOUND" as const,
          };
        }

        if (targetUser.role !== "TECNICO") {
          return buildValidationFailure(
            {
              field: "tecnicoId",
              rule: "invalid_role",
            },
            "User must have TECNICO role",
          );
        }

        const updated = await tx.riparazione.update({
          where: { id: payload.riparazioneId },
          data: {
            tecnicoId: payload.tecnicoId,
          },
          select: {
            id: true,
            tecnicoId: true,
          },
        });

        return {
          ok: true as const,
          data: {
            id: updated.id,
            tecnicoId: updated.tecnicoId ?? payload.tecnicoId,
          },
        };
      },
    );
  } catch {
    return {
      ok: false,
      code: "SERVICE_UNAVAILABLE",
    };
  }
}

async function cambiaStatoRiparazioneInTestStore(
  payload: ParsedCambiaStatoRiparazioneInput,
): Promise<CambiaStatoRiparazioneResult> {
  const target = testRiparazioni.find((row) => row.id === payload.riparazioneId);
  if (!target) {
    return {
      ok: false,
      code: "NOT_FOUND",
    };
  }

  const isAdmin = payload.actorRole === "ADMIN";
  const isTecnico = payload.actorRole === "TECNICO";
  const isCancellationRequest = payload.stato === "ANNULLATA";
  if (isCancellationRequest && !isAdmin) {
    return {
      ok: false,
      code: "FORBIDDEN",
      message: "Only admins can cancel repairs",
    };
  }

  if (!isAdmin && !isTecnico) {
    return {
      ok: false,
      code: "FORBIDDEN",
    };
  }

  if (!isAdmin && target.tecnicoId !== payload.actorUserId) {
    return {
      ok: false,
      code: "FORBIDDEN",
    };
  }

  if (!(isAdmin && isCancellationRequest)) {
    const transitionFailure = validateBaseTransition(target.stato, payload.stato);
    if (transitionFailure) {
      return transitionFailure;
    }
  }

  target.stato = payload.stato;
  const historyTimestamp = new Date(Date.now() + target.statiHistory.length);
  target.statiHistory.push({
    stato: payload.stato,
    dataOra: historyTimestamp.toISOString(),
    userId: payload.actorUserId,
    note: payload.note ?? "",
  });

  const cliente = buildTestClientePayload(target.clienteId);
  const notifica = await createRiparazioneStatoNotifica({
    riparazioneId: target.id,
    codiceRiparazione: target.codiceRiparazione,
    statoRiparazione: target.stato,
    destinatario: cliente.email,
  });

  return {
    ok: true,
    data: {
      id: target.id,
      stato: target.stato,
      notifica,
    },
  };
}

async function cambiaStatoRiparazioneInDatabase(
  payload: ParsedCambiaStatoRiparazioneInput,
): Promise<CambiaStatoRiparazioneResult> {
  try {
    return await getPrismaClient().$transaction(
      async (tx: Prisma.TransactionClient) => {
        const targetRiparazione = await tx.riparazione.findUnique({
          where: { id: payload.riparazioneId },
          select: {
            id: true,
            stato: true,
            tecnicoId: true,
            codiceRiparazione: true,
            cliente: {
              select: {
                email: true,
              },
            },
          },
        });

        if (!targetRiparazione) {
          return {
            ok: false as const,
            code: "NOT_FOUND" as const,
          };
        }

        const isAdmin = payload.actorRole === "ADMIN";
        const isTecnico = payload.actorRole === "TECNICO";
        const isCancellationRequest = payload.stato === "ANNULLATA";
        if (isCancellationRequest && !isAdmin) {
          return {
            ok: false as const,
            code: "FORBIDDEN" as const,
            message: "Only admins can cancel repairs",
          };
        }

        if (!isAdmin && !isTecnico) {
          return {
            ok: false as const,
            code: "FORBIDDEN" as const,
          };
        }

        if (!isAdmin && targetRiparazione.tecnicoId !== payload.actorUserId) {
          return {
            ok: false as const,
            code: "FORBIDDEN" as const,
          };
        }

        if (!(isAdmin && isCancellationRequest)) {
          const transitionFailure = validateBaseTransition(
            targetRiparazione.stato,
            payload.stato,
          );
          if (transitionFailure) {
            return transitionFailure;
          }
        }

        const updated = await tx.riparazione.update({
          where: { id: payload.riparazioneId },
          data: {
            stato: payload.stato,
          },
          select: {
            id: true,
            stato: true,
          },
        });

        await tx.riparazioneStatoHistory.create({
          data: {
            riparazioneId: updated.id,
            stato: payload.stato,
            userId: payload.actorUserId,
            note: payload.note ?? "",
          },
        });

        const notifica = await createRiparazioneStatoNotifica({
          riparazioneId: updated.id,
          codiceRiparazione: targetRiparazione.codiceRiparazione,
          statoRiparazione: payload.stato,
          destinatario: targetRiparazione.cliente.email?.trim() ?? "",
        });

        return {
          ok: true as const,
          data: {
            id: updated.id,
            stato: updated.stato,
            notifica,
          },
        };
      },
    );
  } catch {
    return {
      ok: false,
      code: "SERVICE_UNAVAILABLE",
    };
  }
}

function normalizeInsufficientStockMessage(message: string, requested: number): string {
  const matched = message.match(/available\s+(\d+),\s*requested\s+(\d+)/i);
  if (!matched) {
    return `Insufficient stock for articolo: available 0, requested ${requested}`;
  }
  return `Insufficient stock for articolo: available ${matched[1]}, requested ${matched[2]}`;
}

async function createRiparazioneRicambioInTestStore(
  payload: ParsedCreateRiparazioneRicambioInput,
): Promise<CreateRiparazioneRicambioResult> {
  const target = testRiparazioni.find((row) => row.id === payload.riparazioneId);
  if (!target) {
    return {
      ok: false,
      code: "NOT_FOUND",
    };
  }

  const articoloResult = await getArticoloById({ articoloId: payload.articoloId });
  if (!articoloResult.ok) {
    if (articoloResult.code === "NOT_FOUND") {
      return { ok: false, code: "ARTICOLO_NOT_FOUND" };
    }
    return articoloResult;
  }

  const movementResult = await createArticoloMovimento({
    actorUserId: payload.actorUserId,
    articoloId: payload.articoloId,
    tipo: "SCARICO",
    quantita: payload.quantita,
    riferimento: `Riparazione ${target.codiceRiparazione}`,
  });
  if (!movementResult.ok) {
    if (movementResult.code === "NOT_FOUND") {
      return { ok: false, code: "ARTICOLO_NOT_FOUND" };
    }
    if (movementResult.code === "INSUFFICIENT_STOCK") {
      return {
        ok: false,
        code: "INSUFFICIENT_STOCK",
        message: normalizeInsufficientStockMessage(
          movementResult.message ?? "",
          payload.quantita,
        ),
      };
    }
    return movementResult;
  }

  const articolo = articoloResult.data.data;
  const nextId =
    target.ricambi.reduce((max, row) => Math.max(max, row.id), payload.riparazioneId * 1000) +
    1;
  target.ricambi.push({
    id: nextId,
    articolo: {
      id: articolo.id,
      nome: articolo.nome,
      codiceArticolo: articolo.codiceArticolo,
    },
    codiceArticolo: articolo.codiceArticolo,
    descrizione: articolo.nome,
    quantita: payload.quantita,
    prezzoUnitario: articolo.prezzoVendita,
  });

  return {
    ok: true,
    data: {
      id: nextId,
      articoloId: articolo.id,
      quantita: payload.quantita,
      prezzoUnitario: articolo.prezzoVendita,
    },
  };
}

async function createRiparazioneRicambioInDatabase(
  payload: ParsedCreateRiparazioneRicambioInput,
): Promise<CreateRiparazioneRicambioResult> {
  try {
    return await getPrismaClient().$transaction(async (tx: Prisma.TransactionClient) => {
      const riparazione = await tx.riparazione.findUnique({
        where: { id: payload.riparazioneId },
        select: { id: true, codiceRiparazione: true },
      });
      if (!riparazione) {
        return { ok: false as const, code: "NOT_FOUND" as const };
      }

      const transaction = tx as Prisma.TransactionClient & {
        articolo?: {
          findUnique: (args: unknown) => Promise<{
            id: number;
            codiceArticolo: string;
            nome: string;
            prezzoVendita: number;
            giacenza: number;
          } | null>;
          updateMany: (args: unknown) => Promise<{ count: number }>;
        };
      };

      if (!transaction.articolo) {
        return { ok: false as const, code: "SERVICE_UNAVAILABLE" as const };
      }

      const articolo = await transaction.articolo.findUnique({
        where: { id: payload.articoloId },
        select: {
          id: true,
          codiceArticolo: true,
          nome: true,
          prezzoVendita: true,
          giacenza: true,
        },
      });
      if (!articolo) {
        return { ok: false as const, code: "ARTICOLO_NOT_FOUND" as const };
      }

      const stockUpdate = await transaction.articolo.updateMany({
        where: {
          id: payload.articoloId,
          giacenza: { gte: payload.quantita },
        },
        data: {
          giacenza: { decrement: payload.quantita },
        },
      });
      if (stockUpdate.count === 0) {
        const latest = await transaction.articolo.findUnique({
          where: { id: payload.articoloId },
          select: { giacenza: true, id: true, codiceArticolo: true, nome: true, prezzoVendita: true },
        });
        return {
          ok: false as const,
          code: "INSUFFICIENT_STOCK" as const,
          message: `Insufficient stock for articolo: available ${latest?.giacenza ?? 0}, requested ${payload.quantita}`,
        };
      }

      await tx.auditLog.create({
        data: {
          userId: payload.actorUserId,
          action: "UPDATE",
          modelName: "Articolo",
          objectId: String(payload.articoloId),
          dettagli: {
            new: {
              movimento: {
                tipo: "SCARICO",
                quantita: payload.quantita,
                riferimento: `Riparazione ${riparazione.codiceRiparazione}`,
              },
            },
          },
        },
      });

      const created = await tx.riparazioneRicambio.create({
        data: {
          riparazioneId: payload.riparazioneId,
          codiceArticolo: articolo.codiceArticolo,
          descrizione: articolo.nome,
          quantita: payload.quantita,
          prezzoUnitario: articolo.prezzoVendita,
        },
        select: {
          id: true,
        },
      });

      return {
        ok: true as const,
        data: {
          id: created.id,
          articoloId: articolo.id,
          quantita: payload.quantita,
          prezzoUnitario: articolo.prezzoVendita,
        },
      };
    });
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

async function getRiparazioneDettaglio(
  input: GetRiparazioneDettaglioInput,
): Promise<GetRiparazioneDettaglioResult> {
  const parsed = parseGetRiparazioneDettaglioInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  if (process.env.NODE_ENV === "test") {
    return getRiparazioneDettaglioInTestStore(parsed.data);
  }

  return getRiparazioneDettaglioInDatabase(parsed.data);
}

// AC-1, AC-2, AC-3: Add service entrypoint for etichetta PDF.
async function getRiparazioneEtichettaPdf(
  input: GetRiparazioneEtichettaPdfInput,
): Promise<GetRiparazioneEtichettaPdfResult> {
  const parsed = parseGetRiparazioneEtichettaPdfInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  if (process.env.NODE_ENV === "test") {
    return getRiparazioneEtichettaPdfInTestStore(parsed.data);
  }

  return getRiparazioneEtichettaPdfInDatabase(parsed.data);
}

async function getRiparazioneRicevutaPdf(
  input: GetRiparazioneRicevutaPdfInput,
): Promise<GetRiparazioneRicevutaPdfResult> {
  const parsed = parseGetRiparazioneRicevutaPdfInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  if (process.env.NODE_ENV === "test") {
    return getRiparazioneRicevutaPdfInTestStore(parsed.data);
  }

  return getRiparazioneRicevutaPdfInDatabase(parsed.data);
}

async function assegnaRiparazioneTecnico(
  input: AssegnaRiparazioneTecnicoInput,
): Promise<AssegnaRiparazioneTecnicoResult> {
  const parsed = parseAssegnaRiparazioneTecnicoInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  if (process.env.NODE_ENV === "test") {
    return assegnaRiparazioneTecnicoInTestStore(parsed.data);
  }

  return assegnaRiparazioneTecnicoInDatabase(parsed.data);
}

async function cambiaStatoRiparazione(
  input: CambiaStatoRiparazioneInput,
): Promise<CambiaStatoRiparazioneResult> {
  const parsed = parseCambiaStatoRiparazioneInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  if (process.env.NODE_ENV === "test") {
    return cambiaStatoRiparazioneInTestStore(parsed.data);
  }

  return cambiaStatoRiparazioneInDatabase(parsed.data);
}

async function createRiparazioneRicambio(
  input: CreateRiparazioneRicambioInput,
): Promise<CreateRiparazioneRicambioResult> {
  const parsed = parseCreateRiparazioneRicambioInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  if (process.env.NODE_ENV === "test") {
    return createRiparazioneRicambioInTestStore(parsed.data);
  }

  return createRiparazioneRicambioInDatabase(parsed.data);
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
  resetNotificheStoreForTests();
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
  const historyTimestamp = new Date(Date.now() + target.statiHistory.length);
  target.statiHistory.push({
    stato,
    dataOra: historyTimestamp.toISOString(),
    userId: target.tecnicoId ?? 0,
    note: "",
  });
}

function riparazioneExistsForTests(riparazioneId: number): boolean {
  ensureTestEnvironment();
  return testRiparazioni.some((row) => row.id === riparazioneId);
}

export {
  assegnaRiparazioneTecnico,
  cambiaStatoRiparazione,
  createRiparazioneRicambio,
  createRiparazione,
  getRiparazioneDettaglio,
  getRiparazioneEtichettaPdf,
  getRiparazioneRicevutaPdf,
  listRiparazioni,
  resetRiparazioniStoreForTests,
  riparazioneExistsForTests,
  setRiparazioneStatoForTests,
  type AssegnaRiparazioneTecnicoInput,
  type AssegnaRiparazioneTecnicoResult,
  type CambiaStatoRiparazioneInput,
  type CambiaStatoRiparazioneResult,
  type CreateRiparazioneRicambioInput,
  type CreateRiparazioneRicambioResult,
  type CreateRiparazioneInput,
  type CreateRiparazioneResult,
  type GetRiparazioneDettaglioInput,
  type GetRiparazioneDettaglioResult,
  type GetRiparazioneEtichettaPdfInput,
  type GetRiparazioneEtichettaPdfResult,
  type GetRiparazioneRicevutaPdfInput,
  type GetRiparazioneRicevutaPdfResult,
  type ListRiparazioniInput,
  type ListRiparazioniResult,
};
