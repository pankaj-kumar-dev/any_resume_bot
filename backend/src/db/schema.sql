
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY,
    filename TEXT NOT NULL,
    extracted_text TEXT NOT NULL,
    character_count INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resumes_created_at
ON resumes (created_at DESC);
