import mongoose from "mongoose";

const schema = new mongoose.Schema(
    {
        Autor: String,
        Documento: String,
        Fecha: String,   // cámbialo a Date si querés más adelante
        Resumen: String,
        Titulo: String,
        id: Number,      // id lógico (no _id)
        tipoDoc: String,
        Contenido: String,
        Año: Number,
        Nro: Number
    },
    { collection: "Disposiciones", strict: false }
);

export const Disposicion = mongoose.model("Disposicion", schema);
