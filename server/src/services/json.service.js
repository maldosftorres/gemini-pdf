import { JsonModel } from "../models/json.model.js";

/**
 * Devuelve el PRIMER documento de la colección Json.
 * (Compat con tu front: /api/json → { prompt, json })
 */
export async function getFirstJson() {
    return JsonModel.findOne().lean();
}