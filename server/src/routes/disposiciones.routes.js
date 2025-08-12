import { Router } from "express";
import { createDisposicion } from "../controllers/disposiciones.controller.js";

const r = Router();
r.post("/", createDisposicion); // POST /api/disposiciones

export default r;
