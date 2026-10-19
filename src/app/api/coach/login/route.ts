import { getCoachPin } from "@/lib/coach-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as { pin?: string } | null;
    const actual = await getCoachPin();
    if (!body?.pin || body.pin !== actual) {
      return Response.json(
        { ok: false, error: "كلمة السر غير صحيحة" },
        { status: 401 },
      );
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: "خطأ في الخادم" }, { status: 500 });
  }
}
