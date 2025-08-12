import { getFirstJson, upsertFirstJson } from "../services/json.service.js";

export async function getJsonHandler(_req, res, next) {
    try {
        const doc = await getFirstJson();
        // Si no hay documento, devolvemos objeto vacío para no romper el front
        res.json(doc || {});
    } catch (err) {
        next(err);
    }
}

// Opcional: para setear/actualizar prompt+json desde un panel admin
export async function upsertJsonHandler(req, res, next) {
    try {
        const { prompt, json } = req.body || {};
        const doc = await upsertFirstJson({ prompt, json });
        res.status(200).json(doc);
    } catch (err) {
        next(err);
    }
}
