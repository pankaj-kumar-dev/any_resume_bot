import { Router } from "express";
import { uploadResume } from "../middleware/upload.middleware.js";
import { extractPdfText } from "../services/pdf.service.js";
import { saveResume } from "../repositories/resume.repository.js";
const router = Router();

router.post(
  "/upload",
  uploadResume.single("resume"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        res.status(400).json({
          error: 'Please upload a PDF using the field name "resume".',
        });
        return;
      }


      const extractedText = await extractPdfText(req.file.buffer);

      const resume = await saveResume(req.file.originalname, extractedText);

      res.status(200).json({
        message: "PDF uploaded and text extracted successfully.",
        resumeId: resume.id,
        filename: resume.filename,
        characterCount: resume.extractedText.length,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
