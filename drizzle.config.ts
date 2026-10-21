import type { Config } from "drizzle-kit";

/**
 * يقرأ رابط قاعدة البيانات من متغير البيئة DATABASE_URL —
 * هكذا يمكنك تطبيق الجداول على أي قاعدة (محلية أو Neon) بأمر واحد:
 *   DATABASE_URL="postgresql://...neon..." npx drizzle-kit push
 */
export default {
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@127.0.0.1:5432/app_db",
  },
} satisfies Config;
