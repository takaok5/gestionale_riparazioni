import { Router, type Response } from "express";
import { buildErrorResponse } from "../lib/errors.js";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  listAuditLogs,
  type ListAuditLogsInput,
  type ListAuditLogsResult,
} from "../services/anagrafiche-service.js";

const auditLogRouter = Router();

type ListAuditLogsFailure = Exclude<ListAuditLogsResult, { ok: true; data: unknown }>;

function respondListAuditLogsFailure(
  res: Response,
  result: ListAuditLogsFailure,
): void {
  if (result.code === "VALIDATION_ERROR") {
    res
      .status(400)
      .json(
        buildErrorResponse("VALIDATION_ERROR", "Payload non valido", result.details),
      );
    return;
  }

  res
    .status(500)
    .json(
      buildErrorResponse(
        "ANAGRAFICHE_SERVICE_UNAVAILABLE",
        "Servizio anagrafiche non disponibile",
      ),
    );
}

auditLogRouter.get("/", authenticate, authorize("ADMIN"), async (req, res) => {
  const payload: ListAuditLogsInput = {
    modelName: req.query.modelName,
    page: req.query.page,
  };

  const result = await listAuditLogs(payload);
  if (!result.ok) {
    respondListAuditLogsFailure(res, result);
    return;
  }

  res.status(200).json(result.data);
});

export { auditLogRouter };
