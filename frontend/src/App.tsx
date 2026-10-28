
import { useEffect, useState } from "react";
import "./App.css";

type HealthResponse = {
  status: string;
  service: string;
};

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json() as Promise<HealthResponse>;
      })
      .then(setHealth)
      .catch(() => {
        setError("Backend unavailable. Check that the API is running.");
      });
  }, []);

  return (
    <main>
      <h1>Resume Chatbot</h1>
      <p>Phase 0: Project setup</p>

      {health && (
        <p>
          Backend status: {health.status} ({health.service})
        </p>
      )}

      {error && <p role="alert">{error}</p>}
    </main>
  );
}

export default App;
