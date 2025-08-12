import { Router } from "express";
import { uploadMemory } from "../middlewares/upload.middleware.js";
import { uploadHandler } from "../controllers/upload.controller.js";

const r = Router();
r.post("/", uploadMemory.single("pdfFile"), uploadHandler);

export default r;
