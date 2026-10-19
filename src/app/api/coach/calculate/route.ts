import { db } from "@/db";
import { calculations } from "@/db/schema";
import { assessCalories, validateCalcPayload } from "@/lib/calories";
import { isCoachAuthorized, unauthorized } from "@/lib/coach-auth";

export const runtime = "nodejs";

/**
 * حاسبة السعرات — للمدرب فقط.
 * تحسب وتحفظ وترجع النتائج الكاملة فوراً.
 */
export async function POST(req: Request) {
  if (!(await isCoachAuthorized(req))) return unauthorized();
  try {
    const body = await req.json().catch(() => null);
    const parsed = validateCalcPayload(body);
    if (!parsed.ok) {
      return Response.json({ ok: false, error: parsed.error }, { status: 400 });
    }

    const input = parsed.data;
    const result = assessCalories(input);

    const [row] = await db
      .insert(calculations)
      .values({
        name: input.name,
        age: input.age,
        gender: input.gender,
        weight: input.weight,
        height: input.height,
        activityLevel: input.activityLevel,
        goal: input.goal,
        isChild: result.isChild,
        equation: result.equation,
        bmr: result.bmr,
        tdee: result.tdee,
        bmi: result.bmi,
        targetCalories: result.targetCalories,
        needsSpecialist: result.needsSpecialist,
      })
      .returning();

    return Response.json({ ok: true, data: { id: row.id, input, result } });
  } catch (error) {
    console.error("POST /api/coach/calculate", error);
    return Response.json({ ok: false, error: "حدث خطأ غير متوقع" }, { status: 500 });
  }
}
