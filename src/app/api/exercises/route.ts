import { db } from "@/db";
import { exercises } from "@/db/schema";
import { isCoachAuthorized, unauthorized } from "@/lib/coach-auth";
import { ensureSeeded } from "@/lib/seed";
import { MUSCLE_GROUPS } from "@/lib/plans";
import { asc } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await isCoachAuthorized(req))) return unauthorized();
  try {
    await ensureSeeded();
    const rows = await db
      .select()
      .from(exercises)
      .orderBy(asc(exercises.muscleGroup), asc(exercises.name));
    return Response.json({ ok: true, data: rows });
  } catch (error) {
    console.error("GET /api/exercises", error);
    return Response.json({ ok: false, error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isCoachAuthorized(req))) return unauthorized();
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const name = String(body.name ?? "").trim();
    const muscleGroup = String(body.muscleGroup ?? "").trim();

    if (name.length < 2 || name.length > 80) {
      return Response.json({ ok: false, error: "برجاء إدخال اسم التمرين" }, { status: 400 });
    }
    if (!(MUSCLE_GROUPS as readonly string[]).includes(muscleGroup)) {
      return Response.json({ ok: false, error: "برجاء اختيار مجموعة العضلات" }, { status: 400 });
    }

    const [row] = await db
      .insert(exercises)
      .values({ name, muscleGroup, isCustom: true })
      .returning();
    return Response.json({ ok: true, data: row });
  } catch (error) {
    console.error("POST /api/exercises", error);
    return Response.json({ ok: false, error: "خطأ في الخادم" }, { status: 500 });
  }
}
