import { insertarDisposicion } from "../services/disposiciones.service.js";

export async function createDisposicion(req, res, next) {
    try {
        // Aquí podrías validar req.body con zod/joi si querés
        const doc = await insertarDisposicion(req.body);
        res.status(201).json(doc);
    } catch (err) {
        next(err);
    }
}
