import { Router } from "express";
import { uploadMemory } from "../middlewares/upload.middleware.js";
import { getFileInfoHandler, uploadHandler } from "../controllers/upload.controller.js";

const r = Router();
r.post("/", uploadMemory.single("pdfFile"), uploadHandler);
r.get("/file/:fileId", getFileInfoHandler);


export default r;
