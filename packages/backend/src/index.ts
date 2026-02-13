import express from "express";
import cors from "cors";
import helmet from "helmet";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { clientiRouter } from "./routes/clienti.js";
import { fornitoriRouter } from "./routes/fornitori.js";
import { ordiniRouter } from "./routes/ordini.js";
import { articoliRouter } from "./routes/articoli.js";
import { auditLogRouter } from "./routes/audit-log.js";
import { riparazioniRouter } from "./routes/riparazioni.js";
import { preventiviRouter } from "./routes/preventivi.js";
import { fattureRouter } from "./routes/fatture.js";
import { pagamentiRouter } from "./routes/pagamenti.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { reportRouter } from "./routes/report.js";
import { notificheRouter } from "./routes/notifiche.js";
import { stripeWebhooksRouter } from "./routes/stripe-webhooks.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:5173" }));
app.use("/api/webhooks/stripe", express.raw({ type: "*/*" }), stripeWebhooksRouter);
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/clienti", clientiRouter);
app.use("/api/fornitori", fornitoriRouter);
app.use("/api/ordini", ordiniRouter);
app.use("/api/articoli", articoliRouter);
app.use("/api/riparazioni", riparazioniRouter);
app.use("/api/preventivi", preventiviRouter);
app.use("/api/fatture", fattureRouter);
app.use("/api/pagamenti", pagamentiRouter);
app.use("/api/audit-log", auditLogRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/report", reportRouter);
app.use("/api/notifiche", notificheRouter);

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`); // keep
  });
}

export { app };
