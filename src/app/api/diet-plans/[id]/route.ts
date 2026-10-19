import { db } from "@/db";
import { dietPlans } from "@/db/schema";
import { isCoachAuthorized, unauthorized } from "@/lib/coach-auth";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isCoachAuthorized(req))) return unauthorized();
  const { id } = await ctx.params;
  const rowId = Number(id);
  if (!Number.isInteger(rowId)) {
    return Response.json({ ok: false, error: "معرّف غير صالح" }, { status: 400 });
  }
  try {
    const body = (await req.json().catch(() => ({}))) as { status?: string };
    if (!body.status || !["draft", "confirmed"].includes(body.status)) {
      return Response.json({ ok: false, error: "حالة غير صالحة" }, { status: 400 });
    }
    await db.update(dietPlans).set({ status: body.status }).where(eq(dietPlans.id, rowId));
    return Response.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/diet-plans/[id]", error);
    return Response.json({ ok: false, error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isCoachAuthorized(req))) return unauthorized();
  const { id } = await ctx.params;
  const rowId = Number(id);
  if (!Number.isInteger(rowId)) {
    return Response.json({ ok: false, error: "معرّف غير صالح" }, { status: 400 });
  }
  try {
    await db.delete(dietPlans).where(eq(dietPlans.id, rowId));
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/diet-plans/[id]", error);
    return Response.json({ ok: false, error: "خطأ في الخادم" }, { status: 500 });
  }
}
