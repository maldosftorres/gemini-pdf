import mongoose from "mongoose";

const schema = new mongoose.Schema(
    {
        Autor: String,
        Documento: String,
        Fecha: String,
        Resumen: String,
        Titulo: String,
        tipoDoc: String,
        Contenido: String,
        Año: Number,
        Nro: Number
    },
    { collection: "Disposiciones", strict: false }
);

export const Disposicion = mongoose.model("Disposicion", schema);
