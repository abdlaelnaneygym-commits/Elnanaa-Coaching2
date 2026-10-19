import { db } from "@/db";
import { foods } from "@/db/schema";
import { isCoachAuthorized, unauthorized } from "@/lib/coach-auth";
import { ensureSeeded } from "@/lib/seed";
import { asc } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await isCoachAuthorized(req))) return unauthorized();
  try {
    await ensureSeeded();
    const rows = await db.select().from(foods).orderBy(asc(foods.category), asc(foods.name));
    return Response.json({ ok: true, data: rows });
  } catch (error) {
    console.error("GET /api/foods", error);
    return Response.json({ ok: false, error: "خطأ في الخادم" }, { status: 500 });
  }
}

function parseFoodBody(body: Record<string, unknown>) {
  const name = String(body.name ?? "").trim();
  const category = String(body.category ?? "").trim() || "أخرى";
  const kcal = Number(body.kcal);
  const protein = Number(body.protein);
  const carbs = Number(body.carbs);
  const fats = Number(body.fats);

  if (name.length < 2 || name.length > 80) return null;
  if (![kcal, protein, carbs, fats].every((n) => Number.isFinite(n) && n >= 0 && n <= 1000)) {
    return null;
  }
  if (kcal === 0 && protein === 0 && carbs === 0 && fats === 0) return null;

  return {
    name,
    category,
    kcal: Math.round(kcal * 10) / 10,
    protein: Math.round(protein * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    fats: Math.round(fats * 10) / 10,
    isCustom: true,
  };
}

export async function POST(req: Request) {
  if (!(await isCoachAuthorized(req))) return unauthorized();
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const values = parseFoodBody(body);
    if (!values) {
      return Response.json(
        { ok: false, error: "برجاء إدخال بيانات الطعام بشكل صحيح" },
        { status: 400 },
      );
    }
    const [row] = await db.insert(foods).values(values).returning();
    return Response.json({ ok: true, data: row });
  } catch (error) {
    console.error("POST /api/foods", error);
    return Response.json({ ok: false, error: "خطأ في الخادم" }, { status: 500 });
  }
}
