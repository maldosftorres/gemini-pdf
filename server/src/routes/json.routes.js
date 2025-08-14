import { Router } from "express";
import { getJsonHandler } from "../controllers/json.controller.js";

const r = Router();

// GET /api/json → devuelve { prompt, json } (lo que espera tu front)
r.get("/schema", getJsonHandler);

export default r;
