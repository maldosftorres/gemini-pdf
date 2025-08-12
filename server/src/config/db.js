import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDB() {
    if (!env.MONGO_URI) {
        console.warn("[DB] MONGO_URI vacío. Saltando conexión.");
        return;
    }
    await mongoose.connect(env.MONGO_URI);
    console.log("✅ Mongo conectado");
}
