import type { SVGProps } from "react";
import { LayoutDashboard, Mail, MessageCircle } from "lucide-react";
import Link from "next/link";
import { LogoMark } from "./Header";

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function YoutubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  );
}

/* روابط التواصل الرسمية — مكتوبة مباشرة في الكود */
export const WHATSAPP_NUMBER = "01009611266";
export const WHATSAPP_URL = "https://wa.me/+201009611266";
export const INSTAGRAM_URL =
  "https://www.instagram.com/c_abdullahelnanna?rpxt=MWxkdmtueThuNmtrMw==";
export const FACEBOOK_URL = "https://www.facebook.com/share/1FQZeBto6S/";
export const YOUTUBE_URL =
  "https://youtube.com/@abdullah_elnana?si=K-I_pxrLyQhwP5sB";

const SOCIALS = [
  { icon: InstagramIcon, label: "انستجرام", href: INSTAGRAM_URL },
  { icon: FacebookIcon, label: "فيسبوك", href: FACEBOOK_URL },
  { icon: YoutubeIcon, label: "يوتيوب", href: YOUTUBE_URL },
  { icon: MessageCircle, label: "واتساب", href: WHATSAPP_URL },
];

const LINKS = [
  { href: "#about", label: "عن الكابتن" },
  { href: "#transformations", label: "تحوّلات العملاء" },
  { href: "#packages", label: "باقات الاشتراك" },
  { href: "#register", label: "نموذج التسجيل" },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-coal-900/50">
      <div className="pointer-events-none absolute inset-x-0 -bottom-10 select-none text-center text-[16vw] font-black leading-none text-outline-faint">
        ELNANAA
      </div>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 lg:grid-cols-3 lg:gap-12 lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <LogoMark size={48} />
            <div className="leading-none">
              <div className="text-xl font-black tracking-[0.22em]">ELNANAA</div>
              <div className="mt-1.5 text-[10px] font-bold tracking-[0.42em] text-gold-400">
                COACHING • النعناع
              </div>
            </div>
          </div>
          <p className="mt-6 max-w-sm text-xs leading-7 text-bone/55">
            المنصة الرسمية للكابتن عبد الله النعناع — تدريب شخصي أونلاين، أنظمة
            غذائية مدروسة، ومتابعة حقيقية تصنع تحولاً يدوم.
          </p>
          <div className="mt-6 flex gap-3">
            {SOCIALS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                aria-label={social.label}
                className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 text-bone/60 transition-all duration-300 hover:border-gold-500/60 hover:bg-gold-500 hover:text-coal-950"
              >
                <social.icon size={18} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black tracking-widest text-gold-400">روابط سريعة</h3>
          <ul className="mt-6 space-y-3.5">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm font-semibold text-bone/60 transition-colors duration-300 hover:text-gold-300"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-black tracking-widest text-gold-400">تواصل معنا</h3>
          <ul className="mt-6 space-y-4 text-sm text-bone/60">
            <li>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 transition-colors duration-300 hover:text-gold-300"
              >
                <MessageCircle size={16} className="text-gold-400" />
                <span dir="ltr">{WHATSAPP_NUMBER}</span>
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={16} className="text-gold-400" />
              coach@elnanaa.com
            </li>
          </ul>
          <Link
            href="/coach"
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-gold-500/40 px-6 py-2.5 text-xs font-black text-gold-300 transition-all duration-300 hover:bg-gold-500 hover:text-coal-950"
          >
            <LayoutDashboard size={15} />
            لوحة تحكم المدرب
          </Link>
        </div>
      </div>

      <div className="relative border-t border-white/[0.07] py-6 text-center text-[11px] font-semibold text-bone/40">
        © {new Date().getFullYear()} Elnanaa Coaching — كابتن عبد الله النعناع. جميع الحقوق محفوظة.
      </div>
    </footer>
  );
}
