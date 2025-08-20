import { Router } from "express";
import uploadRoutes from "./upload.routes.js";
import disposRoutes from "./disposiciones.routes.js";
import jsonRoutes from "./json.routes.js";

const router = Router();

router.get("/health", (_req, res) => res.json({ ok: true }));
router.use("/upload", uploadRoutes);
router.use("/disposiciones", disposRoutes);
router.use("/json", jsonRoutes);

export default router;

