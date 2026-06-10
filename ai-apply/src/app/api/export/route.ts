import { requireUserId } from "@/lib/auth";
import { buildDocx, buildPdf } from "@/lib/export";
import { badRequest, fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/export — turn text into a downloadable PDF or DOCX.
// Body: { content, format: "pdf" | "docx", filename? }
export async function POST(req: Request) {
  try {
    await requireUserId();
    const { content, format, filename } = await req.json();
    if (!content || typeof content !== "string") {
      return badRequest("content is required.");
    }

    const base = (filename || "document").replace(/[^\w.-]+/g, "_");

    if (format === "docx") {
      const buf = await buildDocx(content);
      return new Response(new Uint8Array(buf), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${base}.docx"`,
        },
      });
    }

    if (format === "pdf") {
      const bytes = await buildPdf(content);
      return new Response(new Uint8Array(bytes), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${base}.pdf"`,
        },
      });
    }

    return badRequest('format must be "pdf" or "docx".');
  } catch (e) {
    return fail(e);
  }
}
