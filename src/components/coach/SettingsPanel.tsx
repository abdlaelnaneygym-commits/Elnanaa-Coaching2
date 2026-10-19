"use client";

import { KeyRound, Loader2, Lock, ShieldCheck, TriangleAlert } from "lucide-react";
import { useState } from "react";

export default function SettingsPanel({
  headers,
  onPinChanged,
}: {
  headers: Record<string, string>;
  onPinChanged: (newPin: string) => void;
}) {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPin.length < 6) {
      setError("كلمة السر الجديدة يجب أن تكون 6 أحرف أو أرقام على الأقل");
      return;
    }
    if (newPin !== confirmPin) {
      setError("كلمة السر الجديدة وتأكيدها غير متطابقين");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/coach/settings", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ currentPin, newPin }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "تعذّر تحديث كلمة السر");
        return;
      }
      setSuccess(
        "تم تحديث كلمة السر بنجاح — استخدمها في الدخول القادم (لا تنساها!)",
      );
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      onPinChanged(newPin);
    } catch {
      setError("تعذّر الاتصال بالخادم");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-start gap-3 rounded-[1.5rem] border border-white/10 bg-coal-900/70 p-4 sm:p-6">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold-500/15 text-gold-300">
          <KeyRound size={20} />
        </span>
        <div>
          <h2 className="text-sm font-black sm:text-base">إعدادات الأمان</h2>
          <p className="mt-0.5 text-[11px] leading-5 text-bone/45">
            غيّر كلمة سر لوحة التحكم في أي وقت — تُحفظ في قاعدة البيانات وتعمل
            فوراً على كل الأجهزة.
          </p>
        </div>
      </div>

      <form
        onSubmit={submit}
        className="space-y-4 rounded-[1.5rem] border border-white/10 bg-coal-900/70 p-4 sm:p-6"
      >
        <div>
          <label className="mb-1.5 block text-[11px] font-bold text-bone/60">
            كلمة السر الحالية *
          </label>
          <input
            required
            type="password"
            dir="ltr"
            value={currentPin}
            onChange={(e) => setCurrentPin(e.target.value)}
            className="field text-left"
            placeholder="••••••••"
          />
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-bone/60">
              كلمة السر الجديدة *
            </label>
            <input
              required
              type="password"
              dir="ltr"
              minLength={6}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              className="field text-left"
              placeholder="6 أحرف على الأقل"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-bone/60">
              تأكيد كلمة السر الجديدة *
            </label>
            <input
              required
              type="password"
              dir="ltr"
              minLength={6}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              className="field text-left"
              placeholder="أعد كتابة كلمة السر"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-[11px] font-bold leading-6 text-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-[11px] font-bold leading-6 text-emerald-200">
            <ShieldCheck size={15} className="mt-0.5 shrink-0" />
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="btn-shine flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-l from-gold-300 to-gold-600 py-3.5 text-sm font-black text-coal-950 transition-transform duration-300 hover:scale-[1.01] disabled:opacity-60"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
          تحديث كلمة السر
        </button>
      </form>

      <div className="flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/[0.07] px-4 py-3.5">
        <TriangleAlert size={17} className="mt-0.5 shrink-0 text-amber-300" />
        <p className="text-[11px] leading-6 text-amber-200/85">
          <span className="font-black">تنبيه:</span> إذا نسيت كلمة السر الجديدة لن
          تستطيع الدخول للوحة — احفظها في مكان آمن. ولإعادتها للافتراضية يمكن حذف
          السجل <span dir="ltr" className="font-mono">coach_pin</span> من جدول{" "}
          <span dir="ltr" className="font-mono">settings</span> في قاعدة البيانات.
        </p>
      </div>
    </div>
  );
}
