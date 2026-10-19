"use client";

import type { SubscriptionRow } from "@/db/schema";
import { PACKAGE_OPTIONS } from "@/lib/calories";
import { resolveUpload } from "@/lib/plans";
import {
  Calculator,
  CreditCard,
  FileText,
  Phone,
  UserRound,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState, LoadingGrid } from "./ui";
import type { CalcPrefill } from "./CoachCalculator";

const SUB_STATUS: Record<string, { label: string; classes: string }> = {
  pending: { label: "قيد المراجعة", classes: "border-yellow-400/40 bg-yellow-500/10 text-yellow-200" },
  active: { label: "نشط", classes: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200" },
  done: { label: "منتهي", classes: "border-white/20 bg-white/5 text-bone/60" },
};

function fmtDate(value: string | Date) {
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(new Date(value));
}

export default function ClientRequests({
  headers,
  onPrefill,
}: {
  headers: Record<string, string>;
  onPrefill: (prefill: CalcPrefill) => void;
}) {
  const [subs, setSubs] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch("/api/coach/subscriptions", { headers, cache: "no-store" });
      const json = await res.json();
      if (json.ok) setSubs(json.data ?? []);
    } catch {
      /* تجاهل */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(sub: SubscriptionRow, status: string) {
    setSubs((prev) => prev.map((s) => (s.id === sub.id ? { ...s, status } : s)));
    await fetch("/api/coach/subscriptions", {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ id: sub.id, status }),
    });
    load();
  }

  if (loading) return <LoadingGrid count={4} height="h-56" />;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-[1.5rem] border border-white/10 bg-coal-900/70 p-4 sm:p-6">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold-500/15 text-gold-300">
          <Users size={20} />
        </span>
        <div>
          <h2 className="text-sm font-black sm:text-base">طلبات العملاء</h2>
          <p className="mt-0.5 text-[11px] text-bone/45">
            {subs.length} طلب اشتراك — اضغط «احسب وأنشئ خطة» لتعبئة الحاسبة ببيانات العميل مباشرة
          </p>
        </div>
      </div>

      {subs.length === 0 ? (
        <EmptyState
          icon={Users}
          text="لا توجد طلبات اشتراك — عندما يسجل العملاء من الصفحة الرئيسية ستظهر بياناتهم وملفاتهم هنا."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {subs.map((sub) => {
            const pkg = PACKAGE_OPTIONS.find((p) => p.id === sub.packageId);
            const status = SUB_STATUS[sub.status] ?? SUB_STATUS.pending;
            const uploads = [
              { name: sub.inbodyFile, label: "InBody", isPdf: true },
              { name: sub.frontPhoto, label: "أمامية", isPdf: false },
              { name: sub.sidePhoto, label: "جانبية", isPdf: false },
              { name: sub.backPhoto, label: "خلفية", isPdf: false },
            ].filter((f) => f.name);

            return (
              <article
                key={sub.id}
                className="rounded-[1.25rem] border border-white/10 bg-coal-900/70 p-4 sm:rounded-[1.5rem] sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="flex items-center gap-2 text-base font-black">
                      <UserRound size={16} className="text-gold-400" />
                      {sub.name}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-semibold text-bone/50">
                      <span className="flex items-center gap-1" dir="ltr">
                        <Phone size={11} />
                        {sub.phone}
                      </span>
                      <span>
                        {sub.age} سنة • {sub.gender === "male" ? "ذكر" : "أنثى"}
                      </span>
                      <span>
                        {sub.weight} كجم • {sub.height} سم
                      </span>
                      <span>{fmtDate(sub.createdAt)}</span>
                    </div>
                  </div>
                  <span className={`rounded-full border px-3 py-1.5 text-[10px] font-black ${status.classes}`}>
                    {status.label}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-gold-500/15 px-3 py-1.5 text-[10px] font-black text-gold-300">
                    {pkg?.title ?? sub.packageId} — {pkg?.price} ج.م
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-black text-bone/60">
                    <CreditCard size={11} className="text-gold-400" />
                    {sub.paymentMethod === "instapay" ? "InstaPay" : "فودافون كاش"}
                  </span>
                  <span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-bold text-bone/50">
                    {sub.goal}
                  </span>
                </div>

                {uploads.length > 0 && (
                  <div className="mt-3.5 flex flex-wrap gap-2 sm:gap-2.5">
                    {uploads.map((file) => (
                      <a
                        key={file.name}
                        href={resolveUpload(file.name)}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative block h-16 w-16 overflow-hidden rounded-xl border border-white/10 transition hover:border-gold-500/50"
                        title={file.label}
                      >
                        {file.isPdf ? (
                          <span className="grid h-full w-full place-items-center bg-white/[0.04] text-gold-300">
                            <FileText size={18} />
                          </span>
                        ) : (
                          <img
                            src={resolveUpload(file.name)}
                            alt={file.label}
                            className="h-full w-full object-cover transition group-hover:scale-110"
                          />
                        )}
                        <span className="absolute inset-x-0 bottom-0 bg-coal-950/80 py-0.5 text-center text-[8px] font-black">
                          {file.label}
                        </span>
                      </a>
                    ))}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2 border-t border-white/5 pt-4">
                  <button
                    onClick={() =>
                      onPrefill({
                        name: sub.name,
                        age: sub.age,
                        gender: sub.gender === "female" ? "female" : "male",
                        weight: sub.weight,
                        height: sub.height,
                        goal:
                          sub.goal.includes("تخسيس")
                            ? "lose"
                            : sub.goal.includes("تضخيم")
                              ? "gain"
                              : "maintain",
                      })
                    }
                    className="btn-shine inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-l from-gold-300 to-gold-600 px-5 py-2.5 text-[11px] font-black text-coal-950"
                  >
                    <Calculator size={13} />
                    احسب وأنشئ خطة
                  </button>
                  {sub.status !== "active" && (
                    <button
                      onClick={() => setStatus(sub, "active")}
                      className="rounded-full border border-emerald-400/40 px-4 py-2.5 text-[10px] font-black text-emerald-200 transition hover:bg-emerald-500/10"
                    >
                      تفعيل
                    </button>
                  )}
                  {sub.status === "active" && (
                    <button
                      onClick={() => setStatus(sub, "done")}
                      className="rounded-full border border-white/15 px-4 py-2.5 text-[10px] font-black text-bone/60 transition hover:bg-white/5"
                    >
                      إنهاء
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
