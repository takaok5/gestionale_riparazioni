import { listArticoliAlert, listClienti } from "./anagrafiche-service.js";
import { listFatture, type ListFattureResult } from "./fatture-service.js";
import { listRiparazioni, type ListRiparazioniResult } from "./riparazioni-service.js";

interface GetDashboardInput {
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
type ListedRiparazione = Extract<ListRiparazioniResult, { ok: true }>["data"]["data"][number];
type ListedFattura = Extract<ListFattureResult, { ok: true }>["data"]["data"][number];

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

async function fetchAllRiparazioni(filters: {
  stato?: string;
  tecnicoId?: number;
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
      dataRicezioneDa: undefined,
      dataRicezioneA: undefined,
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
  const caricoTecniciMap = new Map<number, number>();
  for (const row of riparazioniResult.data) {
    const currentCount = riparazioniPerStato[row.stato] ?? 0;
    riparazioniPerStato[row.stato] = currentCount + 1;
    if (
      row.tecnicoId &&
      (row.stato === "IN_DIAGNOSI" || row.stato === "IN_LAVORAZIONE")
    ) {
      caricoTecniciMap.set(row.tecnicoId, (caricoTecniciMap.get(row.tecnicoId) ?? 0) + 1);
    }
  }

  const caricoTecnici = Array.from(caricoTecniciMap.entries()).map(([tecnicoId, riparazioniAttive]) => ({
    tecnicoId,
    nome: `Tecnico ${tecnicoId}`,
    riparazioniAttive,
  }));

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
      caricoTecnici,
      alertMagazzino: alertResult.data.data.length,
      ultimiPagamenti,
    },
  };
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

export { getDashboard, type GetDashboardInput, type GetDashboardResult };
