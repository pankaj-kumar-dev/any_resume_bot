import { PDFParse } from "pdf-parse";

export type PdfLink = {
  text: string;
  url: string;
};

export type ExtractedPdf = {
  text: string;
  links: PdfLink[];
};

const ALLOWED_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

// Link annotations are clickable areas stored outside the text layer, so
// getText() never returns their URLs. getInfo() exposes them per page.
function collectLinks(pages: { links?: PdfLink[] }[]): PdfLink[] {
  const seen = new Set<string>();
  const links: PdfLink[] = [];

  for (const link of pages.flatMap((page) => page.links ?? [])) {
    const url = link.url?.trim();

    if (!url) continue;

    try {
      if (!ALLOWED_LINK_PROTOCOLS.has(new URL(url).protocol)) continue;
    } catch {
      continue;
    }

    const text = (link.text ?? "").trim();
    const key = `${text}\n${url}`;

    if (seen.has(key)) continue;

    seen.add(key);
    links.push({ text, url });
  }

  return links;
}

export async function extractPdfText(
  buffer: Buffer,
): Promise<ExtractedPdf> {
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

    const info = await parser.getInfo({ parsePageInfo: true });

    return { text, links: collectLinks(info.pages) };
  } finally {
    await parser.destroy();
  }
}
