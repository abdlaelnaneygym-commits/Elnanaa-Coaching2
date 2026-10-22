import { isCoachAuthorized, unauthorized } from "@/lib/coach-auth";
import { deleteSetting, getSetting, setSetting } from "@/lib/settings";
import { readDataUrlField } from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** مفتاح تخزين رابط صورة الواجهة داخل جدول settings */
const HERO_KEY = "hero_image";

/** قراءة صورة الواجهة الحالية المخصصة (للوحة المدرب) */
export async function GET(req: Request) {
  if (!(await isCoachAuthorized(req))) return unauthorized();
  const image = await getSetting(HERO_KEY);
  return Response.json({ ok: true, data: { image, isCustom: Boolean(image) } });
}

/**
 * حفظ صورة واجهة جديدة في جدول settings على قاعدة البيانات.
 * الصورة تصل مضغوطة من المتصفح كـ Data URL وتُخزن بنفس طريقة
 * صور التحوّلات — تعمل على Vercel بدون تخزين ملفات.
 */
export async function POST(req: Request) {
  if (!(await isCoachAuthorized(req))) return unauthorized();
  try {
    const form = await req.formData();
    const image = readDataUrlField(form.get("image"));
    if (!image) {
      return Response.json(
        { ok: false, error: "برجاء اختيار صورة صالحة للرفع" },
        { status: 400 },
      );
    }
    await setSetting(HERO_KEY, image);
    return Response.json({
      ok: true,
      message: "تم حفظ صورة الواجهة في قاعدة البيانات — أصبحت ظاهرة لجميع الزوار الآن",
    });
  } catch (error) {
    console.error("POST /api/coach/hero-image", error);
    const message =
      error instanceof Error && (error.message.includes("حجم") || error.message.includes("ملف"))
        ? error.message
        : "تعذّر حفظ الصورة، برجاء المحاولة مرة أخرى";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

/** استعادة الصورة الافتراضية = حذف القيمة من settings (Fallback تلقائي) */
export async function DELETE(req: Request) {
  if (!(await isCoachAuthorized(req))) return unauthorized();
  try {
    await deleteSetting(HERO_KEY);
    return Response.json({
      ok: true,
      message: "تم استعادة الصورة الافتراضية لجميع الزوار",
    });
  } catch (error) {
    console.error("DELETE /api/coach/hero-image", error);
    return Response.json({ ok: false, error: "خطأ في الخادم" }, { status: 500 });
  }
}
