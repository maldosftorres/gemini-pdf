import { Disposicion } from "../models/disposiciones.model.js";

async function generarSiguienteId() {
    const max = await Disposicion.findOne().sort({ id: -1 }).select("id").lean();
    return (max?.id ?? 0) + 1;
}

/**
 * Inserta un documento en Disposiciones.
 * - borra _id si viene del front
 * - asigna id lógico si falta
 */
export async function insertarDisposicion(raw) {
    const payload = { ...raw };
    delete payload._id;
    // if (payload.id == null) payload.id = await generarSiguienteId();
    return Disposicion.create(payload);
}
