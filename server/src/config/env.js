import dotenv from "dotenv";
dotenv.config();

export const env = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: Number(process.env.PORT || 4000),
    MONGO_URI: process.env.MONGODB_URI || "",
    GEMINI_KEY: process.env.keygemini || "",
    CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
};
