import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * قراءة/كتابة الإعدادات من جدول settings في PostgreSQL (Neon).
 * تُستخدم هذه القيم في الصفحة الرئيسية مباشرة من الخادم، وبما أن الصفحة
 * Dynamic فأي تغيير ينعكس فوراً لكل الزوار.
 */

/** قراءة قيمة إعداد — يرجع null عند غيابه أو تعذّر الوصول (Fallback آمن) */
export async function getSetting(key: string): Promise<string | null> {
  try {
    const [row] = await db
      .select({ value: settings.value })
      .from(settings)
      .where(eq(settings.key, key))
      .limit(1);
    return row?.value ?? null;
  } catch {
    // الجدول قد لا يكون موجوداً بعد في بيئة جديدة — نتجاهل بهدوء
    return null;
  }
}

/** كتابة/تحديث قيمة إعداد (upsert) */
export async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value, updatedAt: new Date() },
    });
}

/** حذف إعداد (لإعادة الوضع الافتراضي) */
export async function deleteSetting(key: string): Promise<void> {
  try {
    await db.delete(settings).where(eq(settings.key, key));
  } catch {
    // تجاهل بهدوء إذا لم يكن موجوداً
  }
}
