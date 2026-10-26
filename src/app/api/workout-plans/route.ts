import { db } from "@/db";
import { workoutPlans } from "@/db/schema";
import { isCoachAuthorized, unauthorized } from "@/lib/coach-auth";
import { ensureSchema } from "@/lib/ensure-schema";
import type { WorkoutDay, WorkoutEntry } from "@/lib/plans";
import { desc } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validDays(days: unknown): days is WorkoutDay[] {
  if (!Array.isArray(days) || days.length === 0) return false;
  return days.every((day: unknown) => {
    if (!day || typeof day !== "object") return false;
    const d = day as Partial<WorkoutDay>;
    if (typeof d.title !== "string" || !Array.isArray(d.entries)) return false;
    return d.entries.every((entry: unknown) => {
      if (!entry || typeof entry !== "object") return false;
      const e = entry as Partial<WorkoutEntry>;
      return (
        typeof e.name === "string" &&
        typeof e.sets === "number" &&
        Number.isFinite(e.sets) &&
        e.sets > 0
      );
    });
  });
}

export async function GET(req: Request) {
  if (!(await isCoachAuthorized(req))) return unauthorized();
  await ensureSchema();
  try {
    const rows = await db
      .select()
      .from(workoutPlans)
      .orderBy(desc(workoutPlans.createdAt))
      .limit(100);
    return Response.json({ ok: true, data: rows });
  } catch (error) {
    console.error("GET /api/workout-plans", error);
    return Response.json({ ok: false, error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isCoachAuthorized(req))) return unauthorized();
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const clientName = String(body.clientName ?? "").trim();
    const dietPlanId = Number(body.dietPlanId);
    const notes = String(body.notes ?? "").trim();

    if (clientName.length < 2) {
      return Response.json({ ok: false, error: "اسم العميل مطلوب" }, { status: 400 });
    }
    if (!validDays(body.days)) {
      return Response.json(
        { ok: false, error: "برجاء إضافة يوم تدريبي واحد على الأقل بتمارين" },
        { status: 400 },
      );
    }

    const [row] = await db
      .insert(workoutPlans)
      .values({
        clientName,
        dietPlanId: Number.isInteger(dietPlanId) ? dietPlanId : null,
        days: body.days as WorkoutDay[],
        notes: notes || null,
      })
      .returning();

    return Response.json({ ok: true, data: row });
  } catch (error) {
    console.error("POST /api/workout-plans", error);
    return Response.json({ ok: false, error: "خطأ في الخادم" }, { status: 500 });
  }
}
