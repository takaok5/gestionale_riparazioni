import { Router, type Response } from "express";
import { buildErrorResponse } from "../lib/errors.js";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  createFornitore,
  type CreateFornitoreInput,
  type CreateFornitoreResult,
  listFornitori,
  type ListFornitoriInput,
  type ListFornitoriResult,
  updateFornitore,
  type UpdateFornitoreInput,
  type UpdateFornitoreResult,
} from "../services/anagrafiche-service.js";

const fornitoriRouter = Router();

type CreateFornitoreFailure = Exclude<
  CreateFornitoreResult,
  { ok: true; data: unknown }
>;

type UpdateFornitoreFailure = Exclude<
  UpdateFornitoreResult,
  { ok: true; data: unknown }
>;

type ListFornitoriFailure = Exclude<
  ListFornitoriResult,
  { ok: true; data: unknown }
>;

function respondCreateFornitoreFailure(
  res: Response,
  result: CreateFornitoreFailure,
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

  if (result.code === "PARTITA_IVA_EXISTS") {
    res
      .status(409)
      .json(
        buildErrorResponse("PARTITA_IVA_EXISTS", "Partita IVA gia esistente"),
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

function respondListFornitoriFailure(
  res: Response,
  result: ListFornitoriFailure,
): void {
  if (result.code === "VALIDATION_ERROR") {
    res
      .status(400)
      .json(
        buildErrorResponse(
          "VALIDATION_ERROR",
          result.message ?? "Parametri query non validi",
          result.details,
        ),
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

fornitoriRouter.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  async (req, res) => {
    const payload: ListFornitoriInput = {
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      categoria: req.query.categoria,
    };

    const result = await listFornitori(payload);
    if (!result.ok) {
      respondListFornitoriFailure(res, result);
      return;
    }

    res.status(200).json(result.data);
  },
);

fornitoriRouter.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  async (req, res) => {
    const payload: CreateFornitoreInput = {
      actorUserId: req.user?.userId,
      nome: req.body?.nome,
      categoria: req.body?.categoria,
      partitaIva: req.body?.partitaIva,
      telefono: req.body?.telefono,
      email: req.body?.email,
      indirizzo: req.body?.indirizzo,
      cap: req.body?.cap,
      citta: req.body?.citta,
      provincia: req.body?.provincia,
    };

    const result = await createFornitore(payload);
    if (!result.ok) {
      respondCreateFornitoreFailure(res, result);
      return;
    }

    res.status(201).json(result.data);
  },
);

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
