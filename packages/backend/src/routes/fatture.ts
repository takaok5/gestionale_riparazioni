import { Router, type Response } from "express";
import { buildErrorResponse } from "../lib/errors.js";
import { authenticate } from "../middleware/auth.js";
import {
  createFattura,
  type CreateFatturaInput,
  type CreateFatturaResult,
} from "../services/fatture-service.js";

const fattureRouter = Router();

type CreateFatturaFailure = Exclude<CreateFatturaResult, { ok: true; data: unknown }>;

function respondCreateFatturaFailure(
  res: Response,
  result: CreateFatturaFailure,
): void {
  if (result.code === "VALIDATION_ERROR") {
    res
      .status(400)
      .json(
        buildErrorResponse(
          "VALIDATION_ERROR",
          result.message ?? "Payload non valido",
          result.details,
        ),
      );
    return;
  }

  if (result.code === "NO_APPROVED_PREVENTIVO") {
    res
      .status(400)
      .json(
        buildErrorResponse(
          "NO_APPROVED_PREVENTIVO",
          "No approved preventivo found for this riparazione",
        ),
      );
    return;
  }

  if (result.code === "INVOICE_ALREADY_EXISTS") {
    res
      .status(409)
      .json(
        buildErrorResponse(
          "INVOICE_ALREADY_EXISTS",
          "Invoice already exists for this riparazione",
        ),
      );
    return;
  }

  if (result.code === "INVALID_APPROVED_PREVENTIVO") {
    res
      .status(500)
      .json(
        buildErrorResponse(
          "INVALID_APPROVED_PREVENTIVO",
          "Approved preventivo has inconsistent totals or lines",
        ),
      );
    return;
  }

  res
    .status(500)
    .json(
      buildErrorResponse(
        "FATTURE_SERVICE_UNAVAILABLE",
        "Servizio fatture non disponibile",
      ),
    );
}

fattureRouter.post("/", authenticate, async (req, res) => {
  if (req.user?.role !== "COMMERCIALE") {
    res
      .status(403)
      .json(
        buildErrorResponse(
          "FORBIDDEN",
          "Operazione consentita solo al ruolo COMMERCIALE",
        ),
      );
    return;
  }

  const payload: CreateFatturaInput = {
    riparazioneId: req.body?.riparazioneId,
  };

  const result = await createFattura(payload);
  if (!result.ok) {
    respondCreateFatturaFailure(res, result);
    return;
  }

  res.status(201).json({ data: result.data });
});

export { fattureRouter };
