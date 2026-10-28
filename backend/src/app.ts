import express from "express";
import cors from "cors";
import multer from "multer";
import resumeRoutes from "./routes/resume.routes.js";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
  }),
);

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "resume-chatbot-api",
  });
});

app.use("/api/resume", resumeRoutes);

// Centralized upload and request error handling
app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        res.status(413).json({
          error: "PDF must be 5 MB or smaller.",
        });
        return;
      }

      res.status(400).json({
        error: "The file upload was rejected.",
      });
      return;
    }

    if (error instanceof Error) {
      if (
        error.message === "Only PDF files are allowed." ||
        error.message === "The uploaded file is not a valid PDF." ||
        error.message.startsWith("No readable text found.")
      ) {
        res.status(400).json({ error: error.message });
        return;
      }
    }

    console.error("Unhandled request error:", error);

    res.status(500).json({
      error: "An unexpected server error occurred.",
    });
  },
);

export default app;
