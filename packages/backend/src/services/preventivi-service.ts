import { PrismaClient, type Prisma } from "@prisma/client";
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
    return {
      ok: false,
      code: "EMAIL_SEND_FAILED",
      message: "Failed to send email",
    };
  }

  const sentAt = new Date().toISOString();
  target.stato = "INVIATO";
  target.dataInvio = sentAt;
  testRiparazioneStatoById.set(target.riparazioneId, "IN_ATTESA_APPROVAZIONE");

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
          },
          select: {
            id: true,
            riparazioneId: true,
            numeroPreventivo: true,
            stato: true,
            dataInvio: true,
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
      voci: [
        {
          tipo: "MANODOPERA",
          descrizione: "Diagnosi iniziale",
          quantita: 1,
          prezzoUnitario: 50,
        },
      ],
      subtotale: 50,
      iva: 11,
      totale: 61,
    },
    {
      id: 21,
      riparazioneId: 10,
      numeroPreventivo: "PREV-000021",
      stato: "BOZZA",
      dataInvio: null,
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
  if (stato !== "INVIATO") {
    target.dataInvio = null;
    return;
  }
  target.dataInvio = new Date().toISOString();
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

export {
  createPreventivo,
  getPreventivoDettaglio,
  inviaPreventivo,
  updatePreventivo,
  resetPreventiviStoreForTests,
  setPreventivoClienteEmailForTests,
  setPreventivoEmailFailureForTests,
  setPreventivoStatoForTests,
  type CreatePreventivoInput,
  type CreatePreventivoResult,
  type GetPreventivoDettaglioInput,
  type GetPreventivoDettaglioResult,
  type InviaPreventivoInput,
  type InviaPreventivoResult,
  type UpdatePreventivoInput,
  type UpdatePreventivoResult,
};
