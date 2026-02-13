import { Router, type Response } from "express";
import { buildErrorResponse } from "../lib/errors.js";
import { authenticate } from "../middleware/auth.js";
import {
  getReportExportFinanziari,
  getReportExportMagazzino,
  getReportExportRiparazioni,
  type GetReportExportFinanziariInput,
  type GetReportExportFinanziariResult,
  type GetReportExportMagazzinoInput,
  type GetReportExportMagazzinoResult,
  type GetReportExportRiparazioniInput,
  type GetReportExportRiparazioniResult,
  getReportFinanziari,
  getReportMagazzino,
  type GetReportFinanziariInput,
  type GetReportFinanziariResult,
  type GetReportMagazzinoInput,
  type GetReportMagazzinoResult,
  getReportRiparazioni,
  type GetReportRiparazioniInput,
  type GetReportRiparazioniResult,
} from "../services/report-service.js";

const reportRouter = Router();

type GetReportRiparazioniFailure = Exclude<
  GetReportRiparazioniResult,
  { ok: true; data: unknown }
>;
type GetReportFinanziariFailure = Exclude<
  GetReportFinanziariResult,
  { ok: true; data: unknown }
>;
type GetReportMagazzinoFailure = Exclude<
  GetReportMagazzinoResult,
  { ok: true; data: unknown }
>;
type GetReportExportRiparazioniFailure = Exclude<
  GetReportExportRiparazioniResult,
  { ok: true; data: unknown }
>;
type GetReportExportFinanziariFailure = Exclude<
  GetReportExportFinanziariResult,
  { ok: true; data: unknown }
>;
type GetReportExportMagazzinoFailure = Exclude<
  GetReportExportMagazzinoResult,
  { ok: true; data: unknown }
>;

function respondReportRiparazioniFailure(
  result: GetReportRiparazioniFailure,
  res: Response,
): void {
  if (result.code === "VALIDATION_ERROR") {
    res
      .status(400)
      .json(buildErrorResponse("VALIDATION_ERROR", result.message, result.details));
    return;
  }
  if (result.code === "FORBIDDEN") {
    res
      .status(403)
      .json(buildErrorResponse("FORBIDDEN", result.message));
    return;
  }
  res
    .status(500)
    .json(buildErrorResponse("REPORT_SERVICE_UNAVAILABLE", result.message));
}

function respondReportFinanziariFailure(
  result: GetReportFinanziariFailure,
  res: Response,
): void {
  if (result.code === "VALIDATION_ERROR") {
    res
      .status(400)
      .json(buildErrorResponse("VALIDATION_ERROR", result.message, result.details));
    return;
  }
  if (result.code === "FORBIDDEN") {
    res
      .status(403)
      .json(buildErrorResponse("FORBIDDEN", result.message));
    return;
  }
  res
    .status(500)
    .json(buildErrorResponse("REPORT_SERVICE_UNAVAILABLE", result.message));
}

function respondReportMagazzinoFailure(
  result: GetReportMagazzinoFailure,
  res: Response,
): void {
  if (result.code === "VALIDATION_ERROR") {
    res
      .status(400)
      .json(buildErrorResponse("VALIDATION_ERROR", result.message, result.details));
    return;
  }
  if (result.code === "FORBIDDEN") {
    res
      .status(403)
      .json(buildErrorResponse("FORBIDDEN", result.message));
    return;
  }
  res
    .status(500)
    .json(buildErrorResponse("REPORT_SERVICE_UNAVAILABLE", result.message));
}

function respondExportFailure(
  result:
    | GetReportExportRiparazioniFailure
    | GetReportExportFinanziariFailure
    | GetReportExportMagazzinoFailure,
  res: Response,
): void {
  if (result.code === "VALIDATION_ERROR") {
    res
      .status(400)
      .json(buildErrorResponse("VALIDATION_ERROR", result.message, result.details));
    return;
  }
  if (result.code === "FORBIDDEN") {
    res
      .status(403)
      .json(buildErrorResponse("FORBIDDEN", result.message));
    return;
  }
  res
    .status(500)
    .json(buildErrorResponse("REPORT_SERVICE_UNAVAILABLE", result.message));
}

reportRouter.get("/riparazioni", authenticate, async (req, res) => {
  const payload: GetReportRiparazioniInput = {
    actorUserId: req.user?.userId,
    actorRole: req.user?.role,
    tecnicoId: req.query.tecnicoId,
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo,
  };

  const result = await getReportRiparazioni(payload);
  if (!result.ok) {
    respondReportRiparazioniFailure(result, res);
    return;
  }

  res.status(200).json(result.data);
});

reportRouter.get("/finanziari", authenticate, async (req, res) => {
  const payload: GetReportFinanziariInput = {
    actorUserId: req.user?.userId,
    actorRole: req.user?.role,
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo,
  };

  const result = await getReportFinanziari(payload);
  if (!result.ok) {
    respondReportFinanziariFailure(result, res);
    return;
  }

  res.status(200).json(result.data);
});

reportRouter.get("/magazzino", authenticate, async (req, res) => {
  const payload: GetReportMagazzinoInput = {
    actorUserId: req.user?.userId,
    actorRole: req.user?.role,
  };

  const result = await getReportMagazzino(payload);
  if (!result.ok) {
    respondReportMagazzinoFailure(result, res);
    return;
  }

  res.status(200).json(result.data);
});

reportRouter.get("/export/riparazioni", authenticate, async (req, res) => {
  const payload: GetReportExportRiparazioniInput = {
    actorUserId: req.user?.userId,
    actorRole: req.user?.role,
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo,
  };

  const result = await getReportExportRiparazioni(payload);
  if (!result.ok) {
    respondExportFailure(result, res);
    return;
  }

  res.setHeader("Content-Type", result.data.contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${result.data.fileName}"`);
  res.status(200).send(result.data.csv);
});

reportRouter.get("/export/finanziari", authenticate, async (req, res) => {
  const payload: GetReportExportFinanziariInput = {
    actorUserId: req.user?.userId,
    actorRole: req.user?.role,
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo,
  };

  const result = await getReportExportFinanziari(payload);
  if (!result.ok) {
    respondExportFailure(result, res);
    return;
  }

  res.setHeader("Content-Type", result.data.contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${result.data.fileName}"`);
  res.status(200).send(result.data.csv);
});

reportRouter.get("/export/magazzino", authenticate, async (req, res) => {
  const payload: GetReportExportMagazzinoInput = {
    actorUserId: req.user?.userId,
    actorRole: req.user?.role,
  };

  const result = await getReportExportMagazzino(payload);
  if (!result.ok) {
    respondExportFailure(result, res);
    return;
  }

  res.setHeader("Content-Type", result.data.contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${result.data.fileName}"`);
  res.status(200).send(result.data.csv);
});

export { reportRouter };
