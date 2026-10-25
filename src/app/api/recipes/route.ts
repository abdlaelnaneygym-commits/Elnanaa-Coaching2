import { db } from "@/db";
import { recipes } from "@/db/schema";
import { isCoachAuthorized, unauthorized } from "@/lib/coach-auth";
import { ensureSeeded } from "@/lib/seed";
import { and, desc, eq, lte, gte } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RECIPE_CATEGORIES = ["إفطار", "غداء", "عشاء", "سناك", "حلويات دايت"];

/** عام — قائمة الوصفات مع فلترة بالفئة والسعرات (للمدرب والعملاء) */
export async function GET(req: Request) {
  try {
    await ensureSeeded();
    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    const maxKcal = Number(url.searchParams.get("maxKcal"));
    const minKcal = Number(url.searchParams.get("minKcal"));

    const conditions = [];
    if (category && RECIPE_CATEGORIES.includes(category)) {
      conditions.push(eq(recipes.category, category));
    }
    if (Number.isFinite(maxKcal) && maxKcal > 0) conditions.push(lte(recipes.calories, maxKcal));
    if (Number.isFinite(minKcal) && minKcal > 0) conditions.push(gte(recipes.calories, minKcal));

    const rows = await db
      .select()
      .from(recipes)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(recipes.createdAt))
      .limit(60);

    return Response.json({ ok: true, data: rows });
  } catch (error) {
    console.error("GET /api/recipes", error);
    return Response.json({ ok: true, data: [] });
  }
}

/** للمدرب — إضافة وصفة جديدة */
export async function POST(req: Request) {
  if (!(await isCoachAuthorized(req))) return unauthorized();
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const name = String(body.name ?? "").trim();
    const category = String(body.category ?? "").trim();
    const calories = Number(body.calories);
    const protein = Number(body.protein);
    const carbs = Number(body.carbs);
    const fats = Number(body.fats);
    const fiber = Number(body.fiber ?? 0);

    if (name.length < 2 || name.length > 90) {
      return Response.json({ ok: false, error: "برجاء إدخال اسم الوصفة" }, { status: 400 });
    }
    if (!RECIPE_CATEGORIES.includes(category)) {
      return Response.json({ ok: false, error: "برجاء اختيار فئة الوصفة" }, { status: 400 });
    }
    if (![calories, protein, carbs, fats].every((n) => Number.isFinite(n) && n >= 0)) {
      return Response.json({ ok: false, error: "القيم الغذائية يجب أن تكون أرقاماً غير سالبة" }, { status: 400 });
    }

    const ingredients = Array.isArray(body.ingredients)
      ? (body.ingredients as Array<Record<string, unknown>>)
          .map((ing) => ({
            name: String(ing.name ?? "").trim(),
            grams: Number(ing.grams) || 0,
            note: typeof ing.note === "string" ? ing.note : undefined,
          }))
          .filter((ing) => ing.name.length > 0 && ing.grams > 0)
      : [];

    const [row] = await db
      .insert(recipes)
      .values({
        name,
        nameEn: String(body.nameEn ?? "").trim() || null,
        category,
        ingredients,
        steps: String(body.steps ?? "").trim() || null,
        calories: Math.round(calories),
        protein: Math.round(protein * 10) / 10,
        carbs: Math.round(carbs * 10) / 10,
        fats: Math.round(fats * 10) / 10,
        fiber: Math.round(fiber * 10) / 10,
        image: typeof body.image === "string" && body.image.startsWith("data:") ? body.image : null,
      })
      .returning();

    return Response.json({ ok: true, data: row });
  } catch (error) {
    console.error("POST /api/recipes", error);
    return Response.json({ ok: false, error: "خطأ في الخادم" }, { status: 500 });
  }
}
