/**
 * معالجة الملفات المرفوعة كـ Data URL.
 * يتم ضغط الصور في المتصفح قبل الإرسال، ثم تُحفظ داخل قاعدة البيانات
 * مباشرة — وهذا يجعل التطبيق يعمل على أي استضافة (بما فيها Vercel)
 * بدون الحاجة لتخزين ملفات أو خدمات خارجية.
 */

const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const ALLOWED_DOC = [...ALLOWED_IMAGE, "application/pdf"];

/** الحد الأقصى لحجم النص (~3.5 ميجابايت بعد الترميز base64) */
const MAX_CHARS = 4.8 * 1024 * 1024;

/**
 * يقرأ حقل ملف من FormData كـ Data URL ويتحقق من نوعه وحجمه.
 * يرجع null إذا كان الحقل فارغاً أو غير صالح كـ Data URL.
 */
export function readDataUrlField(
  value: FormDataEntryValue | null,
  allowDocs = false,
): string | null {
  if (typeof value !== "string" || !value.startsWith("data:")) return null;

  if (value.length > MAX_CHARS) {
    throw new Error("حجم الملف كبير جداً — برجاء اختيار صورة أصغر");
  }

  const semi = value.indexOf(";");
  const mime = semi > 5 ? value.slice(5, semi) : "";
  const allowed = allowDocs ? ALLOWED_DOC : ALLOWED_IMAGE;

  if (!allowed.includes(mime)) {
    throw new Error("نوع ملف غير مدعوم — المسموح: صور أو PDF");
  }

  return value;
}
