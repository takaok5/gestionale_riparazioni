import { Router, type Response } from "express";
import { buildErrorResponse } from "../lib/errors.js";
import { authenticate } from "../middleware/auth.js";
import {
  getReportRiparazioni,
  type GetReportRiparazioniInput,
  type GetReportRiparazioniResult,
} from "../services/report-service.js";

const reportRouter = Router();

type GetReportRiparazioniFailure = Exclude<
  GetReportRiparazioniResult,
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

export { reportRouter };
