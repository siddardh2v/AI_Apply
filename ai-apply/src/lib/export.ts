import { Document, Packer, Paragraph, TextRun } from "docx";
import { PDFDocument, StandardFonts } from "pdf-lib";

/** Build a simple, clean DOCX from plain text (one paragraph per line). */
export async function buildDocx(text: string): Promise<Buffer> {
  const paragraphs = text.split("\n").map(
    (line) =>
      new Paragraph({
        children: [new TextRun({ text: line, font: "Calibri", size: 22 })],
        spacing: { after: 80 },
      })
  );

  const doc = new Document({ sections: [{ children: paragraphs }] });
  return Packer.toBuffer(doc);
}

/** Build a paginated PDF from plain text with basic word wrapping. */
export async function buildPdf(text: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 54;
  const fontSize = 11;
  const lineHeight = fontSize * 1.4;
  const maxWidth = pageWidth - margin * 2;

  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const newPage = () => {
    page = pdf.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  };

  // Sanitize characters Helvetica (WinAnsi) can't encode.
  const clean = (s: string) =>
    s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[^\x00-\xFF]/g, "");

  for (const rawLine of text.split("\n")) {
    const line = clean(rawLine);
    if (line.trim() === "") {
      y -= lineHeight;
      if (y < margin) newPage();
      continue;
    }

    // Word-wrap this logical line to fit maxWidth.
    const words = line.split(/\s+/);
    let current = "";
    const flush = () => {
      if (!current) return;
      if (y < margin) newPage();
      page.drawText(current, { x: margin, y, size: fontSize, font });
      y -= lineHeight;
      current = "";
    };

    for (const word of words) {
      const trial = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(trial, fontSize) > maxWidth && current) {
        flush();
        current = word;
      } else {
        current = trial;
      }
    }
    flush();
  }

  return pdf.save();
}
