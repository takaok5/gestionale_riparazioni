import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { listNotifiche } from "../services/notifiche-service.js";

const notificheRouter = Router();

notificheRouter.get("/", authenticate, authorize("ADMIN"), async (req, res) => {
  const result = await listNotifiche({
    page: req.query.page,
    limit: req.query.limit,
    tipo: req.query.tipo,
    stato: req.query.stato,
  });

  res.status(200).json({
    data: result.data,
    meta: result.meta,
  });
});

export { notificheRouter };
