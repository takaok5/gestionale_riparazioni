import { Router, type Response } from "express";
import { buildErrorResponse } from "../lib/errors.js";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  updateFornitore,
  type UpdateFornitoreInput,
  type UpdateFornitoreResult,
} from "../services/anagrafiche-service.js";

const fornitoriRouter = Router();

type UpdateFornitoreFailure = Exclude<
  UpdateFornitoreResult,
  { ok: true; data: unknown }
>;

function respondUpdateFornitoreFailure(
  res: Response,
  result: UpdateFornitoreFailure,
): void {
  if (result.code === "VALIDATION_ERROR") {
    res
      .status(400)
      .json(
        buildErrorResponse("VALIDATION_ERROR", "Payload non valido", result.details),
      );
    return;
  }

  if (result.code === "NOT_FOUND") {
    res
      .status(404)
      .json(buildErrorResponse("FORNITORE_NOT_FOUND", "Fornitore non trovato"));
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

fornitoriRouter.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  async (req, res) => {
    const payload: UpdateFornitoreInput = {
      actorUserId: req.user?.userId,
      fornitoreId: req.params.id,
      ragioneSociale: req.body?.ragioneSociale,
      telefono: req.body?.telefono,
    };

    const result = await updateFornitore(payload);
    if (!result.ok) {
      respondUpdateFornitoreFailure(res, result);
      return;
    }

    res.status(200).json(result.data);
  },
);

export { fornitoriRouter };
