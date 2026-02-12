import { Router, type Response } from "express";
import { buildErrorResponse } from "../lib/errors.js";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  createArticolo,
  type CreateArticoloInput,
  type CreateArticoloResult,
} from "../services/anagrafiche-service.js";

const articoliRouter = Router();

type CreateArticoloFailure = Exclude<
  CreateArticoloResult,
  { ok: true; data: unknown }
>;

function respondCreateArticoloFailure(
  res: Response,
  result: CreateArticoloFailure,
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

  if (result.code === "CODICE_ARTICOLO_EXISTS") {
    res
      .status(409)
      .json(
        buildErrorResponse(
          "CODICE_ARTICOLO_EXISTS",
          "Codice articolo gia esistente",
        ),
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

articoliRouter.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  async (req, res) => {
    const payload: CreateArticoloInput = {
      actorUserId: req.user?.userId,
      codiceArticolo: req.body?.codiceArticolo,
      nome: req.body?.nome,
      descrizione: req.body?.descrizione,
      categoria: req.body?.categoria,
      fornitoreId: req.body?.fornitoreId,
      prezzoAcquisto: req.body?.prezzoAcquisto,
      prezzoVendita: req.body?.prezzoVendita,
      sogliaMinima: req.body?.sogliaMinima,
    };

    const result = await createArticolo(payload);
    if (!result.ok) {
      respondCreateArticoloFailure(res, result);
      return;
    }

    res.status(201).json(result.data);
  },
);

export { articoliRouter };
