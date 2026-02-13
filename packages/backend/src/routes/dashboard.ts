import { Router } from "express";
import { buildErrorResponse } from "../lib/errors.js";
import { authenticate } from "../middleware/auth.js";
import {
  getDashboard,
  getDashboardCaricoTecnici,
  getDashboardRiparazioniPerStato,
  type GetDashboardCaricoTecniciInput,
  type GetDashboardInput,
  type GetDashboardRiparazioniPerStatoInput,
} from "../services/dashboard-service.js";

const dashboardRouter = Router();

dashboardRouter.get("/", authenticate, async (req, res) => {
  const payload: GetDashboardInput = {
    actorUserId: req.user?.userId,
    actorRole: req.user?.role,
  };

  const result = await getDashboard(payload);
  if (!result.ok) {
    if (result.code === "VALIDATION_ERROR") {
      res
        .status(400)
        .json(buildErrorResponse("VALIDATION_ERROR", result.message));
      return;
    }
    if (result.code === "FORBIDDEN") {
      res
        .status(403)
        .json(buildErrorResponse("FORBIDDEN", result.message));
      return;
    }
    res
      .status(500)
      .json(buildErrorResponse("DASHBOARD_SERVICE_UNAVAILABLE", result.message));
    return;
  }

  res.status(200).json(result.data);
});

dashboardRouter.get("/riparazioni-per-stato", authenticate, async (req, res) => {
  const payload: GetDashboardRiparazioniPerStatoInput = {
    actorUserId: req.user?.userId,
    actorRole: req.user?.role,
    periodo: req.query.periodo,
  };

  const result = await getDashboardRiparazioniPerStato(payload);
  if (!result.ok) {
    if (result.code === "VALIDATION_ERROR") {
      res
        .status(400)
        .json(buildErrorResponse("VALIDATION_ERROR", result.message));
      return;
    }
    if (result.code === "FORBIDDEN") {
      res
        .status(403)
        .json(buildErrorResponse("FORBIDDEN", result.message));
      return;
    }
    res
      .status(500)
      .json(buildErrorResponse("DASHBOARD_SERVICE_UNAVAILABLE", result.message));
    return;
  }

  res.status(200).json(result.data);
});

dashboardRouter.get("/carico-tecnici", authenticate, async (req, res) => {
  const payload: GetDashboardCaricoTecniciInput = {
    actorUserId: req.user?.userId,
    actorRole: req.user?.role,
  };

  const result = await getDashboardCaricoTecnici(payload);
  if (!result.ok) {
    if (result.code === "VALIDATION_ERROR") {
      res
        .status(400)
        .json(buildErrorResponse("VALIDATION_ERROR", result.message));
      return;
    }
    if (result.code === "FORBIDDEN") {
      res
        .status(403)
        .json(buildErrorResponse("FORBIDDEN", result.message));
      return;
    }
    res
      .status(500)
      .json(buildErrorResponse("DASHBOARD_SERVICE_UNAVAILABLE", result.message));
    return;
  }

  res.status(200).json(result.data);
});

export { dashboardRouter };
