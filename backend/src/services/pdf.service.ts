import { PDFParse } from "pdf-parse";

export async function extractPdfText(
  buffer: Buffer,
): Promise<string> {
  // Basic signature check: PDF files normally begin with %PDF-
  const signature = buffer.subarray(0, 5).toString("ascii");

  if (signature !== "%PDF-") {
    throw new Error("The uploaded file is not a valid PDF.");
  }

  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    const text = result.text.trim();

    if (!text) {
      throw new Error(
        "No readable text found. The PDF may be scanned or empty.",
      );
    }

    return text;
  } finally {
    await parser.destroy();
  }
}
