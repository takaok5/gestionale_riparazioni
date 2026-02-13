import {
  getRiparazioneDettaglio,
  listRiparazioni,
  type GetRiparazioneDettaglioResult,
  type ListRiparazioniResult,
} from "./riparazioni-service.js";
import { listFatture } from "./fatture-service.js";
import { listPreventiviReport } from "./preventivi-service.js";

interface GetReportRiparazioniInput {
  actorUserId: unknown;
  actorRole: unknown;
  tecnicoId?: unknown;
  dateFrom?: unknown;
  dateTo?: unknown;
}

interface GetReportFinanziariInput {
  actorUserId: unknown;
  actorRole: unknown;
  dateFrom?: unknown;
  dateTo?: unknown;
}

interface ValidationDetails extends Record<string, unknown> {
  field: string;
  rule: string;
}

type ReportFailure =
  | { ok: false; code: "VALIDATION_ERROR"; message: string; details: ValidationDetails }
  | { ok: false; code: "FORBIDDEN"; message: string }
  | { ok: false; code: "SERVICE_UNAVAILABLE"; message: string };

interface ReportRiparazioniPayload {
  totaleRiparazioni: number;
  completate: number;
  tempoMedioPerStato: Record<string, number>;
  tassoCompletamento: number;
  countPerStato: Record<string, number>;
  tecnicoId?: number;
}

interface ReportFinanziariPayload {
  fatturato: number;
  incassato: number;
  margine: number;
  preventiviEmessi: number;
  preventiviApprovati: number;
  tassoApprovazione: number;
}

type GetReportRiparazioniResult =
  | { ok: true; data: ReportRiparazioniPayload }
  | ReportFailure;

type GetReportFinanziariResult =
  | { ok: true; data: ReportFinanziariPayload }
  | ReportFailure;

interface ParsedInput {
  actorUserId: number;
  actorRole: "ADMIN" | "TECNICO" | "COMMERCIALE";
  tecnicoId?: number;
  dateFrom?: string;
  dateTo?: string;
}

type ListedRiparazione = Extract<ListRiparazioniResult, { ok: true }>["data"]["data"][number];
type RiparazioneDettaglio = Extract<
  Extract<GetRiparazioneDettaglioResult, { ok: true }>["data"]["data"],
  { statiHistory: unknown }
>;

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

function isDateOnly(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseInput(
  input: GetReportRiparazioniInput,
): { ok: true; data: ParsedInput } | ReportFailure {
  const actorUserId = asPositiveInteger(input.actorUserId);
  if (actorUserId === null) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "actorUserId non valido",
      details: { field: "actorUserId", rule: "positive_integer" },
    };
  }

  const actorRole = asRole(input.actorRole);
  if (!actorRole) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "actorRole non valido",
      details: { field: "actorRole", rule: "enum", values: ["ADMIN", "TECNICO", "COMMERCIALE"] },
    };
  }

  let tecnicoId: number | undefined;
  if (input.tecnicoId !== undefined && input.tecnicoId !== null && input.tecnicoId !== "") {
    const parsedTecnico = asPositiveInteger(input.tecnicoId);
    if (parsedTecnico === null) {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        message: "tecnicoId non valido",
        details: { field: "tecnicoId", rule: "positive_integer" },
      };
    }
    tecnicoId = parsedTecnico;
  }

  let dateFrom: string | undefined;
  if (input.dateFrom !== undefined && input.dateFrom !== null && input.dateFrom !== "") {
    if (typeof input.dateFrom !== "string" || !isDateOnly(input.dateFrom.trim())) {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        message: "dateFrom non valido",
        details: { field: "dateFrom", rule: "YYYY-MM-DD" },
      };
    }
    dateFrom = input.dateFrom.trim();
  }

  let dateTo: string | undefined;
  if (input.dateTo !== undefined && input.dateTo !== null && input.dateTo !== "") {
    if (typeof input.dateTo !== "string" || !isDateOnly(input.dateTo.trim())) {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        message: "dateTo non valido",
        details: { field: "dateTo", rule: "YYYY-MM-DD" },
      };
    }
    dateTo = input.dateTo.trim();
  }

  if (dateFrom && dateTo && dateFrom > dateTo) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "Intervallo date non valido",
      details: { field: "dateFrom", rule: "lte_dateTo" },
    };
  }

  return { ok: true, data: { actorUserId, actorRole, tecnicoId, dateFrom, dateTo } };
}

async function fetchAllRiparazioni(filters: {
  tecnicoId?: number;
  dateFrom?: string;
  dateTo?: string;
}): Promise<{ ok: true; data: ListedRiparazione[] } | ReportFailure> {
  let page = 1;
  const limit = 100;
  const rows: ListedRiparazione[] = [];

  while (true) {
    const result = await listRiparazioni({
      page,
      limit,
      stato: undefined,
      tecnicoId: filters.tecnicoId,
      priorita: undefined,
      dataRicezioneDa: filters.dateFrom,
      dataRicezioneA: filters.dateTo,
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

async function fetchAllFattureForReport(filters: {
  dateFrom?: string;
  dateTo?: string;
}): Promise<
  | { ok: true; data: { totale: number; totalePagato: number }[] }
  | ReportFailure
> {
  let page = 1;
  const limit = 100;
  const rows: { totale: number; totalePagato: number }[] = [];

  while (true) {
    const fattureResult = await listFatture({
      page,
      limit,
      dataDa: filters.dateFrom,
      dataA: filters.dateTo,
    });
    if (!fattureResult.ok) {
      if (fattureResult.code === "VALIDATION_ERROR") {
        return {
          ok: false,
          code: "VALIDATION_ERROR",
          message: "Filtro fatture non valido",
          details: {
            field: fattureResult.details.field,
            rule: fattureResult.details.rule,
          },
        };
      }
      return {
        ok: false,
        code: "SERVICE_UNAVAILABLE",
        message: "Impossibile leggere le fatture",
      };
    }

    rows.push(
      ...fattureResult.data.data.map((row) => ({
        totale: row.totale,
        totalePagato: row.totalePagato,
      })),
    );
    if (page >= fattureResult.data.meta.totalPages) {
      break;
    }
    page += 1;
  }

  return { ok: true, data: rows };
}

function buildCountPerStato(rows: ListedRiparazione[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.stato] = (counts[row.stato] ?? 0) + 1;
  }
  return counts;
}

function computeTempoMedioPerStato(details: RiparazioneDettaglio[]): Record<string, number> {
  const totals = new Map<string, { totalMs: number; count: number }>();

  for (const detail of details) {
    const history = [...detail.statiHistory]
      .filter((entry) => !Number.isNaN(new Date(entry.dataOra).getTime()))
      .sort((a, b) => new Date(a.dataOra).getTime() - new Date(b.dataOra).getTime());

    for (let i = 0; i < history.length - 1; i += 1) {
      const current = history[i];
      const next = history[i + 1];
      const durationMs = new Date(next.dataOra).getTime() - new Date(current.dataOra).getTime();
      if (durationMs <= 0) {
        continue;
      }

      const aggregate = totals.get(current.stato) ?? { totalMs: 0, count: 0 };
      aggregate.totalMs += durationMs;
      aggregate.count += 1;
      totals.set(current.stato, aggregate);
    }
  }

  const result: Record<string, number> = {};
  for (const [stato, aggregate] of totals.entries()) {
    if (aggregate.count === 0) {
      continue;
    }
    const avgDays = aggregate.totalMs / aggregate.count / (24 * 60 * 60 * 1000);
    result[stato] = Number(avgDays.toFixed(1));
  }

  return result;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

async function fetchDetails(
  rows: ListedRiparazione[],
): Promise<{ ok: true; data: RiparazioneDettaglio[] } | ReportFailure> {
  const detailResults = await Promise.all(
    rows.map((row) => getRiparazioneDettaglio({ riparazioneId: row.id })),
  );

  const details: RiparazioneDettaglio[] = [];
  for (const detailResult of detailResults) {
    if (!detailResult.ok) {
      return {
        ok: false,
        code: "SERVICE_UNAVAILABLE",
        message: "Impossibile leggere il dettaglio riparazioni",
      };
    }
    details.push(detailResult.data.data);
  }

  return { ok: true, data: details };
}

async function getReportRiparazioni(
  input: GetReportRiparazioniInput,
): Promise<GetReportRiparazioniResult> {
  const parsed = parseInput(input);
  if (!parsed.ok) {
    return parsed;
  }
  const filters = parsed.data;

  if (filters.actorRole !== "ADMIN") {
    return {
      ok: false,
      code: "FORBIDDEN",
      message: "Admin only",
    };
  }

  const rowsResult = await fetchAllRiparazioni({
    tecnicoId: filters.tecnicoId,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });
  if (!rowsResult.ok) {
    return rowsResult;
  }

  const detailsResult = await fetchDetails(rowsResult.data);
  if (!detailsResult.ok) {
    return detailsResult;
  }

  const totaleRiparazioni = rowsResult.data.length;
  const completate = rowsResult.data.filter((row) => row.stato === "COMPLETATA").length;
  const tassoCompletamento =
    totaleRiparazioni === 0 ? 0 : Number(((completate / totaleRiparazioni) * 100).toFixed(1));

  const reportData: ReportRiparazioniPayload = {
    totaleRiparazioni,
    completate,
    tempoMedioPerStato: computeTempoMedioPerStato(detailsResult.data),
    tassoCompletamento,
    countPerStato: buildCountPerStato(rowsResult.data),
  };
  if (filters.tecnicoId !== undefined) {
    reportData.tecnicoId = filters.tecnicoId;
  }

  return { ok: true, data: reportData };
}

async function getReportFinanziari(
  input: GetReportFinanziariInput,
): Promise<GetReportFinanziariResult> {
  const parsed = parseInput({
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    dateFrom: input.dateFrom,
    dateTo: input.dateTo,
  });
  if (!parsed.ok) {
    return parsed;
  }
  const filters = parsed.data;

  if (filters.actorRole !== "ADMIN") {
    return {
      ok: false,
      code: "FORBIDDEN",
      message: "Admin only",
    };
  }

  const fattureResult = await fetchAllFattureForReport({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });
  if (!fattureResult.ok) {
    return fattureResult;
  }

  const preventiviResult = await listPreventiviReport({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });
  if (!preventiviResult.ok) {
    if (preventiviResult.code === "VALIDATION_ERROR") {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        message: "Filtro preventivi non valido",
        details: {
          field: preventiviResult.details.field,
          rule: preventiviResult.details.rule,
        },
      };
    }
    return {
      ok: false,
      code: "SERVICE_UNAVAILABLE",
      message: "Impossibile leggere i preventivi",
    };
  }

  const fatturato = round2(
    fattureResult.data.reduce((sum, row) => sum + row.totale, 0),
  );
  const incassato = round2(
    fattureResult.data.reduce((sum, row) => sum + row.totalePagato, 0),
  );
  const preventiviEmessiRows = preventiviResult.data.filter(
    (row) => row.stato === "APPROVATO" || row.stato === "RIFIUTATO",
  );
  const preventiviApprovatiRows = preventiviResult.data.filter(
    (row) => row.stato === "APPROVATO",
  );
  const preventiviEmessi = preventiviEmessiRows.length;
  const preventiviApprovati = preventiviApprovatiRows.length;
  const tassoApprovazione =
    preventiviEmessi === 0
      ? 0
      : round2((preventiviApprovati / preventiviEmessi) * 100);
  const costiPreventiviApprovati = round2(
    preventiviApprovatiRows.reduce((sum, row) => sum + row.totale, 0),
  );
  const margine = round2(fatturato - costiPreventiviApprovati);

  return {
    ok: true,
    data: {
      fatturato,
      incassato,
      margine,
      preventiviEmessi,
      preventiviApprovati,
      tassoApprovazione,
    },
  };
}

export {
  getReportFinanziari,
  getReportRiparazioni,
  type GetReportFinanziariInput,
  type GetReportFinanziariResult,
  type GetReportRiparazioniInput,
  type GetReportRiparazioniResult,
};
