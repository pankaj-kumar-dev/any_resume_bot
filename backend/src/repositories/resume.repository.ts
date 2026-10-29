
import { randomUUID } from "node:crypto";
import { pool } from "../db/pool.js";

export type ResumeRecord = {
  id: string;
  filename: string;
  extractedText: string;
  characterCount: number;
  createdAt: Date;
};

type ResumeRow = {
  id: string;
  filename: string;
  extracted_text: string;
  character_count: number;
  created_at: Date;
};

function toResumeRecord(row: ResumeRow): ResumeRecord {
  return {
    id: row.id,
    filename: row.filename,
    extractedText: row.extracted_text,
    characterCount: row.character_count,
    createdAt: row.created_at,
  };
}

export async function saveResume(
  filename: string,
  extractedText: string,
): Promise<ResumeRecord> {
  const id = randomUUID();

  const result = await pool.query<ResumeRow>(
    `INSERT INTO resumes (
       id, filename, extracted_text, character_count
     )
     VALUES ($1, $2, $3, $4)
     RETURNING id, filename, extracted_text, character_count, created_at`,
    [id, filename, extractedText, extractedText.length],
  );

  return toResumeRecord(result.rows[0]);
}

export async function getResume(
  resumeId: string,
): Promise<ResumeRecord | undefined> {
  const result = await pool.query<ResumeRow>(
    `SELECT id, filename, extracted_text, character_count, created_at
     FROM resumes
     WHERE id = $1`,
    [resumeId],
  );

  const row = result.rows[0];

  return row ? toResumeRecord(row) : undefined;
}
