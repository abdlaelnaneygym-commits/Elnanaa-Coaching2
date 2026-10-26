import { db } from "@/db";
import { dietPlans } from "@/db/schema";
import { isCoachAuthorized, unauthorized } from "@/lib/coach-auth";
import { ensureSchema } from "@/lib/ensure-schema";
import type { Meal } from "@/lib/plans";
import { desc } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validItems(items: unknown): items is Meal["items"] {
  if (!Array.isArray(items)) return false;
  return items.every((item: unknown) => {
    if (!item || typeof item !== "object") return false;
    const it = item as Partial<Meal["items"][number]>;
    return (
      typeof it.name === "string" &&
      typeof it.grams === "number" &&
      Number.isFinite(it.grams) &&
      it.grams > 0
    );
  });
}

/** وجبات صالحة — تدعم خيارات بديلة: items مباشرة أو options[{items}] */
function validMeals(meals: unknown): meals is Meal[] {
  if (!Array.isArray(meals) || meals.length === 0) return false;
  return meals.every((meal: unknown) => {
    if (!meal || typeof meal !== "object") return false;
    const m = meal as Partial<Meal>;
    if (typeof m.name !== "string") return false;
    // صيغة الخيارات البديلة
    if (Array.isArray(m.options) && m.options.length > 0) {
      return m.options.every(
        (opt) =>
          opt && typeof opt === "object" && typeof opt.name === "string" && validItems(opt.items),
      );
    }
    // الصيغة المباشرة (توافق قديم)
    if (!Array.isArray(m.items)) return false;
    return validItems(m.items);
  });
}

export async function GET(req: Request) {
  if (!(await isCoachAuthorized(req))) return unauthorized();
  await ensureSchema();
  try {
    const rows = await db
      .select()
      .from(dietPlans)
      .orderBy(desc(dietPlans.createdAt))
      .limit(100);
    return Response.json({ ok: true, data: rows });
  } catch (error) {
    console.error("GET /api/diet-plans", error);
    return Response.json({ ok: false, error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isCoachAuthorized(req))) return unauthorized();
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const clientName = String(body.clientName ?? "").trim();
    const targetCalories = Number(body.targetCalories);
    const targetProtein = Number(body.targetProtein);
    const targetCarbs = Number(body.targetCarbs);
    const targetFats = Number(body.targetFats);
    const calculationId = Number(body.calculationId);
    const status = body.status === "confirmed" ? "confirmed" : "draft";
    const notes = String(body.notes ?? "").trim();

    if (clientName.length < 2) {
      return Response.json({ ok: false, error: "اسم العميل مطلوب" }, { status: 400 });
    }
    if (!Number.isFinite(targetCalories) || targetCalories < 500 || targetCalories > 8000) {
      return Response.json({ ok: false, error: "السعرات المستهدفة غير صالحة" }, { status: 400 });
    }
    if (!validMeals(body.meals)) {
      return Response.json({ ok: false, error: "برجاء إضافة وجبة واحدة على الأقل" }, { status: 400 });
    }

    const [row] = await db
      .insert(dietPlans)
      .values({
        clientName,
        calculationId: Number.isInteger(calculationId) ? calculationId : null,
        targetCalories: Math.round(targetCalories),
        targetProtein: Number.isFinite(targetProtein) ? Math.round(targetProtein) : 0,
        targetCarbs: Number.isFinite(targetCarbs) ? Math.round(targetCarbs) : 0,
        targetFats: Number.isFinite(targetFats) ? Math.round(targetFats) : 0,
        meals: body.meals as Meal[],
        status,
        notes: notes || null,
      })
      .returning();

    return Response.json({ ok: true, data: row });
  } catch (error) {
    console.error("POST /api/diet-plans", error);
    return Response.json({ ok: false, error: "خطأ في الخادم" }, { status: 500 });
  }
}
