type NotificaTipo = "STATO_RIPARAZIONE";
type NotificaStato = "INVIATA" | "FALLITA";

interface CreateRiparazioneStatoNotificaInput {
  riparazioneId: number;
  codiceRiparazione: string;
  statoRiparazione: string;
  destinatario: string;
}

interface NotificaPayload {
  id: number;
  tipo: NotificaTipo;
  destinatario: string;
  oggetto: string;
  contenuto: string;
  stato: NotificaStato;
  riferimentoTipo: "RIPARAZIONE";
  riferimentoId: number;
  dataInvio: string;
}

interface ListNotificheInput {
  page?: unknown;
  limit?: unknown;
  tipo?: unknown;
  stato?: unknown;
}

interface ListNotificheResult {
  ok: true;
  data: NotificaPayload[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const TEST_FAIL_RIPARAZIONI_EMAIL_ENV = "TEST_FAIL_RIPARAZIONI_EMAIL";
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

let testNotifiche: NotificaPayload[] = [];
let nextNotificaId = 1;

function normalizeFilter(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.toUpperCase();
}

function buildSubject(statoRiparazione: string, codiceRiparazione: string): string {
  if (statoRiparazione === "RICEVUTA") {
    return `Riparazione Ricevuta - ${codiceRiparazione}`;
  }

  if (statoRiparazione === "COMPLETATA") {
    return "Riparazione Completata";
  }

  if (statoRiparazione === "CONSEGNATA") {
    return "Riparazione Consegnata";
  }

  return `Aggiornamento Riparazione - ${codiceRiparazione}`;
}

function buildBody(statoRiparazione: string, codiceRiparazione: string): string {
  if (statoRiparazione === "COMPLETATA") {
    return `La sua riparazione e pronta per il ritiro (${codiceRiparazione})`;
  }

  if (statoRiparazione === "RICEVUTA") {
    return `La riparazione ${codiceRiparazione} e stata presa in carico`;
  }

  if (statoRiparazione === "CONSEGNATA") {
    return `La riparazione ${codiceRiparazione} e stata consegnata`;
  }

  return `Aggiornamento stato riparazione ${codiceRiparazione}`;
}

function shouldFailRiparazioneEmail(): boolean {
  return process.env.NODE_ENV === "test" && process.env[TEST_FAIL_RIPARAZIONI_EMAIL_ENV] === "1";
}

function parsePositiveInteger(value: unknown): number | null {
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

function resetNotificheStoreForTests(): void {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("TEST_HELPER_ONLY_IN_TEST_ENV");
  }

  testNotifiche = [];
  nextNotificaId = 1;
}

async function createRiparazioneStatoNotifica(
  input: CreateRiparazioneStatoNotificaInput,
): Promise<NotificaPayload> {
  const dataInvio = new Date().toISOString();
  const notification: NotificaPayload = {
    id: nextNotificaId,
    tipo: "STATO_RIPARAZIONE",
    destinatario: input.destinatario,
    oggetto: buildSubject(input.statoRiparazione, input.codiceRiparazione),
    contenuto: buildBody(input.statoRiparazione, input.codiceRiparazione),
    stato: shouldFailRiparazioneEmail() ? "FALLITA" : "INVIATA",
    riferimentoTipo: "RIPARAZIONE",
    riferimentoId: input.riparazioneId,
    dataInvio,
  };

  nextNotificaId += 1;
  testNotifiche.push(notification);
  return { ...notification };
}

async function listNotifiche(input: ListNotificheInput): Promise<ListNotificheResult> {
  const page = parsePositiveInteger(input.page) ?? DEFAULT_PAGE;
  const parsedLimit = parsePositiveInteger(input.limit) ?? DEFAULT_LIMIT;
  const limit = Math.min(parsedLimit, MAX_LIMIT);
  const tipoFilter = normalizeFilter(input.tipo);
  const statoFilter = normalizeFilter(input.stato);

  let rows = testNotifiche.map((row) => ({ ...row }));
  if (tipoFilter) {
    rows = rows.filter((row) => row.tipo === tipoFilter);
  }
  if (statoFilter) {
    rows = rows.filter((row) => row.stato === statoFilter);
  }
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * limit;
  const pagedRows = rows.slice(offset, offset + limit);

  return {
    ok: true,
    data: pagedRows,
    meta: {
      page: safePage,
      limit,
      total,
      totalPages,
    },
  };
}

export {
  createRiparazioneStatoNotifica,
  listNotifiche,
  resetNotificheStoreForTests,
  type NotificaPayload,
};
