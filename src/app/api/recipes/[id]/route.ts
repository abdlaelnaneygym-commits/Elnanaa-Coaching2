import { db } from "@/db";
import { recipes } from "@/db/schema";
import { isCoachAuthorized, unauthorized } from "@/lib/coach-auth";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

/** حذف وصفة — للمدرب فقط */
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isCoachAuthorized(req))) return unauthorized();
  const { id } = await ctx.params;
  const recipeId = Number(id);
  if (!Number.isInteger(recipeId)) {
    return Response.json({ ok: false, error: "معرّف غير صالح" }, { status: 400 });
  }
  try {
    await db.delete(recipes).where(eq(recipes.id, recipeId));
    return Response.json({ ok: true, message: "تم حذف الوصفة من قاعدة البيانات" });
  } catch (error) {
    console.error("DELETE /api/recipes/[id]", error);
    return Response.json({ ok: false, error: "خطأ في الخادم" }, { status: 500 });
  }
}
