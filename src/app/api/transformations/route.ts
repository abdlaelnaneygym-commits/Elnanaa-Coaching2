import { db } from "@/db";
import { transformations } from "@/db/schema";
import { isCoachAuthorized } from "@/lib/coach-auth";
import { readDataUrlField } from "@/lib/uploads";
import { ensureSeeded } from "@/lib/seed";
import { desc, eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** عام — التحوّلات المنشورة للصفحة الرئيسية */
export async function GET() {
  try {
    await ensureSeeded();
    const rows = await db
      .select()
      .from(transformations)
      .where(eq(transformations.isPublished, true))
      .orderBy(desc(transformations.createdAt))
      .limit(24);
    return Response.json({ ok: true, data: rows });
  } catch (error) {
    console.error("GET /api/transformations", error);
    return Response.json({ ok: true, data: [] });
  }
}

/** للمدرب — إضافة تحوّل جديد بصور قبل/بعد (Data URL) */
export async function POST(req: Request) {
  if (!(await isCoachAuthorized(req))) {
    return Response.json({ ok: false, error: "غير مصرح" }, { status: 401 });
  }
  try {
    const form = await req.formData();
    const clientName = String(form.get("clientName") ?? "").trim();
    const duration = String(form.get("duration") ?? "").trim();
    const weightBefore = String(form.get("weightBefore") ?? "").trim();
    const weightAfter = String(form.get("weightAfter") ?? "").trim();
    const bodyFatBefore = String(form.get("bodyFatBefore") ?? "").trim();
    const bodyFatAfter = String(form.get("bodyFatAfter") ?? "").trim();
    const muscleBefore = String(form.get("muscleBefore") ?? "").trim();
    const muscleAfter = String(form.get("muscleAfter") ?? "").trim();
    const story = String(form.get("story") ?? "").trim();
    const storyAuthor = String(form.get("storyAuthor") ?? "").trim();

    if (clientName.length < 2) {
      return Response.json({ ok: false, error: "برجاء إدخال اسم العميل" }, { status: 400 });
    }
    if (duration.length < 1) {
      return Response.json({ ok: false, error: "برجاء إدخال مدة التحوّل" }, { status: 400 });
    }

    const beforeImage = readDataUrlField(form.get("beforeImage"));
    const afterImage = readDataUrlField(form.get("afterImage"));

    if (!beforeImage || !afterImage) {
      return Response.json({ ok: false, error: "برجاء رفع صورتي قبل وبعد" }, { status: 400 });
    }

    const [row] = await db
      .insert(transformations)
      .values({
        clientName,
        duration,
        beforeImage,
        afterImage,
        weightBefore: weightBefore || null,
        weightAfter: weightAfter || null,
        bodyFatBefore: bodyFatBefore || null,
        bodyFatAfter: bodyFatAfter || null,
        muscleBefore: muscleBefore || null,
        muscleAfter: muscleAfter || null,
        story: story || null,
        storyAuthor: storyAuthor || null,
      })
      .returning();

    return Response.json({ ok: true, data: row });
  } catch (error) {
    console.error("POST /api/transformations", error);
    const message =
      error instanceof Error && (error.message.includes("ملف") || error.message.includes("حجم"))
        ? error.message
        : "حدث خطأ غير متوقع";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
