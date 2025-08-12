import { extractFromPDF } from "../services/gemini.service.js";
import { stripCodeFences } from "../utils/parse.js";

export async function uploadHandler(req, res, next) {
    try {
        if (!req.file) return res.status(400).json({ error: "Falta 'pdfFile'" });

        const { prompt, responseSchema: rawSchema } = req.body;

        let responseSchema;
        if (rawSchema) { try { responseSchema = JSON.parse(rawSchema); } catch { /* ignora schema inválido */ } }

        const text = await extractFromPDF({
            buffer: req.file.buffer,
            mimeType: req.file.mimetype,
            originalname: req.file.originalname,
            prompt,
            responseSchema
        });

        let payload;
        try { payload = JSON.parse(stripCodeFences(text)); }
        catch { payload = { raw: stripCodeFences(text) }; }

        res.json(payload);
    } catch (err) {
        next(err);
    }
}
