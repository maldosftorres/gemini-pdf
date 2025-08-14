import { getFirstJson } from "../services/json.service.js";

export async function getJsonHandler(_req, res, next) {
    try {
        const doc = await getFirstJson();
        // Si no hay documento, devolvemos objeto vacío para no romper el front
        res.json(doc || {});
    } catch (err) {
        next(err);
    }
}
