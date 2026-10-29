
import { useState, type FormEvent } from "react";
import "./App.css";

const API_URL = "http://localhost:3000";

type UploadResponse = {
  message: string;
  resumeId: string;
  filename: string;
  characterCount: number;
};

type ChatResponse = {
  answer?: string;
  error?: string;
};

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [resume, setResume] = useState<UploadResponse | null>(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<
    { question: string; answer: string }[]
  >([]);
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Please select a PDF first.");
      return;
    }

    setUploading(true);
    setError("");
    setResume(null);
    setMessages([]);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const response = await fetch(`${API_URL}/api/resume/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "PDF upload failed.");
      }

      setResume(data as UploadResponse);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect to the backend.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resume || !question.trim()) return;

    const submittedQuestion = question.trim();
    setAsking(true);
    setError("");
    setQuestion("");

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
  resumeId: resume.resumeId,
  question: submittedQuestion,
  history: messages.flatMap((message) => [
    { role: "user", content: message.question },
    { role: "assistant", content: message.answer },
  ]),
}),
      });

      const data: ChatResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not generate an answer.");
      }

      setMessages((previous) => [
        ...previous,
        { question: submittedQuestion, answer: data.answer ?? "" },
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect to the backend.",
      );
      setQuestion(submittedQuestion);
    } finally {
      setAsking(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <p className="eyebrow">PERSONAL AI ASSISTANT</p>
        <h1>Resume Chatbot</h1>
        <p className="subtitle">
          Upload your resume and ask questions about your experience.
        </p>
      </header>

      <section className="panel">
        <h2>1. Upload your resume</h2>
        <form onSubmit={handleUpload} className="upload-form">
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setError("");
            }}
          />
          <button type="submit" disabled={!file || uploading}>
            {uploading ? "Uploading..." : "Upload PDF"}
          </button>
        </form>

        {resume && (
          <div className="upload-success">
            <strong>Resume uploaded successfully</strong>
            <p>{resume.filename}</p>
            <p>{resume.characterCount.toLocaleString()} characters extracted</p>
          </div>
        )}
      </section>

      <section className="panel">
        <h2>2. Ask your resume</h2>

        {!resume && (
          <p className="hint">Upload a resume before asking questions.</p>
        )}

        <div className="messages" aria-live="polite">
          {messages.map((message, index) => (
            <article className="message-pair" key={`${index}-${message.question}`}>
              <div className="question-bubble">
                <strong>You</strong>
                <p>{message.question}</p>
              </div>
              <div className="answer-bubble">
                <strong>AI assistant</strong>
                <p>{message.answer}</p>
              </div>
            </article>
          ))}

          {asking && <p className="hint">Generating an answer...</p>}
        </div>

        <form onSubmit={handleAsk} className="chat-form">
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="e.g. Summarize my technical skills"
            rows={3}
            maxLength={2000}
            disabled={!resume || asking}
          />
          <button
            type="submit"
            disabled={!resume || !question.trim() || asking}
          >
            {asking ? "Thinking..." : "Ask question"}
          </button>
        </form>
      </section>

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
    </main>
  );
}

export default App;
