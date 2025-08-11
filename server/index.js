import express from "express";
import cors from "cors";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

// --- App & Middleware ---
const app = express();
app.use(cors());
// Si también recibes JSON en otras rutas, habilita esto:
// app.use(express.json());

// Multer en memoria: NO crea carpetas locales
const upload = multer({ storage: multer.memoryStorage() });

// --- Gemini (Developer API) ---
// Asegúrate de tener Node 18+ (Blob nativo)
const ai = new GoogleGenAI({ apiKey: process.env.keygemini });

async function subirYExtraerPDF(buffer, prompt, mimeType, originalname, responseSchema) {
  // 1) Buffer -> Blob (el SDK infiere size y mime a partir del Blob)
  const blob = new Blob([buffer], { type: mimeType || "application/pdf" });

  // 2) Subir archivo a Files API
  const uploadedFile = await ai.files.upload({
    file: blob,
    config: { mimeType: blob.type, displayName: originalname },
  });

  // 3) Llamada al modelo referenciando la URI del archivo
  const result = await ai.models.generateContent({
    model: "gemini-2.0-flash-001",
    contents: [
      {
        role: "user",
        parts: [
          // Referencia al PDF subido
          { fileData: { fileUri: uploadedFile.uri, mimeType: blob.type } },
          // Tu prompt
          { text: (prompt || "Extrae los campos solicitados y responde exclusivamente con JSON.") },
        ],
      },
    ],
    // Forzamos salida JSON válida; si mandas un schema, úsalo aquí
    responseMimeType: "application/json",
    ...(responseSchema ? { responseSchema } : {}),
  });

  return result.text; // será JSON string si responseMimeType es application/json
}

// --- MongoDB Setup ---
const jsonSchema = new mongoose.Schema({
  json: mongoose.Schema.Types.Mixed,
  prompt: String,
});

const JsonModel = mongoose.model("Json", jsonSchema, "Json");

async function conectarMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("[WARN] MONGODB_URI no está definido en .env. Saltando conexión a Mongo.");
    return;
  }
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conectado a MongoDB");
    // Ejemplo de lectura (opcional)
    // const doc = await JsonModel.findOne();
    // console.log("Documento en MongoDB:", doc);
  } catch (error) {
    console.error("Error al conectar a MongoDB:", error);
  }
}

conectarMongo().catch((err) => console.error("Error MongoDB:", err));

// --- Rutas ---
app.post("/api/upload", upload.single("pdfFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se recibió archivo 'pdfFile'" });
    }

    const { buffer, mimetype, originalname } = req.file;
    const { prompt, responseSchema: schemaFromFront } = req.body;

    // Parsear schema enviado desde el front (si existe)
    let responseSchema;
    if (schemaFromFront) {
      try {
        responseSchema = JSON.parse(schemaFromFront);
      } catch (_) {
        console.warn("responseSchema no es JSON válido, se ignora");
      }
    }

    const output = await subirYExtraerPDF(buffer, prompt, mimetype, originalname, responseSchema);

    const stripFences = (s) => String(s)
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    let payload;
    try {
      payload = JSON.parse(stripFences(output));
    } catch {
      payload = { raw: stripFences(output) };
    }

    return res.json(payload);
  } catch (error) {
    console.error("Error en /api/upload:", error);
    return res.status(500).json({ error: error.message || "Error interno" });
  }
});


app.get("/api/json", async (req, res) => {
  try {
    const doc = await JsonModel.findOne();
    return res.json(doc);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// --- Server ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend escuchando en http://localhost:${PORT}`));
