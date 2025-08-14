import { extractFromPDF, getFileInfo } from "../services/gemini.service.js";
import { stripCodeFences } from "../utils/parse.js";

export async function uploadHandler(req, res, next) {
    try {
        if (!req.file) return res.status(400).json({ error: "Falta 'pdfFile'" });

        const { prompt, responseSchema: rawSchema } = req.body;

        if (!prompt) return res.status(400).json({ error: "Falta 'prompt'" });
        if (!rawSchema) return res.status(400).json({ error: "Falta 'SchemaJson'" });

        let responseSchema;
        if (rawSchema) { try { responseSchema = JSON.parse(rawSchema); } catch { /* ignora schema inválido */ } }

        const text = await extractFromPDF({
            buffer: req.file.buffer,
            mimeType: req.file.mimetype,
            originalname: req.file.originalname,
            prompt,
            responseSchema
        });

        const processedText = typeof text === "string" ? stripCodeFences(text) : JSON.stringify(text);

        let payload;
        try {
            payload = JSON.parse(processedText);
        } catch {
            payload = { raw: processedText };
        }

        res.json(payload);
    } catch (err) {
        next(err);
    }
}

export async function getFileInfoHandler(req, res, next) {
    try {
        const { fileId } = req.params;

        if (!fileId) {
            return res.status(400).json({ error: "Falta 'fileId'" });
        }

        // Obtener información del archivo
        const fileInfo = await getFileInfo(fileId);

        // Regenerar datos extraídos usando extractFromPDF
        const extractedData = await extractFromPDF({
            buffer: null, // No necesitas el buffer porque ya tienes el fileUri
            mimeType: fileInfo.mimeType,
            originalname: fileInfo.id,
            prompt: "Extrae los campos solicitados y responde exclusivamente con JSON.",
            responseSchema: null, // Si tienes un esquema, pásalo aquí
        });

        // Combinar ambas respuestas
        res.json({
            fileInfo,
            extractedData: extractedData.text, // Solo los datos extraídos
        });
    } catch (err) {
        next(err);
    }
}
