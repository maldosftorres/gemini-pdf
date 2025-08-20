// src/routes/upload.routes.js
import { Router } from "express";
import { uploadMemory } from "../middlewares/upload.middleware.js";
import { uploadHandler, getFileInfoHandler, listFilesHandler, deleteFileHandler } from "../controllers/upload.controller.js";

const r = Router();

// Subida (con ?extract=true|false)
r.post("/", uploadMemory.single("pdfFile"), uploadHandler);

// Listar archivos
r.get("/list", listFilesHandler);

// Metadata de un archivo (con ?reextract=true para re-analizar)
r.get("/:fileId", getFileInfoHandler);

// Eliminar un archivo
r.delete("/:fileId", deleteFileHandler);


export default r;

