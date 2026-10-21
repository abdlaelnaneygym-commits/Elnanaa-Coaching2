/**
 * ملف التهيئة (Seed) — ينشئ السجل الابتدائي تلقائياً في جدول settings
 * (كلمة سر المدرب + وسائل الدفع) ويضمن تعبئة مكتبات الأغذية والتمارين
 * والتحوّلات. آمن تماماً: لا يحذف أي عمود أو سجل (upsert فقط).
 *
 * الاستخدام لأي قاعدة (محلية أو Neon):
 *   DATABASE_URL="postgresql://..." npx tsx scripts/seed-db.ts
 */
import { db, pool } from "@/db";
import { settings } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";

/** السجل الابتدائي المطلوب في جدول settings */
const SEED_SETTINGS: Array<[string, string]> = [
  ["coach_pin", "Ab345678"],
  ["instapay_number", "01009611266"],
  ["vodafone_cash_number", "01006251009"],
];

async function main() {
  console.log("🌱 بدء تهيئة قاعدة البيانات...");

  // تعبئة المكتبات — idempotent (يدرج فقط إذا كانت الجداول فارغة)
  await ensureSeeded();
  console.log("✓ مكتبات الأغذية والتمارين والتحوّلات جاهزة");

  // كتابة السجل الابتدائي في settings بوضع upsert آمن
  for (const [key, value] of SEED_SETTINGS) {
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value, updatedAt: new Date() },
      });
    console.log(`✓ settings[${key}] = ${value}`);
  }

  console.log("🎉 اكتمل إنشاء السجل الابتدائي بنجاح — لم يُحذف أي عمود أو سجل");
}

main()
  .catch(async (error) => {
    console.error("✗ فشلت التهيئة:", error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end().catch(() => undefined);
  });
