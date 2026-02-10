import { Router, type Response } from "express";
import { buildErrorResponse } from "../lib/errors.js";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  createUser,
  type CreateUserInput,
  type CreateUserResult,
} from "../services/users-service.js";

const usersRouter = Router();

function respondCreateUserFailure(
  res: Response,
  result: Exclude<CreateUserResult, { ok: true; data: unknown }>,
): void {
  if (result.code === "USERNAME_EXISTS") {
    res
      .status(409)
      .json(buildErrorResponse("USERNAME_EXISTS", "Username gia' esistente"));
    return;
  }

  if (result.code === "EMAIL_EXISTS") {
    res.status(409).json(buildErrorResponse("EMAIL_EXISTS", "Email gia' esistente"));
    return;
  }

  res
    .status(400)
    .json(
      buildErrorResponse("VALIDATION_ERROR", "Payload non valido", result.details),
    );
}

usersRouter.post("/", authenticate, authorize("ADMIN"), async (req, res) => {
  const payload: CreateUserInput = {
    username: req.body?.username,
    email: req.body?.email,
    password: req.body?.password,
    role: req.body?.role,
  };

  let result: CreateUserResult;
  try {
    result = await createUser(payload);
  } catch (error) {
    if (error instanceof Error && error.message === "JWT_SECRET_MISSING") {
      res
        .status(500)
        .json(buildErrorResponse("JWT_SECRET_MISSING", "JWT_SECRET non configurato"));
      return;
    }

    res
      .status(500)
      .json(
        buildErrorResponse(
          "USERS_SERVICE_UNAVAILABLE",
          "Servizio utenti non disponibile",
        ),
      );
    return;
  }

  if (!result.ok) {
    respondCreateUserFailure(res, result);
    return;
  }

  res.status(201).json(result.data);
});

export { usersRouter };
