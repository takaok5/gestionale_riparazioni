import { Router, type Response } from "express";
import { buildErrorResponse } from "../lib/errors.js";
import { authenticate } from "../middleware/auth.js";
import {
  createFattura,
  createPagamento,
  getFatturaDetail,
  getFatturaPdf,
  listFatture,
  type CreateFatturaInput,
  type CreateFatturaResult,
  type CreatePagamentoInput,
  type CreatePagamentoResult,
  type GetFatturaPdfInput,
  type GetFatturaPdfResult,
  type GetFatturaDetailInput,
  type GetFatturaDetailResult,
  type ListFattureInput,
  type ListFattureResult,
} from "../services/fatture-service.js";

const fattureRouter = Router();

type CreateFatturaFailure = Exclude<CreateFatturaResult, { ok: true; data: unknown }>;
type CreatePagamentoFailure = Exclude<CreatePagamentoResult, { ok: true; data: unknown }>;
type GetFatturaDetailFailure = Exclude<GetFatturaDetailResult, { ok: true; data: unknown }>;
type ListFattureFailure = Exclude<ListFattureResult, { ok: true; data: unknown }>;
type GetFatturaPdfFailure = Exclude<GetFatturaPdfResult, { ok: true; data: unknown }>;

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

function respondCreatePagamentoFailure(
  res: Response,
  result: CreatePagamentoFailure,
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

  if (result.code === "FATTURA_NOT_FOUND") {
    res
      .status(404)
      .json(
        buildErrorResponse(
          "FATTURA_NOT_FOUND",
          "Fattura non trovata",
        ),
      );
    return;
  }

  if (result.code === "OVERPAYMENT_NOT_ALLOWED") {
    res
      .status(400)
      .json(
        buildErrorResponse(
          "OVERPAYMENT_NOT_ALLOWED",
          "Total payments would exceed invoice total",
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

function respondGetFatturaDetailFailure(
  res: Response,
  result: GetFatturaDetailFailure,
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

  if (result.code === "FATTURA_NOT_FOUND") {
    res
      .status(404)
      .json(
        buildErrorResponse(
          "FATTURA_NOT_FOUND",
          "Fattura non trovata",
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

function respondListFattureFailure(
  res: Response,
  result: ListFattureFailure,
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

  res
    .status(500)
    .json(
      buildErrorResponse(
        "FATTURE_SERVICE_UNAVAILABLE",
        "Servizio fatture non disponibile",
      ),
    );
}

function respondGetFatturaPdfFailure(
  res: Response,
  result: GetFatturaPdfFailure,
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

  if (result.code === "FATTURA_NOT_FOUND") {
    res
      .status(404)
      .json(
        buildErrorResponse(
          "FATTURA_NOT_FOUND",
          "Fattura non trovata",
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

function ensureCommercialeRole(res: Response, role: string | undefined): boolean {
  if (role === "COMMERCIALE") {
    return true;
  }

  res
    .status(403)
    .json(
      buildErrorResponse(
        "FORBIDDEN",
        "Operazione consentita solo al ruolo COMMERCIALE",
      ),
    );
  return false;
}

fattureRouter.get("/", authenticate, async (req, res) => {
  if (!ensureCommercialeRole(res, req.user?.role)) {
    return;
  }

  const payload: ListFattureInput = {
    page: req.query.page,
    limit: req.query.limit,
    stato: req.query.stato,
    dataDa: req.query.dataDa,
    dataA: req.query.dataA,
  };

  const result = await listFatture(payload);
  if (!result.ok) {
    respondListFattureFailure(res, result);
    return;
  }

  res.status(200).json(result.data);
});

fattureRouter.post("/", authenticate, async (req, res) => {
  if (!ensureCommercialeRole(res, req.user?.role)) {
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

fattureRouter.post("/:id/pagamenti", authenticate, async (req, res) => {
  if (!ensureCommercialeRole(res, req.user?.role)) {
    return;
  }

  const payload: CreatePagamentoInput = {
    fatturaId: req.params.id,
    importo: req.body?.importo,
    metodo: req.body?.metodo,
    dataPagamento: req.body?.dataPagamento,
  };

  const result = await createPagamento(payload);
  if (!result.ok) {
    respondCreatePagamentoFailure(res, result);
    return;
  }

  res.status(201).json({ data: result.data });
});

fattureRouter.get("/:id/pdf", authenticate, async (req, res) => {
  if (!ensureCommercialeRole(res, req.user?.role)) {
    return;
  }

  const payload: GetFatturaPdfInput = {
    fatturaId: req.params.id,
  };

  const result = await getFatturaPdf(payload);
  if (!result.ok) {
    respondGetFatturaPdfFailure(res, result);
    return;
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=\"${result.data.fileName}\"`,
  );
  res.status(200).send(result.data.content);
});

fattureRouter.get("/:id", authenticate, async (req, res) => {
  if (!ensureCommercialeRole(res, req.user?.role)) {
    return;
  }

  const payload: GetFatturaDetailInput = {
    fatturaId: req.params.id,
  };

  const result = await getFatturaDetail(payload);
  if (!result.ok) {
    respondGetFatturaDetailFailure(res, result);
    return;
  }

  res.status(200).json({ data: result.data });
});

export { fattureRouter };
