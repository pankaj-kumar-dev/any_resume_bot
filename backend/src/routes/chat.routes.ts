
import { Router } from "express";
import { getResume } from "../repositories/resume.repository.js";
// import { answerResumeQuestion } from "../services/llm.service.js";
import {
  answerResumeQuestion,
  type ChatHistoryMessage,
} from "../services/llm.service.js";
const router = Router();

router.post("/", async (req, res) => {
  const { resumeId, question } = req.body ?? {};

  if (
    typeof resumeId !== "string" ||
    typeof question !== "string" ||
    !resumeId.trim() ||
    !question.trim()
  ) {
    res.status(400).json({
      error: "resumeId and question are required.",
    });
    return;
  }

  if (question.length > 2000) {
    res.status(400).json({
      error: "Question must be 2000 characters or fewer.",
    });
    return;
  }

  const rawHistory: unknown = req.body?.history ?? [];

if (
  !Array.isArray(rawHistory) ||
  rawHistory.length > 20 ||
  !rawHistory.every(
    (message): message is ChatHistoryMessage =>
      message !== null &&
      typeof message === "object" &&
      "role" in message &&
      "content" in message &&
      (message.role === "user" || message.role === "assistant") &&
      typeof message.content === "string" &&
      message.content.length <= 2000,
  )
) {
  res.status(400).json({
    error: "Invalid conversation history.",
  });
  return;
}

  const resume = await getResume(resumeId);

  if (!resume) {
    res.status(404).json({
      error: "Resume not found. Please upload the PDF again.",
    });
    return;
  }

  try {
const answer = await answerResumeQuestion({
  resumeText: resume.extractedText,
  question: question.trim(),
  history: rawHistory,
});
    res.status(200).json({
      resumeId: resume.id,
      question: question.trim(),
      answer,
    });
  } catch (error) {
    console.error("Resume Q&A failed:", error);

    res.status(502).json({
      error: "Unable to generate an answer. Please try again.",
    });
  }
});

export default router;
