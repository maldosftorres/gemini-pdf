// services/disposiciones.service.js
import { Disposicion } from "../models/disposiciones.model.js";

/**
 * Recibe el payload tal como viene del front (ej. {autor, titulo, ...})
 * y lo mapea al esquema de la colección (Autor, Titulo, ...).
 * Guarda y devuelve el documento insertado.
 */
export async function insertarDisposicion(payload = {}) {
    const doc = {
        Autor: payload.autor ?? payload.Autor ?? "",
        Titulo: payload.titulo ?? payload.Titulo ?? "",
        Resumen: payload.resumen ?? payload.Resumen ?? "",
        Contenido: payload.contenido ?? payload.Contenido ?? "",
        tipoDoc: payload.tipoDoc ?? payload.TipoDoc ?? "",
        Año:
            Number.isFinite(payload.año) ? payload.año
                : Number(payload.Año) || 0,
        Nro:
            Number.isFinite(payload.nro) ? payload.nro
                : Number(payload.Nro) || 0,
        Documento: payload.documento ?? payload.Documento ?? "",
        Fecha: payload.fecha ?? payload.Fecha ?? "",
    };

    const saved = await Disposicion.create(doc);
    return saved;
}
