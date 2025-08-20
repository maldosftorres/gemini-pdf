import { deleteFile, extractFromPDF, getFileInfo, listFiles } from "../services/gemini.service.js";
import { stripCodeFences } from "../utils/parse.js";

export async function uploadHandler(req, res, next) {
    try {
        if (!req.file) return res.status(400).json({ error: "Falta 'pdfFile'" });

        // const { prompt, responseSchema: rawSchema } = req.body;
        const { prompt } = req.body;

        if (!prompt) return res.status(400).json({ error: "Falta 'prompt'" });
        // if (!rawSchema) return res.status(400).json({ error: "Falta 'SchemaJson'" });

        // let responseSchema;
        // if (rawSchema) { try { responseSchema = JSON.parse(rawSchema); } catch { /* ignora schema inválido */ } }

        const text = await extractFromPDF({
            buffer: req.file.buffer,
            mimeType: req.file.mimetype,
            originalname: req.file.originalname,
            prompt,
            // responseSchema
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

// GET /file/:fileId  (metadata + re-extract opcional)
export async function getFileInfoHandler(req, res, next) {
    try {
        const { fileId } = req.params;
        if (!fileId) return res.status(400).json({ error: "Falta 'fileId'" });

        const fileInfo = await getFileInfo(fileId);

        const reextract = String(req.query.reextract ?? "false").toLowerCase() === "true";
        if (!reextract) return res.json({ fileInfo, reextracted: false });

        const extracted = await extractFromPDF({
            buffer: null,
            fileUri: fileInfo.uri,
            mimeType: fileInfo.mimeType,
            prompt: req.body?.prompt || "Extrae los campos solicitados y responde exclusivamente con JSON.",
            responseSchema: req.body?.responseSchema || null,
        });

        return res.json({
            fileInfo,
            extractedData: extracted.data ?? extracted.text,
            reextracted: true,
        });
    } catch (err) {
        next(err);
    }
}

// GET /  (listar)
export async function listFilesHandler(req, res, next) {
    try {
        const pageSize = Number(req.query.pageSize ?? 25);
        const files = await listFiles(pageSize);
        return res.json({ files });
    } catch (err) {
        next(err);
    }
}

// DELETE /file/:fileId
export async function deleteFileHandler(req, res, next) {
    try {
        const { fileId } = req.params;
        if (!fileId) return res.status(400).json({ error: "Falta 'fileId'" });

        const out = await deleteFile(fileId);
        return res.json(out); // { ok: true, deleted: "files/xxx" }
    } catch (err) {
        next(err);
    }
}

