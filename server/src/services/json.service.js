import { JsonModel } from "../models/json.model.js";

/**
 * Devuelve el PRIMER documento de la colección Json.
 * (Compat con tu front: /api/json → { prompt, json })
 */
export async function getFirstJson() {
    return JsonModel.findOne().lean();
}

/**
 * Opcional: crea o actualiza el único documento "global".
 * Útil para un panel donde editás el prompt/plantilla.
 */
export async function upsertFirstJson({ prompt, json }) {
    const doc = await JsonModel.findOne();
    if (doc) {
        if (prompt !== undefined) doc.prompt = prompt;
        if (json !== undefined) doc.json = json;
        await doc.save();
        return doc.toObject();
    }
    const created = await JsonModel.create({ prompt, json });
    return created.toObject();
}
