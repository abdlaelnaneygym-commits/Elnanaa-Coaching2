import { db } from "@/db";
import { exercises, foods, transformations } from "@/db/schema";
import { EXERCISE_SEED, FOOD_SEED, TRANSFORMATION_SEED } from "@/lib/seed-data";
import { sql } from "drizzle-orm";

async function count(table: typeof foods | typeof exercises | typeof transformations) {
  const [row] = await db.select({ c: sql<number>`count(*)::int` }).from(table);
  return row?.c ?? 0;
}

async function doSeed() {
  if ((await count(foods)) === 0) {
    await db.insert(foods).values(
      FOOD_SEED.map(([name, category, kcal, protein, carbs, fats]) => ({
        name,
        category,
        kcal,
        protein,
        carbs,
        fats,
      })),
    );
  }

  if ((await count(exercises)) === 0) {
    await db.insert(exercises).values(
      EXERCISE_SEED.map(([name, muscleGroup]) => ({ name, muscleGroup })),
    );
  }

  if ((await count(transformations)) === 0) {
    await db.insert(transformations).values(TRANSFORMATION_SEED);
  }
}

let seedPromise: Promise<void> | null = null;

/**
 * تهيئة مكتبات الأغذية والتمارين والتحويلات تلقائياً عند أول طلب.
 * idempotent — يُنفّذ مرة واحدة في عمر العملية.
 */
export function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = doSeed().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }
  return seedPromise;
}
