import { listArticoliAlert, listClienti } from "./anagrafiche-service.js";
import { listFatture, type ListFattureResult } from "./fatture-service.js";
import { listRiparazioni, type ListRiparazioniResult } from "./riparazioni-service.js";
import { PrismaClient } from "@prisma/client";
import { listActiveTecniciForTests } from "./users-service.js";

interface GetDashboardInput {
  actorUserId: unknown;
  actorRole: unknown;
}

interface GetDashboardRiparazioniPerStatoInput {
  actorUserId: unknown;
  actorRole: unknown;
  periodo: unknown;
}

interface GetDashboardCaricoTecniciInput {
  actorUserId: unknown;
  actorRole: unknown;
}

type DashboardFailure =
  | { ok: false; code: "VALIDATION_ERROR"; message: string }
  | { ok: false; code: "FORBIDDEN"; message: string }
  | { ok: false; code: "SERVICE_UNAVAILABLE"; message: string };

interface DashboardAdminData {
  riparazioniPerStato: Record<string, number>;
  caricoTecnici: Array<{
    tecnicoId: number;
    username: string;
    nome: string;
    riparazioniAttive: number;
  }>;
  alertMagazzino: number;
  ultimiPagamenti: Array<{
    fatturaId: number;
    importo: number;
    data: string;
  }>;
}

interface DashboardTecnicoData {
  mieRiparazioni: Record<string, number>;
  nextRiparazioni: Array<{
    id: number;
    codiceRiparazione: string;
    stato: string;
  }>;
}

interface DashboardCommercialeData {
  clientiAttivi: number;
  preventiviPendenti: number;
  fattureNonPagate: number;
  fatturato30gg: number;
}

type DashboardSuccess =
  | { ok: true; data: DashboardAdminData | DashboardTecnicoData | DashboardCommercialeData };

type GetDashboardResult = DashboardSuccess | DashboardFailure;
type GetDashboardCaricoTecniciResult =
  | { ok: true; data: DashboardAdminData["caricoTecnici"] }
  | DashboardFailure;
type ListedRiparazione = Extract<ListRiparazioniResult, { ok: true }>["data"]["data"][number];
type ListedFattura = Extract<ListFattureResult, { ok: true }>["data"]["data"][number];
type DashboardStatoKey =
  | "RICEVUTA"
  | "IN_DIAGNOSI"
  | "IN_LAVORAZIONE"
  | "PREVENTIVO_EMESSO"
  | "COMPLETATA"
  | "CONSEGNATA"
  | "ANNULLATA";

const DASHBOARD_STATI: DashboardStatoKey[] = [
  "RICEVUTA",
  "IN_DIAGNOSI",
  "IN_LAVORAZIONE",
  "PREVENTIVO_EMESSO",
  "COMPLETATA",
  "CONSEGNATA",
  "ANNULLATA",
];

let prismaClient: PrismaClient | null = null;

function asPositiveInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    const parsed = Number(value.trim());
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
}

function asRole(value: unknown): "ADMIN" | "TECNICO" | "COMMERCIALE" | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim().toUpperCase();
  if (normalized === "ADMIN" || normalized === "TECNICO" || normalized === "COMMERCIALE") {
    return normalized;
  }
  return null;
}

function isWithinLast30Days(isoDate: string, now: Date): boolean {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }
  const diff = now.getTime() - parsed.getTime();
  const windowMs = 30 * 24 * 60 * 60 * 1000;
  return diff >= 0 && diff <= windowMs;
}

function toDateOnly(isoDate: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return isoDate;
  }
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return isoDate.slice(0, 10);
  }
  return parsed.toISOString().slice(0, 10);
}

function getPrismaClient(): PrismaClient {
  if (!prismaClient) {
    prismaClient = new PrismaClient();
  }

  return prismaClient;
}

function toDisplayNameFromUsername(username: string): string {
  const tokens = username
    .replace(/[._-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0);

  if (tokens.length === 0) {
    return username;
  }

  return tokens
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
    .join(" ");
}

async function listTecniciById(
  tecnicoIds: number[],
): Promise<Map<number, { username: string; nome: string }> | DashboardFailure> {
  if (tecnicoIds.length === 0) {
    return new Map();
  }

  if (process.env.NODE_ENV === "test") {
    const activeTecnici = listActiveTecniciForTests();
    const map = new Map<number, { username: string; nome: string }>();
    for (const user of activeTecnici) {
      if (!tecnicoIds.includes(user.id)) {
        continue;
      }
      map.set(user.id, {
        username: user.username,
        nome: toDisplayNameFromUsername(user.username),
      });
    }
    return map;
  }

  try {
    const users = await getPrismaClient().user.findMany({
      where: {
        id: { in: tecnicoIds },
        role: "TECNICO",
        isActive: true,
      },
      select: {
        id: true,
        username: true,
      },
    });

    const map = new Map<number, { username: string; nome: string }>();
    for (const user of users) {
      map.set(user.id, {
        username: user.username,
        nome: toDisplayNameFromUsername(user.username),
      });
    }

    return map;
  } catch {
    return {
      ok: false,
      code: "SERVICE_UNAVAILABLE",
      message: "Impossibile leggere i tecnici",
    };
  }
}

function resolveTecnicoIdentity(
  tecnicoId: number,
  tecniciById: Map<number, { username: string; nome: string }>,
): { username: string; nome: string } | null {
  const fromUsers = tecniciById.get(tecnicoId);
  if (fromUsers) {
    return fromUsers;
  }

  return null;
}

async function buildCaricoTecnici(): Promise<GetDashboardCaricoTecniciResult> {
  const riparazioniResult = await fetchAllRiparazioni({});
  if (!riparazioniResult.ok) {
    return riparazioniResult;
  }

  const caricoTecniciMap = new Map<number, number>();
  for (const row of riparazioniResult.data) {
    if (
      row.tecnicoId &&
      (row.stato === "IN_DIAGNOSI" || row.stato === "IN_LAVORAZIONE")
    ) {
      caricoTecniciMap.set(row.tecnicoId, (caricoTecniciMap.get(row.tecnicoId) ?? 0) + 1);
    }
  }

  const tecniciByIdResult = await listTecniciById(Array.from(caricoTecniciMap.keys()));
  if (!(tecniciByIdResult instanceof Map)) {
    return tecniciByIdResult;
  }

  const tecniciById = tecniciByIdResult;
  const caricoTecnici = Array.from(caricoTecniciMap.entries())
    .map(([tecnicoId, riparazioniAttive]) => {
      const tecnico = resolveTecnicoIdentity(tecnicoId, tecniciById);
      if (!tecnico) {
        return null;
      }
      return {
        tecnicoId,
        username: tecnico.username,
        nome: tecnico.nome,
        riparazioniAttive,
      };
    })
    .filter(
      (row): row is { tecnicoId: number; username: string; nome: string; riparazioniAttive: number } =>
        row !== null,
    )
    .sort((a, b) =>
      b.riparazioniAttive === a.riparazioniAttive
        ? a.tecnicoId - b.tecnicoId
        : b.riparazioniAttive - a.riparazioniAttive,
    );

  return { ok: true, data: caricoTecnici };
}

async function fetchAllRiparazioni(filters: {
  stato?: string;
  tecnicoId?: number;
  dataRicezioneDa?: string;
  dataRicezioneA?: string;
}): Promise<{ ok: true; data: ListedRiparazione[] } | DashboardFailure> {
  let page = 1;
  const limit = 100;
  const rows: ListedRiparazione[] = [];

  while (true) {
    const result = await listRiparazioni({
      page,
      limit,
      stato: filters.stato,
      tecnicoId: filters.tecnicoId,
      priorita: undefined,
      dataRicezioneDa: filters.dataRicezioneDa,
      dataRicezioneA: filters.dataRicezioneA,
      search: undefined,
    });

    if (!result.ok) {
      return {
        ok: false,
        code: "SERVICE_UNAVAILABLE",
        message: "Impossibile leggere le riparazioni",
      };
    }

    rows.push(...result.data.data);
    if (page >= result.data.meta.totalPages) {
      break;
    }
    page += 1;
  }

  return { ok: true, data: rows };
}

function toUtcDateOnly(value: Date): string {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function resolveDashboardPeriodo(
  periodo: unknown,
  now: Date,
):
  | { ok: true; data: { dataRicezioneDa?: string; dataRicezioneA?: string } }
  | { ok: false; code: "VALIDATION_ERROR"; message: string } {
  if (periodo === undefined || periodo === null || periodo === "") {
    return { ok: true, data: {} };
  }
  if (typeof periodo !== "string") {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "periodo non valido",
    };
  }

  const normalized = periodo.trim().toLowerCase();
  const utcMidnightToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  if (normalized === "today") {
    const day = toUtcDateOnly(utcMidnightToday);
    return {
      ok: true,
      data: {
        dataRicezioneDa: day,
        dataRicezioneA: day,
      },
    };
  }
  if (normalized === "week") {
    const start = new Date(utcMidnightToday);
    start.setUTCDate(start.getUTCDate() - 6);
    return {
      ok: true,
      data: {
        dataRicezioneDa: toUtcDateOnly(start),
        dataRicezioneA: toUtcDateOnly(utcMidnightToday),
      },
    };
  }
  if (normalized === "month") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
    return {
      ok: true,
      data: {
        dataRicezioneDa: toUtcDateOnly(start),
        dataRicezioneA: toUtcDateOnly(end),
      },
    };
  }

  return {
    ok: false,
    code: "VALIDATION_ERROR",
    message: "periodo non supportato: valori ammessi today|week|month",
  };
}

async function getDashboardRiparazioniPerStato(
  input: GetDashboardRiparazioniPerStatoInput,
): Promise<{ ok: true; data: Record<DashboardStatoKey, number> } | DashboardFailure> {
  const actorUserId = asPositiveInteger(input.actorUserId);
  if (actorUserId === null) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "actorUserId non valido",
    };
  }

  const actorRole = asRole(input.actorRole);
  if (!actorRole) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "actorRole non valido",
    };
  }
  if (actorRole !== "ADMIN") {
    return {
      ok: false,
      code: "FORBIDDEN",
      message: "Admin only",
    };
  }

  const periodo = resolveDashboardPeriodo(input.periodo, new Date());
  if (!periodo.ok) {
    return periodo;
  }

  const riparazioniResult = await fetchAllRiparazioni({
    dataRicezioneDa: periodo.data.dataRicezioneDa,
    dataRicezioneA: periodo.data.dataRicezioneA,
  });
  if (!riparazioniResult.ok) {
    return riparazioniResult;
  }

  const counter: Record<DashboardStatoKey, number> = {
    RICEVUTA: 0,
    IN_DIAGNOSI: 0,
    IN_LAVORAZIONE: 0,
    PREVENTIVO_EMESSO: 0,
    COMPLETATA: 0,
    CONSEGNATA: 0,
    ANNULLATA: 0,
  };

  for (const row of riparazioniResult.data) {
    if (DASHBOARD_STATI.includes(row.stato as DashboardStatoKey)) {
      const key = row.stato as DashboardStatoKey;
      counter[key] += 1;
    }
  }

  return { ok: true, data: counter };
}

async function fetchAllFatture(filters: {
  stato?: "EMESSA" | "PAGATA";
}): Promise<{ ok: true; data: ListedFattura[] } | DashboardFailure> {
  let page = 1;
  const limit = 100;
  const rows: ListedFattura[] = [];

  while (true) {
    const result = await listFatture({
      page,
      limit,
      stato: filters.stato,
      dataDa: undefined,
      dataA: undefined,
    });
    if (!result.ok) {
      return {
        ok: false,
        code: "SERVICE_UNAVAILABLE",
        message: "Impossibile leggere le fatture",
      };
    }

    rows.push(...result.data.data);
    if (page >= result.data.meta.totalPages) {
      break;
    }
    page += 1;
  }

  return { ok: true, data: rows };
}

async function buildAdminDashboard(): Promise<GetDashboardResult> {
  const riparazioniResult = await fetchAllRiparazioni({});
  if (!riparazioniResult.ok) {
    return riparazioniResult;
  }

  const riparazioniPerStato: Record<string, number> = {
    RICEVUTA: 0,
    IN_DIAGNOSI: 0,
    IN_LAVORAZIONE: 0,
    COMPLETATA: 0,
  };
  for (const row of riparazioniResult.data) {
    const currentCount = riparazioniPerStato[row.stato] ?? 0;
    riparazioniPerStato[row.stato] = currentCount + 1;
  }

  const caricoTecniciResult = await buildCaricoTecnici();
  if (!caricoTecniciResult.ok) {
    return caricoTecniciResult;
  }

  const alertResult = await listArticoliAlert({});
  if (!alertResult.ok) {
    return {
      ok: false,
      code: "SERVICE_UNAVAILABLE",
      message: "Impossibile leggere gli alert magazzino",
    };
  }

  const fattureResult = await fetchAllFatture({ stato: "PAGATA" });
  if (!fattureResult.ok) {
    return fattureResult;
  }

  const now = new Date();
  const ultimiPagamenti = fattureResult.data
    .flatMap((fattura) =>
      fattura.pagamenti.map((pagamento) => ({
        fatturaId: fattura.id,
        importo: pagamento.importo,
        data: toDateOnly(pagamento.dataPagamento),
      })),
    )
    .filter((pagamento) => isWithinLast30Days(pagamento.data, now))
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, 10);

  return {
    ok: true,
    data: {
      riparazioniPerStato,
      caricoTecnici: caricoTecniciResult.data,
      alertMagazzino: alertResult.data.data.length,
      ultimiPagamenti,
    },
  };
}

async function getDashboardCaricoTecnici(
  input: GetDashboardCaricoTecniciInput,
): Promise<GetDashboardCaricoTecniciResult> {
  const actorUserId = asPositiveInteger(input.actorUserId);
  if (actorUserId === null) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "actorUserId non valido",
    };
  }

  const actorRole = asRole(input.actorRole);
  if (!actorRole) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "actorRole non valido",
    };
  }
  if (actorRole !== "ADMIN") {
    return {
      ok: false,
      code: "FORBIDDEN",
      message: "Admin only",
    };
  }

  return buildCaricoTecnici();
}

async function buildTecnicoDashboard(actorUserId: number): Promise<GetDashboardResult> {
  const riparazioniResult = await fetchAllRiparazioni({
    tecnicoId: actorUserId,
  });
  if (!riparazioniResult.ok) {
    return riparazioniResult;
  }

  const mieRiparazioni: Record<string, number> = {
    IN_DIAGNOSI: 0,
    IN_LAVORAZIONE: 0,
  };
  for (const row of riparazioniResult.data) {
    mieRiparazioni[row.stato] = (mieRiparazioni[row.stato] ?? 0) + 1;
  }

  const nextRiparazioni = riparazioniResult.data.slice(0, 10).map((row) => ({
    id: row.id,
    codiceRiparazione: row.codiceRiparazione,
    stato: row.stato,
  }));

  return {
    ok: true,
    data: {
      mieRiparazioni,
      nextRiparazioni,
    },
  };
}

async function buildCommercialeDashboard(): Promise<GetDashboardResult> {
  const clientiResult = await listClienti({
    page: 1,
    limit: 1,
    search: undefined,
    tipologia: undefined,
  });
  if (!clientiResult.ok) {
    return {
      ok: false,
      code: "SERVICE_UNAVAILABLE",
      message: "Impossibile leggere i clienti",
    };
  }

  const preventiviEmessiResult = await listRiparazioni({
    page: 1,
    limit: 1,
    stato: "PREVENTIVO_EMESSO",
    tecnicoId: undefined,
    priorita: undefined,
    dataRicezioneDa: undefined,
    dataRicezioneA: undefined,
    search: undefined,
  });
  if (!preventiviEmessiResult.ok) {
    return {
      ok: false,
      code: "SERVICE_UNAVAILABLE",
      message: "Impossibile leggere i preventivi pendenti",
    };
  }
  const preventiviAttesaResult = await listRiparazioni({
    page: 1,
    limit: 1,
    stato: "IN_ATTESA_APPROVAZIONE",
    tecnicoId: undefined,
    priorita: undefined,
    dataRicezioneDa: undefined,
    dataRicezioneA: undefined,
    search: undefined,
  });
  if (!preventiviAttesaResult.ok) {
    return {
      ok: false,
      code: "SERVICE_UNAVAILABLE",
      message: "Impossibile leggere i preventivi pendenti",
    };
  }

  const fattureNonPagateResult = await listFatture({
    page: 1,
    limit: 1,
    stato: "EMESSA",
  });
  if (!fattureNonPagateResult.ok) {
    return {
      ok: false,
      code: "SERVICE_UNAVAILABLE",
      message: "Impossibile leggere le fatture",
    };
  }

  const fatturatoResult = await fetchAllFatture({});
  if (!fatturatoResult.ok) {
    return fatturatoResult;
  }

  const now = new Date();
  const fatturato30gg = Number(
    fatturatoResult.data
      .flatMap((fattura) => fattura.pagamenti)
      .filter((pagamento) => isWithinLast30Days(pagamento.dataPagamento, now))
      .reduce((sum, pagamento) => sum + pagamento.importo, 0)
      .toFixed(2),
  );

  return {
    ok: true,
    data: {
      clientiAttivi: clientiResult.data.meta.total,
      preventiviPendenti:
        preventiviEmessiResult.data.meta.total + preventiviAttesaResult.data.meta.total,
      fattureNonPagate: fattureNonPagateResult.data.meta.total,
      fatturato30gg,
    },
  };
}

async function getDashboard(input: GetDashboardInput): Promise<GetDashboardResult> {
  const actorUserId = asPositiveInteger(input.actorUserId);
  if (actorUserId === null) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "actorUserId non valido",
    };
  }

  const actorRole = asRole(input.actorRole);
  if (!actorRole) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "actorRole non valido",
    };
  }

  if (actorRole === "ADMIN") {
    return buildAdminDashboard();
  }
  if (actorRole === "TECNICO") {
    return buildTecnicoDashboard(actorUserId);
  }
  if (actorRole === "COMMERCIALE") {
    return buildCommercialeDashboard();
  }

  return {
    ok: false,
    code: "FORBIDDEN",
    message: "Ruolo non autorizzato",
  };
}

export {
  getDashboard,
  getDashboardCaricoTecnici,
  getDashboardRiparazioniPerStato,
  type GetDashboardCaricoTecniciInput,
  type GetDashboardInput,
  type GetDashboardResult,
  type GetDashboardRiparazioniPerStatoInput,
};
