import { Router, type Response } from "express";
import { buildErrorResponse } from "../lib/errors.js";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  createOrdineFornitore,
  type CreateOrdineFornitoreInput,
  type CreateOrdineFornitoreResult,
  receiveOrdineFornitore,
  type ReceiveOrdineFornitoreInput,
  type ReceiveOrdineFornitoreResult,
  updateOrdineFornitoreStato,
  type UpdateOrdineFornitoreStatoInput,
  type UpdateOrdineFornitoreStatoResult,
} from "../services/anagrafiche-service.js";

const ordiniRouter = Router();

type CreateOrdineFornitoreFailure = Exclude<
  CreateOrdineFornitoreResult,
  { ok: true; data: unknown }
>;
type UpdateOrdineFornitoreStatoFailure = Exclude<
  UpdateOrdineFornitoreStatoResult,
  { ok: true; data: unknown }
>;
type ReceiveOrdineFornitoreFailure = Exclude<
  ReceiveOrdineFornitoreResult,
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

function respondUpdateOrdineFornitoreStatoFailure(
  res: Response,
  result: UpdateOrdineFornitoreStatoFailure,
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

  if (result.code === "ORDINE_NOT_FOUND") {
    res
      .status(404)
      .json(buildErrorResponse("ORDINE_NOT_FOUND", "ORDINE_NOT_FOUND"));
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

function respondReceiveOrdineFornitoreFailure(
  res: Response,
  result: ReceiveOrdineFornitoreFailure,
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

  if (result.code === "ORDINE_NOT_FOUND") {
    res
      .status(404)
      .json(buildErrorResponse("ORDINE_NOT_FOUND", "ORDINE_NOT_FOUND"));
    return;
  }

  if (result.code === "ARTICOLO_NOT_FOUND") {
    res
      .status(404)
      .json(buildErrorResponse("ARTICOLO_NOT_FOUND", "ARTICOLO_NOT_FOUND"));
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

ordiniRouter.patch("/:id/stato", authenticate, async (req, res) => {
  const payload: UpdateOrdineFornitoreStatoInput = {
    actorUserId: req.user?.userId,
    actorRole: req.user?.role,
    ordineId: req.params?.id,
    stato: req.body?.stato,
  };

  const result = await updateOrdineFornitoreStato(payload);
  if (!result.ok) {
    respondUpdateOrdineFornitoreStatoFailure(res, result);
    return;
  }

  res.status(200).json({ data: result.data });
});

ordiniRouter.post("/:id/ricevi", authenticate, authorize("ADMIN"), async (req, res) => {
  const payload: ReceiveOrdineFornitoreInput = {
    actorUserId: req.user?.userId,
    ordineId: req.params?.id,
    voci: req.body?.voci,
  };

  const result = await receiveOrdineFornitore(payload);
  if (!result.ok) {
    respondReceiveOrdineFornitoreFailure(res, result);
    return;
  }

  res.status(200).json({ data: result.data });
});

export { ordiniRouter };
