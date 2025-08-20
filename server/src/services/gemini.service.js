import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";

const ai = new GoogleGenAI({ apiKey: env.GEMINI_KEY });

// Normaliza: acepta "abc-123" o "files/abc-123"
function asFileName(idOrName = "") {
    return String(idOrName).startsWith("files/") ? idOrName : `files/${idOrName}`;
}

// Parse seguro para respuestas JSON
function tryParseJSON(str) {
    try { return JSON.parse(str); } catch { return str; }
}

export async function extractFromPDF({
    buffer,
    fileUri,
    mimeType = "application/pdf",
    originalname,
    prompt,
    responseSchema,
}) {
    let fileId; // "files/xxxx"

    if (!fileUri) {
        // Node 18+ tiene Blob global; si no, cambia a ReadableStream o Buffer->Blob polyfill
        const blob = new Blob([buffer], { type: mimeType });
        const file = await ai.files.upload({
            file: blob,
            config: { mimeType, displayName: originalname },
        });
        fileId = file.name;        // "files/xxxx"
        fileUri = file.uri;        // para el prompt
    }

    const result = await ai.models.generateContent({
        model: "gemini-2.0-flash-001",
        contents: [{
            role: "user",
            parts: [
                { fileData: { fileUri, mimeType } },
                { text: prompt || "Extrae los campos solicitados y responde exclusivamente con JSON." },
            ],
        }],
        responseMimeType: "application/json",
        ...(responseSchema ? { responseSchema } : {}),
    });

    // Tolerante a shape del SDK
    const rawText =
        (result?.response && typeof result.response.text === "function"
            ? result.response.text()
            : result?.text) ?? "";

    return {
        data: tryParseJSON(rawText), // <- JSON si aplica
        text: rawText,               // por si querés ver el bruto
        file: {
            id: fileId || null,        // null si usaste fileUri existente
            uri: fileUri,
            mimeType,
        },
    };
}

export async function getFileInfo(idOrName) {
    const name = asFileName(idOrName);
    try {
        const f = await ai.files.get({ name });
        return {
            id: f.name,           // "files/abc-123"
            uri: f.uri,
            mimeType: f.mimeType,
            size: f.sizeBytes,
            createdAt: f.createTime,
            expiresAt: f.expirationTime,
        };
    } catch (error) {
        // Opcional: mapear 404
        if (error?.status === 404) {
            throw new Error("Archivo no encontrado.");
        }
        console.error("getFileInfo error:", error);
        throw new Error("No se pudo obtener la información del archivo.");
    }
}

export async function listFiles(pageSize = 10) {
    try {
        const pager = await ai.files.list({ config: { pageSize } });
        let page = pager.page;
        const files = [];

        while (true) {
            for (const f of page) {
                files.push({
                    id: f.name,            // "files/abc-123"
                    uri: f.uri,
                    mimeType: f.mimeType,
                    size: f.sizeBytes,
                    createdAt: f.createTime,
                    expiresAt: f.expirationTime,
                });
            }
            if (!pager.hasNextPage()) break;
            page = await pager.nextPage();
        }
        return files;
    } catch (error) {
        console.error("listFiles error:", error);
        throw new Error("No se pudieron listar los archivos.");
    }
}

export async function deleteFile(idOrName) {
    const name = asFileName(idOrName);
    try {
        await ai.files.delete({ name });
        return { ok: true, deleted: name };
    } catch (error) {
        if (error?.status === 404) {
            throw new Error("Archivo no encontrado.");
        }
        console.error("deleteFile error:", error);
        throw new Error("No se pudo eliminar el archivo.");
    }
}


