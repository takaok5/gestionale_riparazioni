type NotificaTipo = "STATO_RIPARAZIONE" | "PREVENTIVO" | "PORTAL_ACCOUNT_ATTIVAZIONE";
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
  riferimentoTipo: "RIPARAZIONE" | "PREVENTIVO" | "PORTAL_ACCOUNT";
  riferimentoId: number;
  dataInvio: string;
  allegato?: string;
}

interface CreatePreventivoNotificaInput {
  preventivoId: number;
  codiceRiparazione: string;
  destinatario: string;
  voci: Array<{
    tipo: string;
    descrizione: string;
    quantita: number;
    prezzoUnitario: number;
  }>;
  subtotale: number;
  iva: number;
  totale: number;
  allegatoPath: string;
  stato: NotificaStato;
}

interface CreatePortalAccountActivationNotificaInput {
  clienteId: number;
  destinatario: string;
}

interface ListNotificheInput {
  page?: unknown;
  limit?: unknown;
  tipo?: unknown;
  stato?: unknown;
  dataDa?: unknown;
  dataA?: unknown;
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
const TEST_FAIL_PORTAL_EMAIL_ENV = "TEST_FAIL_PORTAL_EMAIL";
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

function shouldFailPortalEmail(): boolean {
  return process.env.NODE_ENV === "test" && process.env[TEST_FAIL_PORTAL_EMAIL_ENV] === "1";
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

function parseDateOnly(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return undefined;
  }

  const parsed = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  if (parsed.toISOString().slice(0, 10) !== trimmed) {
    return undefined;
  }

  return trimmed;
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

function formatCurrency(value: number): string {
  return value.toFixed(2);
}

function buildPreventivoBody(input: CreatePreventivoNotificaInput): string {
  const voci = input.voci
    .map(
      (voce) =>
        `- ${voce.tipo}: ${voce.descrizione} x${voce.quantita} (${formatCurrency(voce.prezzoUnitario)})`,
    )
    .join("\n");

  return [
    "Dettaglio preventivo:",
    "voci:",
    voci,
    `subtotale: ${formatCurrency(input.subtotale)}`,
    `IVA: ${formatCurrency(input.iva)}`,
    `totale: ${formatCurrency(input.totale)}`,
  ].join("\n");
}

async function createPreventivoNotifica(
  input: CreatePreventivoNotificaInput,
): Promise<NotificaPayload> {
  const dataInvio = new Date().toISOString();
  const notification: NotificaPayload = {
    id: nextNotificaId,
    tipo: "PREVENTIVO",
    destinatario: input.destinatario,
    oggetto: `Preventivo - ${input.codiceRiparazione}`,
    contenuto: buildPreventivoBody(input),
    stato: input.stato,
    riferimentoTipo: "PREVENTIVO",
    riferimentoId: input.preventivoId,
    dataInvio,
    allegato: input.allegatoPath,
  };

  nextNotificaId += 1;
  testNotifiche.push(notification);
  return { ...notification };
}

async function createPortalAccountActivationNotifica(
  input: CreatePortalAccountActivationNotificaInput,
): Promise<NotificaPayload> {
  const dataInvio = new Date().toISOString();
  const notification: NotificaPayload = {
    id: nextNotificaId,
    tipo: "PORTAL_ACCOUNT_ATTIVAZIONE",
    destinatario: input.destinatario,
    oggetto: "Attivazione account portale",
    contenuto:
      "Usa il token di attivazione ricevuto per impostare la password e completare l'accesso al portale clienti.",
    stato: shouldFailPortalEmail() ? "FALLITA" : "INVIATA",
    riferimentoTipo: "PORTAL_ACCOUNT",
    riferimentoId: input.clienteId,
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
  const dataDa = parseDateOnly(input.dataDa);
  const dataA = parseDateOnly(input.dataA);
  const dataDaStart = dataDa ? `${dataDa}T00:00:00.000Z` : undefined;
  const dataAEnd = dataA ? `${dataA}T23:59:59.999Z` : undefined;

  let rows = testNotifiche.map((row) => ({ ...row }));
  if (dataDaStart && dataAEnd && dataDaStart > dataAEnd) {
    rows = [];
  }

  if (tipoFilter) {
    rows = rows.filter((row) => row.tipo === tipoFilter);
  }
  if (statoFilter) {
    rows = rows.filter((row) => row.stato === statoFilter);
  }
  if (dataDaStart) {
    rows = rows.filter((row) => row.dataInvio >= dataDaStart);
  }
  if (dataAEnd) {
    rows = rows.filter((row) => row.dataInvio <= dataAEnd);
  }

  rows.sort((left, right) => {
    if (left.dataInvio === right.dataInvio) {
      return right.id - left.id;
    }
    return right.dataInvio.localeCompare(left.dataInvio);
  });

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
  createPortalAccountActivationNotifica,
  createPreventivoNotifica,
  createRiparazioneStatoNotifica,
  listNotifiche,
  resetNotificheStoreForTests,
  type NotificaPayload,
};
