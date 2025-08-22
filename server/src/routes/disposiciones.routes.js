import { Router } from "express";
import { createDisposicion, getDisposiciones } from "../controllers/disposiciones.controller.js";

const r = Router();
r.post("/", createDisposicion); // POST /api/disposiciones
r.get("/listar-disposiciones", getDisposiciones); // GET /api/disposiciones


export default r;
