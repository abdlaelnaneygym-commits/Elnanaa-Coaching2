import { db } from "@/db";
import { exercises, foods, recipes, transformations } from "@/db/schema";
import { ensureSchema } from "@/lib/ensure-schema";
import {
  EXERCISE_SEED,
  FOOD_SEED,
  FOOD_SEED_EXTRA,
  RECIPE_SEED,
  TRANSFORMATION_SEED,
} from "@/lib/seed-data";
import { sql } from "drizzle-orm";

async function count(table: typeof foods | typeof exercises | typeof transformations | typeof recipes) {
  const [row] = await db.select({ c: sql<number>`count(*)::int` }).from(table);
  return row?.c ?? 0;
}

async function doSeed() {
  // تأكيد وجود Schema كاملاً أولاً (آمن — إضافي فقط)
  await ensureSchema();

  // الأغذية الأساسية — مرة واحدة عند الجدول فارغ
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

  // توسعة المكتبة (V2) — بنظام عدم التكرار بالاسم (مفتاح فريد منطقي)
  const existingNames = new Set(
    (await db.select({ name: foods.name }).from(foods)).map((f) => f.name),
  );
  const extras = FOOD_SEED_EXTRA.filter((fd) => !existingNames.has(fd.name)).map((fd) => ({
    name: fd.name,
    nameEn: fd.nameEn,
    category: fd.category,
    kcal: fd.kcal,
    protein: fd.protein,
    carbs: fd.carbs,
    fats: fd.fats,
    fiber: fd.fiber,
    state: fd.state,
    notes: fd.notes ?? null,
  }));
  if (extras.length > 0) {
    await db.insert(foods).values(extras);
  }

  if ((await count(exercises)) === 0) {
    await db.insert(exercises).values(
      EXERCISE_SEED.map(([name, muscleGroup]) => ({ name, muscleGroup })),
    );
  }

  if ((await count(transformations)) === 0) {
    await db.insert(transformations).values(TRANSFORMATION_SEED);
  }

  // كتاب الوصفات — أولية عند الجدول فارغ
  if ((await count(recipes)) === 0) {
    await db.insert(recipes).values(
      RECIPE_SEED.map((r) => ({
        name: r.name,
        nameEn: r.nameEn ?? null,
        category: r.category,
        ingredients: r.ingredients,
        steps: r.steps,
        calories: r.calories,
        protein: r.protein,
        carbs: r.carbs,
        fats: r.fats,
        fiber: r.fiber ?? 0,
        image: r.image ?? null,
      })),
    );
  }
}

let seedPromise: Promise<void> | null = null;

/**
 * تهيئة مكتبات الأغذية والتمارين والتحويلات والوصفات تلقائياً عند أول طلب.
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
