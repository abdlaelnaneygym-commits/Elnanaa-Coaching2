import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const SAFE_NAME = /^[\w.-]+$/;

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".pdf": "application/pdf",
};

/** تقديم الملفات المرفوعة بأمان بغض النظر عن توقيت إنشائها */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ name: string }> },
) {
  const { name } = await ctx.params;
  const decoded = decodeURIComponent(name);
  if (!SAFE_NAME.test(decoded)) {
    return Response.json({ ok: false, error: "اسم ملف غير صالح" }, { status: 400 });
  }
  try {
    const filePath = path.join(UPLOAD_DIR, decoded);
    const data = await readFile(filePath);
    const ext = path.extname(decoded).toLowerCase();
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return Response.json({ ok: false, error: "الملف غير موجود" }, { status: 404 });
  }
}
