import { Router, type Response } from "express";
import { buildErrorResponse } from "../lib/errors.js";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  changeOwnPassword,
  createUser,
  deactivateUser,
  updateUserRole,
  type ChangeOwnPasswordInput,
  type ChangeOwnPasswordResult,
  type CreateUserInput,
  type CreateUserResult,
  type DeactivateUserInput,
  type DeactivateUserResult,
  type UpdateUserRoleInput,
  type UpdateUserRoleResult,
} from "../services/users-service.js";

const usersRouter = Router();

type CreateUserFailure = Exclude<CreateUserResult, { ok: true; data: unknown }>;
type UserMutationFailure =
  | Exclude<UpdateUserRoleResult, { ok: true; data: unknown }>
  | Exclude<DeactivateUserResult, { ok: true; data: unknown }>;
type ChangeOwnPasswordFailure = Exclude<ChangeOwnPasswordResult, { ok: true }>;

function respondCreateUserFailure(res: Response, result: CreateUserFailure): void {
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

function respondUserMutationFailure(
  res: Response,
  result: UserMutationFailure,
): void {
  if (result.code === "VALIDATION_ERROR") {
    res
      .status(400)
      .json(
        buildErrorResponse("VALIDATION_ERROR", "Payload non valido", result.details),
      );
    return;
  }

  if (result.code === "USER_NOT_FOUND") {
    res.status(404).json(buildErrorResponse("USER_NOT_FOUND", "Utente non trovato"));
    return;
  }

  if (result.code === "LAST_ADMIN_DEACTIVATION_FORBIDDEN") {
    res
      .status(400)
      .json(
        buildErrorResponse(
          "LAST_ADMIN_DEACTIVATION_FORBIDDEN",
          "Cannot deactivate the last admin",
        ),
      );
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
}

function respondChangeOwnPasswordFailure(
  res: Response,
  result: ChangeOwnPasswordFailure,
): void {
  if (result.code === "VALIDATION_ERROR") {
    res
      .status(400)
      .json(
        buildErrorResponse("VALIDATION_ERROR", "Payload non valido", result.details),
      );
    return;
  }

  if (result.code === "USER_NOT_FOUND") {
    res.status(404).json(buildErrorResponse("USER_NOT_FOUND", "Utente non trovato"));
    return;
  }

  if (result.code === "CURRENT_PASSWORD_INCORRECT") {
    res
      .status(400)
      .json(
        buildErrorResponse(
          "CURRENT_PASSWORD_INCORRECT",
          "Current password is incorrect",
        ),
      );
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

usersRouter.put("/me/password", authenticate, async (req, res) => {
  const payload: ChangeOwnPasswordInput = {
    userId: req.user?.userId,
    currentPassword: req.body?.currentPassword,
    newPassword: req.body?.newPassword,
  };

  let result: ChangeOwnPasswordResult;
  try {
    result = await changeOwnPassword(payload);
  } catch {
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
    respondChangeOwnPasswordFailure(res, result);
    return;
  }

  res.status(200).json({ success: true });
});

usersRouter.put("/:id", authenticate, authorize("ADMIN"), async (req, res) => {
  const payload: UpdateUserRoleInput = {
    userId: req.params.id,
    role: req.body?.role,
  };

  let result: UpdateUserRoleResult;
  try {
    result = await updateUserRole(payload);
  } catch {
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
    respondUserMutationFailure(res, result);
    return;
  }

  res.status(200).json(result.data);
});

usersRouter.patch(
  "/:id/deactivate",
  authenticate,
  authorize("ADMIN"),
  async (req, res) => {
    const payload: DeactivateUserInput = {
      userId: req.params.id,
    };

    let result: DeactivateUserResult;
    try {
      result = await deactivateUser(payload);
    } catch {
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
      respondUserMutationFailure(res, result);
      return;
    }

    res.status(200).json(result.data);
  },
);

export { usersRouter };
