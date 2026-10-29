
import { useState, type DragEvent, type FormEvent } from "react";
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
  const [dragging, setDragging] = useState(false);

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

  function selectFile(selected: File | null) {
    setFile(selected);
    setError("");
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    if (uploading) return;
    const dropped = event.dataTransfer.files?.[0];
    if (!dropped) return;
    if (dropped.type !== "application/pdf" && !/\.pdf$/i.test(dropped.name)) {
      setFile(null);
      setError("Please drop a PDF file.");
      return;
    }
    selectFile(dropped);
  }

  const suggestions = [
    "Summarize my experience",
    "What are my technical skills?",
    "Describe my best project",
  ];

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand-mark" aria-hidden="true">
          R
        </div>
        <div>
          <h1>Resume Chatbot</h1>
          <p className="subtitle">
            Ask questions about your uploaded resume.
          </p>
        </div>
      </header>

      <section className="panel" aria-labelledby="upload-title">
        <div className="panel-head">
          <h2 id="upload-title">Upload your resume</h2>
          <p className="panel-text">
            PDF only. Text is extracted so you can chat about it below.
          </p>
        </div>

        <form onSubmit={handleUpload} className="upload-form">
          <label
            className={`dropzone${dragging ? " is-dragging" : ""}${
              uploading ? " is-disabled" : ""
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              if (!uploading) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".pdf,application/pdf"
              disabled={uploading}
              onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
            />
            <span className="dropzone-icon" aria-hidden="true">
              ↑
            </span>
            <span className="dropzone-title">
              {file ? file.name : "Drop your PDF here or click to browse"}
            </span>
            <span className="dropzone-sub">
              {file
                ? `${(file.size / 1024).toFixed(0)} KB · ready to upload`
                : "Only .pdf files are accepted"}
            </span>
          </label>
          <button
            type="submit"
            className="btn"
            disabled={!file || uploading}
          >
            {uploading && <span className="spinner" aria-hidden="true" />}
            {uploading ? "Uploading..." : "Upload PDF"}
          </button>
        </form>

        {resume && (
          <div className="upload-success" role="status">
            <span className="check" aria-hidden="true">
              ✓
            </span>
            <div>
              <strong>Resume uploaded successfully</strong>
              <p>{resume.filename}</p>
              <p>
                {resume.characterCount.toLocaleString()} characters extracted
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="panel" aria-labelledby="chat-title">
        <div className="panel-head">
          <h2 id="chat-title">Ask your resume</h2>
          <p className="panel-text">
            {resume
              ? "Answers are generated from your uploaded resume."
              : "Upload a resume before asking questions."}
          </p>
        </div>

        <div className="messages" aria-live="polite">
          {messages.length === 0 && !asking && (
            <div className="empty-state">
              {resume
                ? "No questions yet. Ask something below."
                : "Your conversation will appear here."}
            </div>
          )}

          {messages.map((message, index) => (
            <article className="message-pair" key={`${index}-${message.question}`}>
              <div className="question-bubble">
                <span className="message-label">You</span>
                <p>{message.question}</p>
              </div>
              <div className="answer-bubble">
                <span className="message-label">AI assistant</span>
                <p>{message.answer}</p>
              </div>
            </article>
          ))}

          {asking && (
            <div className="answer-bubble typing" role="status">
              <span className="message-label">AI assistant</span>
              <span className="dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span className="sr-only">Generating an answer...</span>
            </div>
          )}
        </div>

        {resume && !asking && (
          <div className="chips" aria-label="Suggested questions">
            {suggestions.map((text) => (
              <button
                type="button"
                className="chip"
                key={text}
                onClick={() => setQuestion(text)}
              >
                {text}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleAsk} className="chat-form">
          <label className="sr-only" htmlFor="question">
            Your question
          </label>
          <textarea
            id="question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="e.g. Summarize my technical skills"
            rows={3}
            maxLength={2000}
            disabled={!resume || asking}
          />
          <button
            type="submit"
            className="btn"
            disabled={!resume || !question.trim() || asking}
          >
            {asking && <span className="spinner" aria-hidden="true" />}
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
