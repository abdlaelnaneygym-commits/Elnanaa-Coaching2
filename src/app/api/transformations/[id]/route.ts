import { db } from "@/db";
import { transformations } from "@/db/schema";
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
    const body = (await req.json().catch(() => ({}))) as { isPublished?: boolean };
    await db
      .update(transformations)
      .set({ isPublished: Boolean(body.isPublished) })
      .where(eq(transformations.id, rowId));
    return Response.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/transformations/[id]", error);
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
    await db.delete(transformations).where(eq(transformations.id, rowId));
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/transformations/[id]", error);
    return Response.json({ ok: false, error: "خطأ في الخادم" }, { status: 500 });
  }
}
