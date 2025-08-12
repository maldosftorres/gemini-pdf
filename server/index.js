// ============================================================
// index.js — API mínima para subir un PDF, pasarlo por Gemini
// y devolver JSON. Incluye conexión a Mongo (colección "Json").
// ------------------------------------------------------------
// NOTAS:
// - Mantengo la lógica intacta. Solo mejoro la documentación.
// - Marcados TODOs para escalar (separar en capas, validaciones, etc).
// ============================================================

import express from "express";
import cors from "cors";
import multer from "multer";
import { GoogleGenAI } from "@google/genai"; // SDK Gemini (Developer API)
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config(); // Carga variables de entorno desde .env (NO commitear claves)

// ------------------------------------------------------------
// App & Middlewares base
// ------------------------------------------------------------
const app = express();
app.use(cors()); // Habilita CORS (fronts externos pueden llamar a esta API)

// Si además vas a tener endpoints JSON "puros", descomenta:
// app.use(express.json({ limit: "10mb" }));

// ------------------------------------------------------------
// Multer en memoria: ideal para subir PDFs sin tocar disco local
// ------------------------------------------------------------
const upload = multer({
  storage: multer.memoryStorage(), // buffer en RAM (rápido, simple)
  // TODO: podés agregar filtros de tipo y size aquí por seguridad
});

// ------------------------------------------------------------
// Gemini (Developer API)
// ------------------------------------------------------------
// Requiere Node 18+ porque usa Blob nativo. Asegurate de setear key en .env:
// keygemini=TU_CLAVE
const ai = new GoogleGenAI({ apiKey: process.env.keygemini });

/**
 * Sube un PDF a la Files API de Gemini y pide extracción en JSON.
 *
 * @param {Buffer} buffer       - Contenido binario del PDF (desde multer)
 * @param {string} prompt       - Instrucción para el modelo (qué extraer)
 * @param {string} mimeType     - MIME reportado por el upload (ideal "application/pdf")
 * @param {string} originalname - Nombre de archivo original (solo para display)
 * @param {object} responseSchema - (Opcional) JSON schema para forzar formato de salida
 * @returns {Promise<string>}   - Respuesta del modelo como string JSON (o texto)
 */
async function subirYExtraerPDF(buffer, prompt, mimeType, originalname, responseSchema) {
  // 1) Buffer -> Blob (el SDK espera un Blob con type)
  const blob = new Blob([buffer], { type: mimeType || "application/pdf" });

  // 2) Subir archivo a la Files API (queda referenciable por URI temporal)
  const uploadedFile = await ai.files.upload({
    file: blob,
    config: { mimeType: blob.type, displayName: originalname },
  });

  // 3) Llamar al modelo: le pasamos el file por URI + el prompt
  const result = await ai.models.generateContent({
    model: "gemini-2.0-flash-001", // rápido y barato para extracción
    contents: [
      {
        role: "user",
        parts: [
          // Referencia al PDF subido (la IA lo "ve" vía Files API)
          { fileData: { fileUri: uploadedFile.uri, mimeType: blob.type } },
          // Prompt con lo que querés extraer
          { text: prompt || "Extrae los campos solicitados y responde exclusivamente con JSON." },
        ],
      },
    ],
    // Pedimos JSON bien formado; si además pasás un schema, mejor consistencia
    responseMimeType: "application/json",
    ...(responseSchema ? { responseSchema } : {}),
  });

  // OJO: result.text ya debería venir en JSON si el modelo respetó responseMimeType
  return result.text;
}

// ------------------------------------------------------------
// MongoDB (colección "Json") — almacenamiento auxiliar
// ------------------------------------------------------------
// Esquema flexible: guarda el JSON devuelto y el prompt usado
const jsonSchema = new mongoose.Schema({
  json: mongoose.Schema.Types.Mixed, // Mixed = lo que venga
  prompt: String,
});

// Model con nombre lógico "Json" y colección forzada "Json"
const JsonModel = mongoose.model("Json", jsonSchema, "Json");

/**
 * Conecta a Mongo usando MONGODB_URI de .env
 * Si no hay URI, solo loguea y sigue (útil para dev rápido).
 * TODO: mover a /config/db.js cuando escales el proyecto.
 */
async function conectarMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("[WARN] MONGODB_URI no está definido en .env. Saltando conexión a Mongo.");
    return;
  }
  try {
    // Nota: flags useNewUrlParser/useUnifiedTopology son históricos;
    // en Mongoose 7+ no son necesarios. Los mantengo por compatibilidad.
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("✅ Conectado a MongoDB");
  } catch (error) {
    console.error("❌ Error al conectar a MongoDB:", error);
  }
}

conectarMongo().catch((err) => console.error("Error MongoDB:", err));

// ------------------------------------------------------------
// Rutas HTTP
// ------------------------------------------------------------

/**
 * POST /api/upload
 * Recibe un PDF (campo "pdfFile") + campos de texto (prompt, responseSchema)
 * - Sube el archivo a Gemini
 * - Pide extracción con el prompt
 * - Devuelve JSON (o "raw" si el modelo no cumplió)
 *
 * Form-Data esperado:
 * - pdfFile: (file) el PDF
 * - prompt: (text) instrucciones para extraer
 * - responseSchema: (text, opcional) JSON.stringify de un JSON Schema
 */
app.post("/api/upload", upload.single("pdfFile"), async (req, res) => {
  try {
    // Validación mínima de archivo
    if (!req.file) {
      return res.status(400).json({ error: "No se recibió archivo 'pdfFile'" });
    }

    const { buffer, mimetype, originalname } = req.file;
    const { prompt, responseSchema: schemaFromFront } = req.body;

    // Parseo defensivo del schema que mande el front (si viene)
    let responseSchema;
    if (schemaFromFront) {
      try {
        responseSchema = JSON.parse(schemaFromFront);
      } catch (_) {
        console.warn("[WARN] responseSchema no es JSON válido, se ignora");
      }
    }

    // Llamada principal a Gemini (sube archivo + extracción)
    const output = await subirYExtraerPDF(buffer, prompt, mimetype, originalname, responseSchema);

    // A veces los modelos devuelven ```json ... ```
    // Sanitizamos para poder hacer JSON.parse sin drama.
    const stripFences = (s) => String(s)
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    // Intentamos parsear JSON. Si no es válido, devolvemos raw.
    let payload;
    try {
      payload = JSON.parse(stripFences(output));
    } catch {
      payload = { raw: stripFences(output) };
    }

    // TODO (opcional): persistir en Mongo el resultado y el prompt:
    // await JsonModel.create({ json: payload, prompt });

    // Entregamos al front el JSON final (o raw)
    return res.json(payload);
  } catch (error) {
    console.error("Error en /api/upload:", error);
    return res.status(500).json({ error: error.message || "Error interno" });
  }
});

/**
 * GET /api/json
 * Ejemplo de lectura rápida desde Mongo (colección "Json").
 * Útil para verificar que se esté guardando algo.
 * TODO: eliminar o proteger con auth si no lo usás en prod.
 */
app.get("/api/json", async (req, res) => {
  try {
    const doc = await JsonModel.findOne();
    return res.json(doc);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ------------------------------------------------------------
// Server Boot
// ------------------------------------------------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Backend escuchando en http://localhost:${PORT}`);
});


// ============================================================
// TODOs sugeridos para el siguiente sprint (sin romper nada):
// - Separar capas: /config, /routes, /services, /models.
// - Validar tamaño/tipo de archivo en multer (seguridad).
// - Agregar auth/JWT si esto va a internet público.
// - Si vas a insertar en "Disposiciones", crear endpoint POST
//   que reciba el objeto final y lo persista (modelo aparte).
// - Manejar timeouts/reintentos al llamar a Gemini.
// ============================================================
