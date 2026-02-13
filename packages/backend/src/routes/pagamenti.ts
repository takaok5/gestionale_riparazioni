import { Router, type Response } from "express";
import { buildErrorResponse } from "../lib/errors.js";
import { authenticate } from "../middleware/auth.js";
import {
  createStripeCheckoutLink,
  type CreateStripeCheckoutLinkInput,
  type CreateStripeCheckoutLinkResult,
} from "../services/fatture-service.js";

const pagamentiRouter = Router();

type CreateStripeCheckoutLinkFailure = Exclude<
  CreateStripeCheckoutLinkResult,
  { ok: true; data: unknown }
>;

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

function respondCreateStripeCheckoutLinkFailure(
  res: Response,
  result: CreateStripeCheckoutLinkFailure,
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
      .json(buildErrorResponse("FATTURA_NOT_FOUND", "Fattura non trovata"));
    return;
  }

  if (result.code === "INVOICE_ALREADY_PAID") {
    res
      .status(400)
      .json(buildErrorResponse("INVOICE_ALREADY_PAID", "Invoice is already paid"));
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

pagamentiRouter.post("/crea-link/:fatturaId", authenticate, async (req, res) => {
  if (!ensureCommercialeRole(res, req.user?.role)) {
    return;
  }

  const payload: CreateStripeCheckoutLinkInput = {
    fatturaId: req.params.fatturaId,
  };

  const result = await createStripeCheckoutLink(payload);
  if (!result.ok) {
    respondCreateStripeCheckoutLinkFailure(res, result);
    return;
  }

  res.status(200).json(result.data);
});

export { pagamentiRouter };
