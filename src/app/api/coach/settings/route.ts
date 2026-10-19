import { getCoachPin, isCoachAuthorized, unauthorized, updateCoachPin } from "@/lib/coach-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** هل هناك كلمة سر مخصّصة محفوظة في قاعدة البيانات؟ */
export async function GET(req: Request) {
  if (!(await isCoachAuthorized(req))) return unauthorized();
  return Response.json({ ok: true, data: { usingDefault: true } });
}

/** تغيير كلمة سر لوحة التحكم — يتطلب كلمة السر الحالية */
export async function PATCH(req: Request) {
  if (!(await isCoachAuthorized(req))) return unauthorized();
  try {
    const body = (await req.json().catch(() => null)) as {
      currentPin?: string;
      newPin?: string;
    } | null;

    const currentPin = String(body?.currentPin ?? "");
    const newPin = String(body?.newPin ?? "").trim();

    if (newPin.length < 6 || newPin.length > 40) {
      return Response.json(
        { ok: false, error: "كلمة السر الجديدة يجب أن تكون 6 أحرف على الأقل" },
        { status: 400 },
      );
    }

    const actual = await getCoachPin();
    if (currentPin !== actual) {
      return Response.json(
        { ok: false, error: "كلمة السر الحالية غير صحيحة" },
        { status: 401 },
      );
    }

    await updateCoachPin(newPin);
    return Response.json({ ok: true, message: "تم تحديث كلمة السر بنجاح" });
  } catch (error) {
    console.error("PATCH /api/coach/settings", error);
    return Response.json({ ok: false, error: "خطأ في الخادم" }, { status: 500 });
  }
}
