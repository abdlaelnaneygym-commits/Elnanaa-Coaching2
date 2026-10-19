import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * كلمة سر لوحة تحكم المدرب — مكتوبة مباشرة ودائماً في الكود
 * حتى تعمل على الإنتاج (Vercel) بدون أي متغيرات بيئة.
 */
export const DEFAULT_COACH_PIN = "Ab345678";

/** مفتاح تخزين كلمة السر المخصّصة في قاعدة البيانات */
const PIN_KEY = "coach_pin";

/** كاش قصير المدى لتفادي الاستعلام في كل طلب */
let cachedPin: string | null = null;
let cachedAt = 0;
const CACHE_TTL = 3000; // 3 ثوانٍ

function envPin(): string | null {
  const value = process.env.COACH_PIN;
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** كلمة السر الفعلية: من قاعدة البيانات ← ثم متغير البيئة ← ثم الكود */
export async function getCoachPin(): Promise<string> {
  if (cachedPin !== null && Date.now() - cachedAt < CACHE_TTL) {
    return cachedPin;
  }
  let resolved: string | null = null;
  try {
    const [row] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, PIN_KEY))
      .limit(1);
    if (row?.value) resolved = row.value;
  } catch {
    // الجدول غير موجود بعد — نتجاهل ونستخدم الاحتياطي
  }
  if (!resolved) resolved = envPin();
  if (!resolved) resolved = DEFAULT_COACH_PIN;

  cachedPin = resolved;
  cachedAt = Date.now();
  return resolved;
}

/** التحقق من رمز دخول المدرب */
export async function isCoachAuthorized(req: Request): Promise<boolean> {
  const pin = req.headers.get("x-coach-pin");
  if (typeof pin !== "string" || pin.length === 0) return false;
  return pin === (await getCoachPin());
}

/** تحديث كلمة السر (يحتاج كلمة السر الحالية) */
export async function updateCoachPin(newPin: string): Promise<void> {
  await db
    .insert(settings)
    .values({ key: PIN_KEY, value: newPin })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: newPin, updatedAt: new Date() },
    });
  cachedPin = newPin;
  cachedAt = Date.now();
}

export function unauthorized() {
  return Response.json(
    { ok: false, error: "غير مصرح — كلمة السر غير صحيحة" },
    { status: 401 },
  );
}
