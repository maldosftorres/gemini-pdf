import { Router } from "express";
import { getJsonHandler, upsertJsonHandler } from "../controllers/json.controller.js";

const r = Router();

// GET /api/json → devuelve { prompt, json } (lo que espera tu front)
r.get("/", getJsonHandler);

// Opcional: POST /api/json → crea/actualiza el único doc global
r.post("/", upsertJsonHandler);

export default r;
