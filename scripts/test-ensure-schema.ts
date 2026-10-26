/** اختبار: هل ensureSchema يبني كل الجداول على قاعدة فارغة تماماً؟ */
process.env.DATABASE_URL =
  "postgresql://postgres:postgres@127.0.0.1:5432/elnanaa_test";

async function main() {
  const { ensureSchema } = await import("../src/lib/ensure-schema");
  console.log("تشغيل ensureSchema على قاعدة فارغة تماماً...");
  await ensureSchema();

  const { drizzle } = await import("drizzle-orm/node-postgres");
  const { Pool } = await import("pg");
  const { sql } = await import("drizzle-orm");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db2 = drizzle(pool);

  const tablesRes = (await db2.execute(
    sql`SELECT count(*)::int AS c FROM pg_tables WHERE schemaname='public'`,
  )) as unknown as { rows: { c: number }[] };
  console.log("  الجداول:", tablesRes.rows[0]?.c ?? "?");

  const cols = [
    "foods.kcal", "foods.fiber", "foods.name_en", "recipes.calories",
    "calculations.resolved", "subscriptions.package_id",
  ];
  for (const pair of cols) {
    const [tbl, col] = pair.split(".");
    const r = (await db2.execute(
      sql`SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name=${tbl} AND column_name=${col}) AS ok`,
    )) as unknown as { rows: { ok: boolean }[] };
    const exists = r.rows[0]?.ok;
    console.log(`  ${exists ? "✓" : "✗"} ${pair}`);
  }
  await pool.end();
  process.exit(0);
}
void main();
