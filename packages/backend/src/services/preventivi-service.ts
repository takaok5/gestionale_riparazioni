import { PrismaClient, type Prisma } from "@prisma/client";
import { createPreventivoNotifica } from "./notifiche-service.js";
import { riparazioneExistsForTests } from "./riparazioni-service.js";

interface CreatePreventivoInput {
  riparazioneId: unknown;
  voci: unknown;
}

interface GetPreventivoDettaglioInput {
  preventivoId: unknown;
}

interface UpdatePreventivoInput {
  preventivoId: unknown;
  voci: unknown;
}

interface InviaPreventivoInput {
  preventivoId: unknown;
}

interface RegistraRispostaPreventivoInput {
  preventivoId: unknown;
  approvato: unknown;
}

interface PreventivoVocePayload {
  tipo: string;
  descrizione: string;
  articoloId?: number;
  quantita: number;
  prezzoUnitario: number;
}

interface PreventivoPayload {
  id: number;
  riparazioneId: number;
  numeroPreventivo: string;
  stato: string;
  dataInvio: string | null;
  dataRisposta: string | null;
  voci: PreventivoVocePayload[];
  subtotale: number;
  iva: number;
  totale: number;
}

interface ListPreventiviReportInput {
  dateFrom?: unknown;
  dateTo?: unknown;
}

interface PreventivoReportRow {
  id: number;
  stato: string;
  dataInvio: string | null;
  dataRisposta: string | null;
  totale: number;
}

interface SeedPreventivoReportInput {
  id?: number;
  riparazioneId?: number;
  stato: string;
  dataInvio?: string | null;
  dataRisposta?: string | null;
  totale: number;
}

interface ApprovedPreventivoForFattura {
  id: number;
  riparazioneId: number;
  voci: PreventivoVocePayload[];
  subtotale: number;
  iva: number;
  totale: number;
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

type RiparazioneNotFoundFailure = {
  ok: false;
  code: "RIPARAZIONE_NOT_FOUND";
};

type NotFoundFailure = {
  ok: false;
  code: "NOT_FOUND";
};

type ServiceUnavailableFailure = {
  ok: false;
  code: "SERVICE_UNAVAILABLE";
};

type ResponseAlreadyRecordedFailure = {
  ok: false;
  code: "RESPONSE_ALREADY_RECORDED";
};

type CreatePreventivoResult =
  | { ok: true; data: PreventivoPayload }
  | ValidationFailure
  | RiparazioneNotFoundFailure
  | ServiceUnavailableFailure;

type GetPreventivoDettaglioResult =
  | { ok: true; data: { data: PreventivoPayload } }
  | ValidationFailure
  | NotFoundFailure
  | ServiceUnavailableFailure;

type UpdatePreventivoResult =
  | { ok: true; data: PreventivoPayload }
  | ValidationFailure
  | NotFoundFailure
  | ServiceUnavailableFailure;

type EmailSendFailure = {
  ok: false;
  code: "EMAIL_SEND_FAILED";
  message: string;
};

interface InviaPreventivoSuccessPayload extends PreventivoPayload {
  riparazioneStato: string;
}

type InviaPreventivoResult =
  | { ok: true; data: InviaPreventivoSuccessPayload }
  | ValidationFailure
  | NotFoundFailure
  | EmailSendFailure
  | ServiceUnavailableFailure;

interface RegistraRispostaPreventivoSuccessPayload extends PreventivoPayload {
  riparazioneStato: string;
}

type RegistraRispostaPreventivoResult =
  | { ok: true; data: RegistraRispostaPreventivoSuccessPayload }
  | ValidationFailure
  | ResponseAlreadyRecordedFailure
  | NotFoundFailure
  | ServiceUnavailableFailure;

type ListPreventiviReportResult =
  | { ok: true; data: PreventivoReportRow[] }
  | ValidationFailure
  | ServiceUnavailableFailure;

interface ParsedCreatePreventivoInput {
  riparazioneId: number;
  voci: PreventivoVocePayload[];
}

interface ParsedGetPreventivoDettaglioInput {
  preventivoId: number;
}

interface ParsedUpdatePreventivoInput {
  preventivoId: number;
  voci: PreventivoVocePayload[];
}

interface ParsedInviaPreventivoInput {
  preventivoId: number;
}

interface ParsedRegistraRispostaPreventivoInput {
  preventivoId: number;
  approvato: boolean;
}

let prismaClient: PrismaClient | null = null;
let nextTestPreventivoId = 22;
let testPreventivi: PreventivoPayload[] = [];
const testClienteEmailByRiparazioneId = new Map<number, string | null>();
const testRiparazioneStatoById = new Map<number, string>();
const testEmailFailureByPreventivoId = new Map<number, boolean>();

function getPrismaClient(): PrismaClient {
  if (prismaClient) {
    return prismaClient;
  }

  prismaClient = new PrismaClient();
  return prismaClient;
}

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

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed;
}

function asPositiveNumber(value: unknown): number | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) {
      return null;
    }

    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
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

function toIsoDateOnly(value: string | null): string | null {
  if (!value) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString().slice(0, 10);
}

function parseListPreventiviReportInput(
  input: ListPreventiviReportInput,
): { ok: true; data: { dateFrom?: string; dateTo?: string } } | ValidationFailure {
  let dateFrom: string | undefined;
  if (input.dateFrom !== undefined && input.dateFrom !== null && input.dateFrom !== "") {
    const parsed = asIsoDate(input.dateFrom);
    if (!parsed) {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        details: { field: "dateFrom", rule: "YYYY-MM-DD" },
      };
    }
    dateFrom = parsed;
  }

  let dateTo: string | undefined;
  if (input.dateTo !== undefined && input.dateTo !== null && input.dateTo !== "") {
    const parsed = asIsoDate(input.dateTo);
    if (!parsed) {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        details: { field: "dateTo", rule: "YYYY-MM-DD" },
      };
    }
    dateTo = parsed;
  }

  if (dateFrom && dateTo && dateFrom > dateTo) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      details: { field: "dateFrom", rule: "lte_dateTo" },
    };
  }

  return { ok: true, data: { dateFrom, dateTo } };
}

function listPreventiviReportInTestStore(input: {
  dateFrom?: string;
  dateTo?: string;
}): ListPreventiviReportResult {
  const rows = testPreventivi
    .map((row) => {
      const referenceDate = toIsoDateOnly(row.dataRisposta ?? row.dataInvio);
      return {
        id: row.id,
        stato: row.stato,
        dataInvio: row.dataInvio,
        dataRisposta: row.dataRisposta,
        totale: row.totale,
        referenceDate,
      };
    })
    .filter((row) => {
      if (!row.referenceDate) {
        return false;
      }
      if (input.dateFrom && row.referenceDate < input.dateFrom) {
        return false;
      }
      if (input.dateTo && row.referenceDate > input.dateTo) {
        return false;
      }
      return true;
    })
    .map((row) => ({
      id: row.id,
      stato: row.stato,
      dataInvio: row.dataInvio,
      dataRisposta: row.dataRisposta,
      totale: row.totale,
    }));

  return { ok: true, data: rows };
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function computeTotals(voci: PreventivoVocePayload[]): {
  subtotale: number;
  iva: number;
  totale: number;
} {
  const subtotale = roundCurrency(
    voci.reduce(
      (sum, voce) => sum + voce.quantita * voce.prezzoUnitario,
      0,
    ),
  );
  const iva = roundCurrency(subtotale * 0.22);
  const totale = roundCurrency(subtotale + iva);
  return { subtotale, iva, totale };
}

function buildValidationFailure(
  field: string,
  rule: string,
  message?: string,
): ValidationFailure {
  return {
    ok: false,
    code: "VALIDATION_ERROR",
    details: { field, rule },
    ...(message ? { message } : {}),
  };
}

function parseVociPayload(input: unknown): { ok: true; data: PreventivoVocePayload[] } | ValidationFailure {
  if (!Array.isArray(input) || input.length === 0) {
    return buildValidationFailure("voci", "required");
  }

  const parsedVoci: PreventivoVocePayload[] = [];
  for (const voce of input) {
    if (typeof voce !== "object" || voce === null) {
      return buildValidationFailure("voci", "invalid_type");
    }

    const tipo = asNonEmptyString((voce as Record<string, unknown>).tipo);
    if (!tipo) {
      return buildValidationFailure("tipo", "required");
    }

    const descrizione = asNonEmptyString(
      (voce as Record<string, unknown>).descrizione,
    );
    if (!descrizione) {
      return buildValidationFailure(
        "descrizione",
        "required",
        "descrizione is required for each voce",
      );
    }

    const quantita = asPositiveInteger((voce as Record<string, unknown>).quantita);
    if (quantita === null) {
      return buildValidationFailure("quantita", "required");
    }

    const prezzoUnitario = asPositiveNumber(
      (voce as Record<string, unknown>).prezzoUnitario,
    );
    if (prezzoUnitario === null) {
      return buildValidationFailure("prezzoUnitario", "required");
    }

    const articoloIdRaw = (voce as Record<string, unknown>).articoloId;
    const articoloId =
      articoloIdRaw === undefined ? undefined : asPositiveInteger(articoloIdRaw);
    if (articoloIdRaw !== undefined && articoloId === null) {
      return buildValidationFailure("articoloId", "invalid_type");
    }

    parsedVoci.push({
      tipo,
      descrizione,
      ...(articoloId ? { articoloId } : {}),
      quantita,
      prezzoUnitario: roundCurrency(prezzoUnitario),
    });
  }

  return {
    ok: true,
    data: parsedVoci,
  };
}

function parseCreatePreventivoInput(
  input: CreatePreventivoInput,
): { ok: true; data: ParsedCreatePreventivoInput } | ValidationFailure {
  const riparazioneId = asPositiveInteger(input.riparazioneId);
  if (riparazioneId === null) {
    return buildValidationFailure("riparazioneId", "required");
  }

  const parsedVoci = parseVociPayload(input.voci);
  if (!parsedVoci.ok) {
    return parsedVoci;
  }

  return {
    ok: true,
    data: {
      riparazioneId,
      voci: parsedVoci.data,
    },
  };
}

function parseGetPreventivoDettaglioInput(
  input: GetPreventivoDettaglioInput,
): { ok: true; data: ParsedGetPreventivoDettaglioInput } | ValidationFailure {
  const preventivoId = asPositiveInteger(input.preventivoId);
  if (preventivoId === null) {
    return buildValidationFailure("id", "required");
  }

  return {
    ok: true,
    data: { preventivoId },
  };
}

function parseUpdatePreventivoInput(
  input: UpdatePreventivoInput,
): { ok: true; data: ParsedUpdatePreventivoInput } | ValidationFailure {
  const preventivoId = asPositiveInteger(input.preventivoId);
  if (preventivoId === null) {
    return buildValidationFailure("id", "required");
  }

  const parsedVoci = parseVociPayload(input.voci);
  if (!parsedVoci.ok) {
    return parsedVoci;
  }

  return {
    ok: true,
    data: {
      preventivoId,
      voci: parsedVoci.data,
    },
  };
}

function parseInviaPreventivoInput(
  input: InviaPreventivoInput,
): { ok: true; data: ParsedInviaPreventivoInput } | ValidationFailure {
  const preventivoId = asPositiveInteger(input.preventivoId);
  if (preventivoId === null) {
    return buildValidationFailure("id", "required");
  }

  return {
    ok: true,
    data: { preventivoId },
  };
}

function parseRegistraRispostaPreventivoInput(
  input: RegistraRispostaPreventivoInput,
): { ok: true; data: ParsedRegistraRispostaPreventivoInput } | ValidationFailure {
  const preventivoId = asPositiveInteger(input.preventivoId);
  if (preventivoId === null) {
    return buildValidationFailure("id", "required");
  }

  if (typeof input.approvato !== "boolean") {
    return buildValidationFailure("approvato", "required");
  }

  return {
    ok: true,
    data: {
      preventivoId,
      approvato: input.approvato,
    },
  };
}

function toNumeroPreventivo(id: number): string {
  const padded = String(id).padStart(6, "0");
  return `PREV-${padded}`;
}

async function createPreventivoInTestStore(
  payload: ParsedCreatePreventivoInput,
): Promise<CreatePreventivoResult> {
  if (!riparazioneExistsForTests(payload.riparazioneId)) {
    return {
      ok: false,
      code: "RIPARAZIONE_NOT_FOUND",
    };
  }

  const totals = computeTotals(payload.voci);
  const created: PreventivoPayload = {
    id: nextTestPreventivoId,
    riparazioneId: payload.riparazioneId,
    numeroPreventivo: toNumeroPreventivo(nextTestPreventivoId),
    stato: "BOZZA",
    dataInvio: null,
    dataRisposta: null,
    voci: payload.voci.map((voce) => ({ ...voce })),
    subtotale: totals.subtotale,
    iva: totals.iva,
    totale: totals.totale,
  };

  nextTestPreventivoId += 1;
  testPreventivi.push(created);

  return {
    ok: true,
    data: created,
  };
}

async function getPreventivoDettaglioInTestStore(
  payload: ParsedGetPreventivoDettaglioInput,
): Promise<GetPreventivoDettaglioResult> {
  const target = testPreventivi.find((row) => row.id === payload.preventivoId);
  if (!target) {
    return {
      ok: false,
      code: "NOT_FOUND",
    };
  }

  return {
    ok: true,
    data: {
      data: {
        ...target,
        voci: target.voci.map((voce) => ({ ...voce })),
      },
    },
  };
}

async function createPreventivoInDatabase(
  payload: ParsedCreatePreventivoInput,
): Promise<CreatePreventivoResult> {
  try {
    return await getPrismaClient().$transaction(
      async (tx: Prisma.TransactionClient) => {
        const riparazione = await tx.riparazione.findUnique({
          where: { id: payload.riparazioneId },
          select: { id: true },
        });
        if (!riparazione) {
          return {
            ok: false as const,
            code: "RIPARAZIONE_NOT_FOUND" as const,
          };
        }

        const totals = computeTotals(payload.voci);
        const temporaryNumeroPreventivo = `PENDING-${Date.now()}-${Math.floor(
          Math.random() * 10000,
        )}`;
        const created = await tx.riparazionePreventivo.create({
          data: {
            riparazioneId: payload.riparazioneId,
            numeroPreventivo: temporaryNumeroPreventivo,
            stato: "BOZZA",
            dataInvio: null,
            dataRisposta: null,
            subtotale: totals.subtotale,
            iva: totals.iva,
            totale: totals.totale,
            voci: {
              create: payload.voci.map((voce) => ({
                tipo: voce.tipo,
                descrizione: voce.descrizione,
                articoloId: voce.articoloId,
                quantita: voce.quantita,
                prezzoUnitario: voce.prezzoUnitario,
              })),
            },
          },
          select: {
            id: true,
            riparazioneId: true,
            numeroPreventivo: true,
            stato: true,
            dataInvio: true,
            dataRisposta: true,
            subtotale: true,
            iva: true,
            totale: true,
            voci: {
              orderBy: { id: "asc" },
              select: {
                tipo: true,
                descrizione: true,
                articoloId: true,
                quantita: true,
                prezzoUnitario: true,
              },
            },
          },
        });

        const numbered = await tx.riparazionePreventivo.update({
          where: { id: created.id },
          data: {
            numeroPreventivo: toNumeroPreventivo(created.id),
          },
          select: {
            id: true,
            riparazioneId: true,
            numeroPreventivo: true,
            stato: true,
            dataInvio: true,
            dataRisposta: true,
            subtotale: true,
            iva: true,
            totale: true,
            voci: {
              orderBy: { id: "asc" },
              select: {
                tipo: true,
                descrizione: true,
                articoloId: true,
                quantita: true,
                prezzoUnitario: true,
              },
            },
          },
        });

        return {
          ok: true as const,
          data: {
            id: numbered.id,
            riparazioneId: numbered.riparazioneId,
            numeroPreventivo: numbered.numeroPreventivo,
            stato: numbered.stato,
            dataInvio: numbered.dataInvio
              ? numbered.dataInvio.toISOString()
              : null,
            dataRisposta: numbered.dataRisposta
              ? numbered.dataRisposta.toISOString()
              : null,
            voci: numbered.voci.map((voce) => ({
              tipo: voce.tipo,
              descrizione: voce.descrizione,
              ...(voce.articoloId ? { articoloId: voce.articoloId } : {}),
              quantita: voce.quantita,
              prezzoUnitario: voce.prezzoUnitario,
            })),
            subtotale: numbered.subtotale ?? totals.subtotale,
            iva: numbered.iva ?? totals.iva,
            totale: numbered.totale,
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

async function getPreventivoDettaglioInDatabase(
  payload: ParsedGetPreventivoDettaglioInput,
): Promise<GetPreventivoDettaglioResult> {
  try {
    const row = await getPrismaClient().riparazionePreventivo.findUnique({
      where: { id: payload.preventivoId },
      select: {
        id: true,
        riparazioneId: true,
        numeroPreventivo: true,
        stato: true,
        dataInvio: true,
        dataRisposta: true,
        subtotale: true,
        iva: true,
        totale: true,
        voci: {
          orderBy: { id: "asc" },
          select: {
            tipo: true,
            descrizione: true,
            articoloId: true,
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

    const subtotale =
      row.subtotale !== null ? row.subtotale : roundCurrency(row.totale / 1.22);
    const iva = row.iva !== null ? row.iva : roundCurrency(row.totale - subtotale);

    return {
      ok: true,
      data: {
        data: {
          id: row.id,
          riparazioneId: row.riparazioneId,
          numeroPreventivo: row.numeroPreventivo,
          stato: row.stato,
          dataInvio: row.dataInvio ? row.dataInvio.toISOString() : null,
          dataRisposta: row.dataRisposta ? row.dataRisposta.toISOString() : null,
          voci: row.voci.map((voce) => ({
            tipo: voce.tipo,
            descrizione: voce.descrizione,
            ...(voce.articoloId ? { articoloId: voce.articoloId } : {}),
            quantita: voce.quantita,
            prezzoUnitario: voce.prezzoUnitario,
          })),
          subtotale,
          iva,
          totale: row.totale,
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

async function updatePreventivoInTestStore(
  payload: ParsedUpdatePreventivoInput,
): Promise<UpdatePreventivoResult> {
  const target = testPreventivi.find((row) => row.id === payload.preventivoId);
  if (!target) {
    return {
      ok: false,
      code: "NOT_FOUND",
    };
  }

  if (target.stato !== "BOZZA") {
    return buildValidationFailure(
      "stato",
      "immutable",
      `Cannot edit preventivo with stato ${target.stato}`,
    );
  }

  const totals = computeTotals(payload.voci);
  target.voci = payload.voci.map((voce) => ({ ...voce }));
  target.subtotale = totals.subtotale;
  target.iva = totals.iva;
  target.totale = totals.totale;

  return {
    ok: true,
    data: {
      ...target,
      voci: target.voci.map((voce) => ({ ...voce })),
    },
  };
}

async function updatePreventivoInDatabase(
  payload: ParsedUpdatePreventivoInput,
): Promise<UpdatePreventivoResult> {
  try {
    return await getPrismaClient().$transaction(
      async (tx: Prisma.TransactionClient) => {
        const existing = await tx.riparazionePreventivo.findUnique({
          where: { id: payload.preventivoId },
          select: { id: true, stato: true, riparazioneId: true },
        });

        if (!existing) {
          return {
            ok: false as const,
            code: "NOT_FOUND" as const,
          };
        }

        if (existing.stato !== "BOZZA") {
          return buildValidationFailure(
            "stato",
            "immutable",
            `Cannot edit preventivo with stato ${existing.stato}`,
          );
        }

        const totals = computeTotals(payload.voci);
        const updated = await tx.riparazionePreventivo.update({
          where: { id: payload.preventivoId },
          data: {
            subtotale: totals.subtotale,
            iva: totals.iva,
            totale: totals.totale,
            voci: {
              deleteMany: {},
              create: payload.voci.map((voce) => ({
                tipo: voce.tipo,
                descrizione: voce.descrizione,
                articoloId: voce.articoloId,
                quantita: voce.quantita,
                prezzoUnitario: voce.prezzoUnitario,
              })),
            },
          },
          select: {
            id: true,
            riparazioneId: true,
            numeroPreventivo: true,
            stato: true,
            dataInvio: true,
            dataRisposta: true,
            subtotale: true,
            iva: true,
            totale: true,
            voci: {
              orderBy: { id: "asc" },
              select: {
                tipo: true,
                descrizione: true,
                articoloId: true,
                quantita: true,
                prezzoUnitario: true,
              },
            },
          },
        });

        return {
          ok: true as const,
          data: {
            id: updated.id,
            riparazioneId: updated.riparazioneId,
            numeroPreventivo: updated.numeroPreventivo,
            stato: updated.stato,
            dataInvio: updated.dataInvio
              ? updated.dataInvio.toISOString()
              : null,
            dataRisposta: updated.dataRisposta
              ? updated.dataRisposta.toISOString()
              : null,
            voci: updated.voci.map((voce) => ({
              tipo: voce.tipo,
              descrizione: voce.descrizione,
              ...(voce.articoloId ? { articoloId: voce.articoloId } : {}),
              quantita: voce.quantita,
              prezzoUnitario: voce.prezzoUnitario,
            })),
            subtotale: updated.subtotale ?? totals.subtotale,
            iva: updated.iva ?? totals.iva,
            totale: updated.totale,
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

function getTestClienteEmail(riparazioneId: number): string | null {
  const email = testClienteEmailByRiparazioneId.get(riparazioneId);
  if (email !== undefined) {
    return email;
  }

  if (riparazioneId === 10) {
    return "cliente@test.it";
  }

  return `cliente${riparazioneId}@test.local`;
}

function getTestRiparazioneStato(riparazioneId: number): string {
  const stato = testRiparazioneStatoById.get(riparazioneId);
  if (stato) {
    return stato;
  }

  if (riparazioneId === 10) {
    return "PREVENTIVO_EMESSO";
  }

  return "IN_DIAGNOSI";
}

function shouldFailTestEmail(preventivoId: number): boolean {
  return testEmailFailureByPreventivoId.get(preventivoId) === true;
}

function generatePreventivoPdfDocument(preventivoId: number): string {
  return `preventivo-${preventivoId}.pdf`;
}

function createPreventivoAttachmentPath(preventivoId: number): string {
  return `/generated/preventivi/${generatePreventivoPdfDocument(preventivoId)}`;
}

function getTestCodiceRiparazione(riparazioneId: number): string {
  if (riparazioneId === 10) {
    return "RIP-20260209-0001";
  }
  return `RIP-${String(riparazioneId).padStart(10, "0")}`;
}

async function sendPreventivoEmail(input: {
  preventivoId: number;
  to: string;
  pdfDocument: string;
}): Promise<void> {
  if (process.env.NODE_ENV === "test" && shouldFailTestEmail(input.preventivoId)) {
    throw new Error("EMAIL_SEND_FAILED");
  }

  void input.to;
  void input.pdfDocument;
}

async function inviaPreventivoInTestStore(
  payload: ParsedInviaPreventivoInput,
): Promise<InviaPreventivoResult> {
  const target = testPreventivi.find((row) => row.id === payload.preventivoId);
  if (!target) {
    return {
      ok: false,
      code: "NOT_FOUND",
    };
  }

  if (target.stato === "INVIATO") {
    return buildValidationFailure(
      "stato",
      "immutable",
      "Preventivo already sent",
    );
  }

  const customerEmail = getTestClienteEmail(target.riparazioneId);
  if (!customerEmail) {
    return buildValidationFailure(
      "cliente.email",
      "required",
      "Customer email is required to send quotation",
    );
  }

  const riparazioneStato = getTestRiparazioneStato(target.riparazioneId);
  if (riparazioneStato !== "PREVENTIVO_EMESSO") {
    return buildValidationFailure(
      "riparazione.stato",
      "invalid_transition",
      "Riparazione must be PREVENTIVO_EMESSO before sending quotation",
    );
  }

  try {
    const pdfDocument = generatePreventivoPdfDocument(target.id);
    await sendPreventivoEmail({
      preventivoId: target.id,
      to: customerEmail,
      pdfDocument,
    });
  } catch {
    await createPreventivoNotifica({
      preventivoId: target.id,
      codiceRiparazione: getTestCodiceRiparazione(target.riparazioneId),
      destinatario: customerEmail,
      voci: target.voci.map((voce) => ({
        tipo: voce.tipo,
        descrizione: voce.descrizione,
        quantita: voce.quantita,
        prezzoUnitario: voce.prezzoUnitario,
      })),
      subtotale: target.subtotale,
      iva: target.iva,
      totale: target.totale,
      allegatoPath: createPreventivoAttachmentPath(target.id),
      stato: "FALLITA",
    });
    return {
      ok: false,
      code: "EMAIL_SEND_FAILED",
      message: "Failed to send email",
    };
  }

  const sentAt = new Date().toISOString();
  target.stato = "INVIATO";
  target.dataInvio = sentAt;
  target.dataRisposta = null;
  testRiparazioneStatoById.set(target.riparazioneId, "IN_ATTESA_APPROVAZIONE");
  await createPreventivoNotifica({
    preventivoId: target.id,
    codiceRiparazione: getTestCodiceRiparazione(target.riparazioneId),
    destinatario: customerEmail,
    voci: target.voci.map((voce) => ({
      tipo: voce.tipo,
      descrizione: voce.descrizione,
      quantita: voce.quantita,
      prezzoUnitario: voce.prezzoUnitario,
    })),
    subtotale: target.subtotale,
    iva: target.iva,
    totale: target.totale,
    allegatoPath: createPreventivoAttachmentPath(target.id),
    stato: "INVIATA",
  });

  return {
    ok: true,
    data: {
      ...target,
      voci: target.voci.map((voce) => ({ ...voce })),
      riparazioneStato: "IN_ATTESA_APPROVAZIONE",
    },
  };
}

async function inviaPreventivoInDatabase(
  payload: ParsedInviaPreventivoInput,
): Promise<InviaPreventivoResult> {
  try {
    return await getPrismaClient().$transaction(
      async (tx: Prisma.TransactionClient) => {
        const row = await tx.riparazionePreventivo.findUnique({
          where: { id: payload.preventivoId },
          select: {
            id: true,
            riparazioneId: true,
            numeroPreventivo: true,
            stato: true,
            dataInvio: true,
            dataRisposta: true,
            subtotale: true,
            iva: true,
            totale: true,
            voci: {
              orderBy: { id: "asc" },
              select: {
                tipo: true,
                descrizione: true,
                articoloId: true,
                quantita: true,
                prezzoUnitario: true,
              },
            },
            riparazione: {
              select: {
                id: true,
                stato: true,
                cliente: {
                  select: {
                    email: true,
                  },
                },
              },
            },
          },
        });

        if (!row) {
          return {
            ok: false as const,
            code: "NOT_FOUND" as const,
          };
        }

        if (row.stato === "INVIATO") {
          return buildValidationFailure(
            "stato",
            "immutable",
            "Preventivo already sent",
          );
        }

        const customerEmail = row.riparazione.cliente.email?.trim() ?? "";
        if (!customerEmail) {
          return buildValidationFailure(
            "cliente.email",
            "required",
            "Customer email is required to send quotation",
          );
        }

        if (row.riparazione.stato !== "PREVENTIVO_EMESSO") {
          return buildValidationFailure(
            "riparazione.stato",
            "invalid_transition",
            "Riparazione must be PREVENTIVO_EMESSO before sending quotation",
          );
        }

        try {
          const pdfDocument = generatePreventivoPdfDocument(row.id);
          await sendPreventivoEmail({
            preventivoId: row.id,
            to: customerEmail,
            pdfDocument,
          });
        } catch {
          return {
            ok: false as const,
            code: "EMAIL_SEND_FAILED" as const,
            message: "Failed to send email",
          };
        }

        const sentAt = new Date();
        const updatedPreventivo = await tx.riparazionePreventivo.update({
          where: { id: row.id },
          data: {
            stato: "INVIATO",
            dataInvio: sentAt,
            dataRisposta: null,
          },
          select: {
            id: true,
            riparazioneId: true,
            numeroPreventivo: true,
            stato: true,
            dataInvio: true,
            dataRisposta: true,
            subtotale: true,
            iva: true,
            totale: true,
            voci: {
              orderBy: { id: "asc" },
              select: {
                tipo: true,
                descrizione: true,
                articoloId: true,
                quantita: true,
                prezzoUnitario: true,
              },
            },
          },
        });

        const updatedRiparazione = await tx.riparazione.update({
          where: { id: row.riparazioneId },
          data: {
            stato: "IN_ATTESA_APPROVAZIONE",
          },
          select: {
            stato: true,
          },
        });

        return {
          ok: true as const,
          data: {
            id: updatedPreventivo.id,
            riparazioneId: updatedPreventivo.riparazioneId,
            numeroPreventivo: updatedPreventivo.numeroPreventivo,
            stato: updatedPreventivo.stato,
            dataInvio: updatedPreventivo.dataInvio
              ? updatedPreventivo.dataInvio.toISOString()
              : null,
            dataRisposta: updatedPreventivo.dataRisposta
              ? updatedPreventivo.dataRisposta.toISOString()
              : null,
            voci: updatedPreventivo.voci.map((voce) => ({
              tipo: voce.tipo,
              descrizione: voce.descrizione,
              ...(voce.articoloId ? { articoloId: voce.articoloId } : {}),
              quantita: voce.quantita,
              prezzoUnitario: voce.prezzoUnitario,
            })),
            subtotale:
              updatedPreventivo.subtotale !== null
                ? updatedPreventivo.subtotale
                : roundCurrency(updatedPreventivo.totale / 1.22),
            iva:
              updatedPreventivo.iva !== null
                ? updatedPreventivo.iva
                : roundCurrency(
                    updatedPreventivo.totale -
                      roundCurrency(updatedPreventivo.totale / 1.22),
                  ),
            totale: updatedPreventivo.totale,
            riparazioneStato: updatedRiparazione.stato,
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

async function registraRispostaPreventivoInTestStore(
  payload: ParsedRegistraRispostaPreventivoInput,
): Promise<RegistraRispostaPreventivoResult> {
  const target = testPreventivi.find((row) => row.id === payload.preventivoId);
  if (!target) {
    return {
      ok: false,
      code: "NOT_FOUND",
    };
  }

  if (target.stato === "APPROVATO" || target.stato === "RIFIUTATO") {
    return {
      ok: false,
      code: "RESPONSE_ALREADY_RECORDED",
    };
  }

  if (target.stato !== "INVIATO") {
    return buildValidationFailure(
      "stato",
      "invalid_transition",
      "Preventivo must be in INVIATO state to record response",
    );
  }

  const responseAt = new Date().toISOString();
  const nextPreventivoStato = payload.approvato ? "APPROVATO" : "RIFIUTATO";
  const nextRiparazioneStato = payload.approvato ? "APPROVATA" : "ANNULLATA";

  target.stato = nextPreventivoStato;
  target.dataRisposta = responseAt;
  testRiparazioneStatoById.set(target.riparazioneId, nextRiparazioneStato);

  return {
    ok: true,
    data: {
      ...target,
      voci: target.voci.map((voce) => ({ ...voce })),
      riparazioneStato: nextRiparazioneStato,
    },
  };
}

async function registraRispostaPreventivoInDatabase(
  payload: ParsedRegistraRispostaPreventivoInput,
): Promise<RegistraRispostaPreventivoResult> {
  try {
    return await getPrismaClient().$transaction(
      async (tx: Prisma.TransactionClient) => {
        const row = await tx.riparazionePreventivo.findUnique({
          where: { id: payload.preventivoId },
          select: {
            id: true,
            riparazioneId: true,
            numeroPreventivo: true,
            stato: true,
            dataInvio: true,
            dataRisposta: true,
            subtotale: true,
            iva: true,
            totale: true,
            voci: {
              orderBy: { id: "asc" },
              select: {
                tipo: true,
                descrizione: true,
                articoloId: true,
                quantita: true,
                prezzoUnitario: true,
              },
            },
          },
        });

        if (!row) {
          return {
            ok: false as const,
            code: "NOT_FOUND" as const,
          };
        }

        if (row.stato === "APPROVATO" || row.stato === "RIFIUTATO") {
          return {
            ok: false as const,
            code: "RESPONSE_ALREADY_RECORDED" as const,
          };
        }

        if (row.stato !== "INVIATO") {
          return buildValidationFailure(
            "stato",
            "invalid_transition",
            "Preventivo must be in INVIATO state to record response",
          );
        }

        const responseAt = new Date();
        const nextPreventivoStato = payload.approvato ? "APPROVATO" : "RIFIUTATO";
        const nextRiparazioneStato = payload.approvato ? "APPROVATA" : "ANNULLATA";

        const updatedPreventivo = await tx.riparazionePreventivo.update({
          where: { id: row.id },
          data: {
            stato: nextPreventivoStato,
            dataRisposta: responseAt,
          },
          select: {
            id: true,
            riparazioneId: true,
            numeroPreventivo: true,
            stato: true,
            dataInvio: true,
            dataRisposta: true,
            subtotale: true,
            iva: true,
            totale: true,
            voci: {
              orderBy: { id: "asc" },
              select: {
                tipo: true,
                descrizione: true,
                articoloId: true,
                quantita: true,
                prezzoUnitario: true,
              },
            },
          },
        });

        const updatedRiparazione = await tx.riparazione.update({
          where: { id: row.riparazioneId },
          data: {
            stato: nextRiparazioneStato,
          },
          select: {
            stato: true,
          },
        });

        return {
          ok: true as const,
          data: {
            id: updatedPreventivo.id,
            riparazioneId: updatedPreventivo.riparazioneId,
            numeroPreventivo: updatedPreventivo.numeroPreventivo,
            stato: updatedPreventivo.stato,
            dataInvio: updatedPreventivo.dataInvio
              ? updatedPreventivo.dataInvio.toISOString()
              : null,
            dataRisposta: updatedPreventivo.dataRisposta
              ? updatedPreventivo.dataRisposta.toISOString()
              : null,
            voci: updatedPreventivo.voci.map((voce) => ({
              tipo: voce.tipo,
              descrizione: voce.descrizione,
              ...(voce.articoloId ? { articoloId: voce.articoloId } : {}),
              quantita: voce.quantita,
              prezzoUnitario: voce.prezzoUnitario,
            })),
            subtotale:
              updatedPreventivo.subtotale !== null
                ? updatedPreventivo.subtotale
                : roundCurrency(updatedPreventivo.totale / 1.22),
            iva:
              updatedPreventivo.iva !== null
                ? updatedPreventivo.iva
                : roundCurrency(
                    updatedPreventivo.totale -
                      roundCurrency(updatedPreventivo.totale / 1.22),
                  ),
            totale: updatedPreventivo.totale,
            riparazioneStato: updatedRiparazione.stato,
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

async function createPreventivo(
  input: CreatePreventivoInput,
): Promise<CreatePreventivoResult> {
  const parsed = parseCreatePreventivoInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  if (process.env.NODE_ENV === "test") {
    return createPreventivoInTestStore(parsed.data);
  }

  return createPreventivoInDatabase(parsed.data);
}

async function getPreventivoDettaglio(
  input: GetPreventivoDettaglioInput,
): Promise<GetPreventivoDettaglioResult> {
  const parsed = parseGetPreventivoDettaglioInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  if (process.env.NODE_ENV === "test") {
    return getPreventivoDettaglioInTestStore(parsed.data);
  }

  return getPreventivoDettaglioInDatabase(parsed.data);
}

async function updatePreventivo(
  input: UpdatePreventivoInput,
): Promise<UpdatePreventivoResult> {
  const parsed = parseUpdatePreventivoInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  if (process.env.NODE_ENV === "test") {
    return updatePreventivoInTestStore(parsed.data);
  }

  return updatePreventivoInDatabase(parsed.data);
}

async function inviaPreventivo(
  input: InviaPreventivoInput,
): Promise<InviaPreventivoResult> {
  const parsed = parseInviaPreventivoInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  if (process.env.NODE_ENV === "test") {
    return inviaPreventivoInTestStore(parsed.data);
  }

  return inviaPreventivoInDatabase(parsed.data);
}

async function registraRispostaPreventivo(
  input: RegistraRispostaPreventivoInput,
): Promise<RegistraRispostaPreventivoResult> {
  const parsed = parseRegistraRispostaPreventivoInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  if (process.env.NODE_ENV === "test") {
    return registraRispostaPreventivoInTestStore(parsed.data);
  }

  return registraRispostaPreventivoInDatabase(parsed.data);
}

async function listPreventiviReport(
  input: ListPreventiviReportInput,
): Promise<ListPreventiviReportResult> {
  const parsed = parseListPreventiviReportInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  if (process.env.NODE_ENV === "test") {
    return listPreventiviReportInTestStore(parsed.data);
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

function seedDefaultTestPreventivi(): PreventivoPayload[] {
  return [
    {
      id: 5,
      riparazioneId: 10,
      numeroPreventivo: "PREV-000005",
      stato: "BOZZA",
      dataInvio: null,
      dataRisposta: null,
      voci: [
        {
          tipo: "MANODOPERA",
          descrizione: "Diagnosi iniziale",
          quantita: 2,
          prezzoUnitario: 90,
        },
        {
          tipo: "RICAMBIO",
          descrizione: "Display compatibile",
          quantita: 1,
          prezzoUnitario: 20,
        },
      ],
      subtotale: 200,
      iva: 44,
      totale: 244,
    },
    {
      id: 21,
      riparazioneId: 10,
      numeroPreventivo: "PREV-000021",
      stato: "BOZZA",
      dataInvio: null,
      dataRisposta: null,
      voci: [
        {
          tipo: "MANODOPERA",
          descrizione: "Diagnosi avanzata",
          quantita: 1,
          prezzoUnitario: 50,
        },
        {
          tipo: "RICAMBIO",
          descrizione: "Display LCD",
          articoloId: 5,
          quantita: 1,
          prezzoUnitario: 120,
        },
        {
          tipo: "RICAMBIO",
          descrizione: "Batteria",
          articoloId: 8,
          quantita: 1,
          prezzoUnitario: 90,
        },
      ],
      subtotale: 260,
      iva: 57.2,
      totale: 317.2,
    },
  ];
}

function resetPreventiviStoreForTests(): void {
  ensureTestEnvironment();
  testPreventivi = seedDefaultTestPreventivi();
  nextTestPreventivoId = 22;
  testClienteEmailByRiparazioneId.clear();
  testRiparazioneStatoById.clear();
  testEmailFailureByPreventivoId.clear();
}

function setPreventivoStatoForTests(preventivoId: number, stato: string): void {
  ensureTestEnvironment();
  const allowed = new Set(["BOZZA", "INVIATO", "APPROVATO", "RIFIUTATO"]);
  if (!allowed.has(stato)) {
    throw new Error("INVALID_STATO_FOR_TESTS");
  }
  const target = testPreventivi.find((row) => row.id === preventivoId);
  if (!target) {
    throw new Error("PREVENTIVO_NOT_FOUND_FOR_TESTS");
  }
  target.stato = stato;
  if (stato === "INVIATO") {
    target.dataInvio = new Date().toISOString();
    target.dataRisposta = null;
    testRiparazioneStatoById.set(target.riparazioneId, "IN_ATTESA_APPROVAZIONE");
    return;
  }

  target.dataInvio = null;
  if (stato === "APPROVATO" || stato === "RIFIUTATO") {
    target.dataRisposta = new Date().toISOString();
    testRiparazioneStatoById.set(
      target.riparazioneId,
      stato === "APPROVATO" ? "APPROVATA" : "ANNULLATA",
    );
    return;
  }

  testRiparazioneStatoById.set(target.riparazioneId, "PREVENTIVO_EMESSO");
  target.dataRisposta = null;
}

function seedPreventiviForReportForTests(entries: SeedPreventivoReportInput[]): void {
  ensureTestEnvironment();
  const allowedStati = new Set(["BOZZA", "INVIATO", "APPROVATO", "RIFIUTATO"]);
  testPreventivi = entries.map((entry, index) => {
    if (!allowedStati.has(entry.stato)) {
      throw new Error("INVALID_STATO_FOR_REPORT_TESTS");
    }
    if (!Number.isFinite(entry.totale) || entry.totale <= 0) {
      throw new Error("INVALID_TOTALE_FOR_REPORT_TESTS");
    }
    const parsedDataInvio =
      entry.dataInvio === undefined || entry.dataInvio === null
        ? null
        : asIsoDate(entry.dataInvio);
    if (entry.dataInvio !== undefined && entry.dataInvio !== null && !parsedDataInvio) {
      throw new Error("INVALID_DATA_INVIO_FOR_REPORT_TESTS");
    }
    const parsedDataRisposta =
      entry.dataRisposta === undefined || entry.dataRisposta === null
        ? null
        : asIsoDate(entry.dataRisposta);
    if (entry.dataRisposta !== undefined && entry.dataRisposta !== null && !parsedDataRisposta) {
      throw new Error("INVALID_DATA_RISPOSTA_FOR_REPORT_TESTS");
    }
    const id = entry.id ?? index + 1;
    const riparazioneId = entry.riparazioneId ?? id;
    const dataInvio = parsedDataInvio;
    const dataRisposta = parsedDataRisposta;
    const totale = Math.round(entry.totale * 100) / 100;
    const subtotale = Math.round((totale / 1.22) * 100) / 100;
    const iva = Math.round((totale - subtotale) * 100) / 100;
    return {
      id,
      riparazioneId,
      numeroPreventivo: `PREV-${String(id).padStart(6, "0")}`,
      stato: entry.stato,
      dataInvio,
      dataRisposta,
      voci: [
        {
          tipo: "MANODOPERA",
          descrizione: "Voce report seed",
          quantita: 1,
          prezzoUnitario: subtotale,
        },
      ],
      subtotale,
      iva,
      totale,
    };
  });
  const maxId = testPreventivi.reduce((max, row) => Math.max(max, row.id), 0);
  nextTestPreventivoId = maxId + 1;
}

function setPreventivoClienteEmailForTests(
  preventivoId: number,
  email: string | null,
): void {
  ensureTestEnvironment();
  const target = testPreventivi.find((row) => row.id === preventivoId);
  if (!target) {
    throw new Error("PREVENTIVO_NOT_FOUND_FOR_TESTS");
  }

  const normalizedEmail = typeof email === "string" ? email.trim() : null;
  testClienteEmailByRiparazioneId.set(target.riparazioneId, normalizedEmail);
}

function setPreventivoEmailFailureForTests(
  preventivoId: number,
  fail: boolean,
): void {
  ensureTestEnvironment();
  const target = testPreventivi.find((row) => row.id === preventivoId);
  if (!target) {
    throw new Error("PREVENTIVO_NOT_FOUND_FOR_TESTS");
  }

  testEmailFailureByPreventivoId.set(preventivoId, fail);
}

function getApprovedPreventivoForRiparazioneForTests(
  riparazioneId: number,
): ApprovedPreventivoForFattura | null {
  ensureTestEnvironment();
  const matches = testPreventivi
    .filter(
      (row) => row.riparazioneId === riparazioneId && row.stato === "APPROVATO",
    )
    .sort((a, b) => b.id - a.id);

  const target = matches[0];
  if (!target) {
    return null;
  }

  return {
    id: target.id,
    riparazioneId: target.riparazioneId,
    voci: target.voci.map((voce) => ({ ...voce })),
    subtotale: target.subtotale,
    iva: target.iva,
    totale: target.totale,
  };
}

export {
  createPreventivo,
  getPreventivoDettaglio,
  inviaPreventivo,
  listPreventiviReport,
  registraRispostaPreventivo,
  updatePreventivo,
  seedPreventiviForReportForTests,
  resetPreventiviStoreForTests,
  setPreventivoClienteEmailForTests,
  setPreventivoEmailFailureForTests,
  getApprovedPreventivoForRiparazioneForTests,
  setPreventivoStatoForTests,
  type ApprovedPreventivoForFattura,
  type CreatePreventivoInput,
  type CreatePreventivoResult,
  type GetPreventivoDettaglioInput,
  type GetPreventivoDettaglioResult,
  type InviaPreventivoInput,
  type InviaPreventivoResult,
  type ListPreventiviReportInput,
  type ListPreventiviReportResult,
  type PreventivoReportRow,
  type RegistraRispostaPreventivoInput,
  type RegistraRispostaPreventivoResult,
  type SeedPreventivoReportInput,
  type UpdatePreventivoInput,
  type UpdatePreventivoResult,
};
