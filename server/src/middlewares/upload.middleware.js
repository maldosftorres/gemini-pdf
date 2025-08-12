import multer from "multer";

export const uploadMemory = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (_req, file, cb) => {
        if (file.mimetype !== "application/pdf") return cb(new Error("Solo se permiten PDFs"), false);
        cb(null, true);
    }
});
