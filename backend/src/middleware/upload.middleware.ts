import multer from "multer";

const storage = multer.memoryStorage();

export const uploadResume = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    const hasPdfExtension = /\.pdf$/i.test(file.originalname);
    const hasPdfMimeType = file.mimetype === "application/pdf";

    if (!hasPdfExtension || !hasPdfMimeType) {
      callback(new Error("Only PDF files are allowed."));
      return;
    }

    callback(null, true);
  },
});
