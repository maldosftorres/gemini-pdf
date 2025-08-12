import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";

await connectDB(); // conecta a Mongo si hay URI
app.listen(env.PORT, () => {
    console.log(`🚀 API corriendo en http://localhost:${env.PORT}`);
});
