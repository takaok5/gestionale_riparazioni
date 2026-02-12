import { Router, type Response } from "express";
import { buildErrorResponse } from "../lib/errors.js";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  createOrdineFornitore,
  type CreateOrdineFornitoreInput,
  type CreateOrdineFornitoreResult,
} from "../services/anagrafiche-service.js";

const ordiniRouter = Router();

type CreateOrdineFornitoreFailure = Exclude<
  CreateOrdineFornitoreResult,
  { ok: true; data: unknown }
>;

function respondCreateOrdineFornitoreFailure(
  res: Response,
  result: CreateOrdineFornitoreFailure,
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

  if (result.code === "FORNITORE_NOT_FOUND") {
    res
      .status(404)
      .json(buildErrorResponse("FORNITORE_NOT_FOUND", "FORNITORE_NOT_FOUND"));
    return;
  }

  if (result.code === "ARTICOLO_NOT_FOUND") {
    res
      .status(404)
      .json(buildErrorResponse("ARTICOLO_NOT_FOUND", result.message));
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

ordiniRouter.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  async (req, res) => {
    const payload: CreateOrdineFornitoreInput = {
      actorUserId: req.user?.userId,
      fornitoreId: req.body?.fornitoreId,
      voci: req.body?.voci,
    };

    const result = await createOrdineFornitore(payload);
    if (!result.ok) {
      respondCreateOrdineFornitoreFailure(res, result);
      return;
    }

    res.status(201).json(result.data);
  },
);

export { ordiniRouter };
