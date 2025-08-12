import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";

// Requiere Node 18+ (Blob nativo)
const ai = new GoogleGenAI({ apiKey: env.GEMINI_KEY });

/**
 * Sube PDF a Files API y solicita extracción en JSON.
 */
export async function extractFromPDF({ buffer, mimeType = "application/pdf", originalname, prompt, responseSchema }) {
    const blob = new Blob([buffer], { type: mimeType });

    const uploaded = await ai.files.upload({
        file: blob,
        config: { mimeType, displayName: originalname }
    });

    const result = await ai.models.generateContent({
        model: "gemini-2.0-flash-001",
        contents: [{
            role: "user",
            parts: [
                { fileData: { fileUri: uploaded.uri, mimeType } },
                { text: prompt || "Extrae los campos solicitados y responde exclusivamente con JSON." }
            ]
        }],
        responseMimeType: "application/json",
        ...(responseSchema ? { responseSchema } : {})
    });

    return result.text; // idealmente JSON string
}
