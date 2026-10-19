import { db } from "@/db";
import { calculations } from "@/db/schema";
import { isCoachAuthorized, unauthorized } from "@/lib/coach-auth";
import { desc, eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** قائمة طلبات حاسبة السعرات بالنتائج الكاملة — للمدرب فقط */
export async function GET(req: Request) {
  if (!(await isCoachAuthorized(req))) return unauthorized();
  try {
    const rows = await db
      .select()
      .from(calculations)
      .orderBy(desc(calculations.createdAt))
      .limit(200);
    return Response.json({ ok: true, data: rows });
  } catch (error) {
    console.error("GET /api/coach/calculations", error);
    return Response.json({ ok: false, error: "خطأ في الخادم" }, { status: 500 });
  }
}

/** تحديث حالة الطلب (تمت مراجعته) */
export async function PATCH(req: Request) {
  if (!(await isCoachAuthorized(req))) return unauthorized();
  try {
    const body = (await req.json().catch(() => null)) as {
      id?: number;
      resolved?: boolean;
    } | null;
    if (!body?.id) {
      return Response.json({ ok: false, error: "معرّف غير صالح" }, { status: 400 });
    }
    await db
      .update(calculations)
      .set({ resolved: Boolean(body.resolved) })
      .where(eq(calculations.id, body.id));
    return Response.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/coach/calculations", error);
    return Response.json({ ok: false, error: "خطأ في الخادم" }, { status: 500 });
  }
}

/** حذف طلب */
export async function DELETE(req: Request) {
  if (!(await isCoachAuthorized(req))) return unauthorized();
  try {
    const body = (await req.json().catch(() => null)) as { id?: number } | null;
    if (!body?.id) {
      return Response.json({ ok: false, error: "معرّف غير صالح" }, { status: 400 });
    }
    await db.delete(calculations).where(eq(calculations.id, body.id));
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/coach/calculations", error);
    return Response.json({ ok: false, error: "خطأ في الخادم" }, { status: 500 });
  }
}
