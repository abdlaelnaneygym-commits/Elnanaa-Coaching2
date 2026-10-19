import { db } from "@/db";
import { foods } from "@/db/schema";
import { isCoachAuthorized, unauthorized } from "@/lib/coach-auth";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isCoachAuthorized(req))) return unauthorized();
  const { id } = await ctx.params;
  const foodId = Number(id);
  if (!Number.isInteger(foodId)) {
    return Response.json({ ok: false, error: "معرّف غير صالح" }, { status: 400 });
  }
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const name = String(body.name ?? "").trim();
    const kcal = Number(body.kcal);
    const protein = Number(body.protein);
    const carbs = Number(body.carbs);
    const fats = Number(body.fats);
    const category = String(body.category ?? "").trim();

    if (name.length < 2 || !Number.isFinite(kcal) || kcal < 0) {
      return Response.json({ ok: false, error: "بيانات غير صالحة" }, { status: 400 });
    }

    await db
      .update(foods)
      .set({
        name,
        category: category || "أخرى",
        kcal,
        protein: Number.isFinite(protein) ? protein : 0,
        carbs: Number.isFinite(carbs) ? carbs : 0,
        fats: Number.isFinite(fats) ? fats : 0,
      })
      .where(eq(foods.id, foodId));
    return Response.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/foods/[id]", error);
    return Response.json({ ok: false, error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isCoachAuthorized(req))) return unauthorized();
  const { id } = await ctx.params;
  const foodId = Number(id);
  if (!Number.isInteger(foodId)) {
    return Response.json({ ok: false, error: "معرّف غير صالح" }, { status: 400 });
  }
  try {
    await db.delete(foods).where(eq(foods.id, foodId));
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/foods/[id]", error);
    return Response.json({ ok: false, error: "خطأ في الخادم" }, { status: 500 });
  }
}
