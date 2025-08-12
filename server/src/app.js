import express from "express";
import helmet from "helmet";
import cors from "cors";
import routes from "./routes/index.js";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

// Middlewares base
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: "2mb" }));

// Rutas
app.use("/api", routes);

// Manejo de errores centralizado (siempre al final)
app.use(errorHandler);

export default app;
