import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";

const ai = new GoogleGenAI({ apiKey: env.GEMINI_KEY });

export async function extractFromPDF({
    buffer,
    fileUri,
    mimeType = "application/pdf",
    originalname,
    prompt,
    responseSchema,
}) {
    let fileId;

    if (!fileUri) {
        // Subir el archivo si no se proporciona fileUri
        const blob = new Blob([buffer], { type: mimeType });

        const file = await ai.files.upload({
            file: blob,
            config: { mimeType, displayName: originalname },
        });

        fileId = file.name; // "files/xxxx"
        fileUri = file.uri; // para el prompt
    }

    // Usar el archivo existente o recién subido
    const result = await ai.models.generateContent({
        model: "gemini-2.0-flash-001",
        contents: [{
            role: "user",
            parts: [
                { fileData: { fileUri: fileUri, mimeType } },
                { text: prompt || "Extrae los campos solicitados y responde exclusivamente con JSON." }
            ]
        }],
        responseMimeType: "application/json",
        ...(responseSchema ? { responseSchema } : {}),
    });

    return {
        text: result.text, // Datos extraídos
        file: {
            id: fileId, // Solo si se subió un archivo
            uri: fileUri,
            mimeType,
        },
    };
}

export async function getFileInfo(fileId) {
    try {
        // Llama al servicio para obtener la información del archivo
        const fileInfo = await ai.files.get({ name: fileId });

        // Devuelve la información relevante del archivo
        return {
            id: fileInfo.name,
            uri: fileInfo.uri,
            mimeType: fileInfo.mimeType,
            size: fileInfo.sizeBytes,
            createdAt: fileInfo.createTime,
            expiresAt: fileInfo.expirationTime, // Si aplica
        };
    } catch (error) {
        console.error("Error al obtener la información del archivo:", error);
        throw new Error("No se pudo obtener la información del archivo.");
    }
}
