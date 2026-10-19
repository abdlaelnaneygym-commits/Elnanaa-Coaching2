import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { readDataUrlField } from "@/lib/uploads";

export const runtime = "nodejs";

/**
 * نموذج التسجيل الكامل: بيانات + تقرير InBody + صور الجسم + وسيلة الدفع.
 * الصور تُضغط في المتصفح وتُرسل كـ Data URL وتُحفظ في قاعدة البيانات.
 */
export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const name = String(form.get("name") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const age = Number(form.get("age"));
    const weight = Number(form.get("weight"));
    const height = Number(form.get("height"));
    const gender = form.get("gender") === "female" ? "female" : "male";
    const goal = String(form.get("goal") ?? "").trim();
    const packageId = String(form.get("packageId") ?? "").trim();
    const paymentMethod = String(form.get("paymentMethod") ?? "").trim();
    const paymentReference = String(form.get("paymentReference") ?? "").trim();
    const notes = String(form.get("notes") ?? "").trim();

    if (name.length < 2) {
      return Response.json({ ok: false, error: "برجاء إدخال الاسم الكامل" }, { status: 400 });
    }
    if (phone.length < 8) {
      return Response.json({ ok: false, error: "برجاء إدخال رقم هاتف صحيح للتواصل" }, { status: 400 });
    }
    if (!Number.isFinite(age) || age < 5 || age > 100) {
      return Response.json({ ok: false, error: "برجاء إدخال سن صحيح" }, { status: 400 });
    }
    if (!Number.isFinite(weight) || weight < 20 || weight > 300) {
      return Response.json({ ok: false, error: "برجاء إدخال وزن صحيح" }, { status: 400 });
    }
    if (!Number.isFinite(height) || height < 90 || height > 230) {
      return Response.json({ ok: false, error: "برجاء إدخال طول صحيح" }, { status: 400 });
    }
    if (!["starter", "transform", "elite"].includes(packageId)) {
      return Response.json({ ok: false, error: "برجاء اختيار الباقة" }, { status: 400 });
    }
    if (!["instapay", "vodafone"].includes(paymentMethod)) {
      return Response.json({ ok: false, error: "برجاء اختيار وسيلة الدفع" }, { status: 400 });
    }

    const inbodyFile = readDataUrlField(form.get("inbody"), true);
    const frontPhoto = readDataUrlField(form.get("frontPhoto"));
    const sidePhoto = readDataUrlField(form.get("sidePhoto"));
    const backPhoto = readDataUrlField(form.get("backPhoto"));

    await db.insert(subscriptions).values({
      name,
      phone,
      age: Math.round(age),
      weight,
      height,
      gender,
      goal: goal || "غير محدد",
      packageId,
      paymentMethod,
      paymentReference: paymentReference || null,
      inbodyFile,
      frontPhoto,
      sidePhoto,
      backPhoto,
      notes: notes || null,
    });

    return Response.json({
      ok: true,
      message: "تم استلام طلب اشتراكك بنجاح، سيتواصل معك الكابتن عبد الله خلال 24 ساعة",
    });
  } catch (error) {
    console.error("POST /api/subscriptions", error);
    const message =
      error instanceof Error && (error.message.includes("ملف") || error.message.includes("حجم"))
        ? error.message
        : "حدث خطأ غير متوقع، برجاء المحاولة مرة أخرى";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
