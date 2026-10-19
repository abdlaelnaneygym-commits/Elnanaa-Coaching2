import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { isCoachAuthorized, unauthorized } from "@/lib/coach-auth";
import { desc, eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await isCoachAuthorized(req))) return unauthorized();
  try {
    const rows = await db
      .select()
      .from(subscriptions)
      .orderBy(desc(subscriptions.createdAt))
      .limit(200);
    return Response.json({ ok: true, data: rows });
  } catch (error) {
    console.error("GET /api/coach/subscriptions", error);
    return Response.json({ ok: false, error: "خطأ في الخادم" }, { status: 500 });
  }
}

/** تغيير حالة الاشتراك: pending | active | done */
export async function PATCH(req: Request) {
  if (!(await isCoachAuthorized(req))) return unauthorized();
  try {
    const body = (await req.json().catch(() => null)) as {
      id?: number;
      status?: string;
    } | null;
    const status = body?.status;
    if (!body?.id || !status || !["pending", "active", "done"].includes(status)) {
      return Response.json({ ok: false, error: "بيانات غير صالحة" }, { status: 400 });
    }
    await db
      .update(subscriptions)
      .set({ status })
      .where(eq(subscriptions.id, body.id));
    return Response.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/coach/subscriptions", error);
    return Response.json({ ok: false, error: "خطأ في الخادم" }, { status: 500 });
  }
}
