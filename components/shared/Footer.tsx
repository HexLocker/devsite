import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import type { NavItem } from "@/lib/nav/types";

export default async function Footer() {
  const t = await getTranslations("nav");
  const year = new Date().getFullYear();

  const settingsRows = await prisma.setting.findMany({
    where: { key: { in: ["site_name", "footer_text", "tagline", "nav_items", "admin_email", "contact_location"] } },
  });
  const s = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]));
  const siteName = String(s.site_name ?? "DevSite").replace(/^\"|\"$/g, "") || "DevSite";
  const tagline = String(s.tagline ?? "").replace(/^\"|\"$/g, "") || "Portfolio, blog e negozio online.";
  const footerText = String(s.footer_text ?? "").replace(/^\"|\"$/g, "") || `\u00A9 ${year} ${siteName}. Tutti i diritti riservati.`;
  const contactEmail = String(s.admin_email ?? "").replace(/^\"|\"$/g, "") || "";
  const contactLocation = String(s.contact_location ?? "").replace(/^\"|\"$/g, "") || "";

  const rawNav = s.nav_items;
  const navItems: NavItem[] = Array.isArray(rawNav)
    ? (rawNav as unknown as NavItem[])
    : [];

  const flatNavLinks: { label: string; href: string }[] = [];
  for (const item of navItems) {
    if (item.type === "link" && item.href) {
      flatNavLinks.push({ label: item.label, href: item.href });
    } else if (item.type === "dropdown" && item.children) {
      for (const child of item.children) {
        if (child.href) flatNavLinks.push({ label: child.label, href: child.href });
      }
    }
  }

  return (
    <footer className="relative mt-auto">
      {/* Gradient border top */}
      <div className="h-px bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent" />

      <div className="relative overflow-hidden bg-[#0c0c14]/80 backdrop-blur-xl">
        {/* Subtle gradient glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[300px] w-[50%] bg-gradient-to-b from-indigo-500/[0.04] via-transparent to-transparent blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 py-14 lg:px-8">
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-1">
              <p className="font-heading text-xl font-extrabold tracking-tight text-white">{siteName}</p>
              <p className="mt-3 text-sm text-zinc-500 leading-relaxed">
                {tagline}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-4">
                Navigazione
              </h3>
              <ul className="space-y-2.5">
                {flatNavLinks.map((link) => (
                  <li key={link.href + link.label}>
                    <Link href={link.href} className="text-sm text-zinc-400 transition-colors hover:text-indigo-300">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-4">
                Account
              </h3>
              <ul className="space-y-2.5">
                <li><Link href="/login" className="text-sm text-zinc-400 transition-colors hover:text-indigo-300">{t("login")}</Link></li>
                <li><Link href="/register" className="text-sm text-zinc-400 transition-colors hover:text-indigo-300">{t("register")}</Link></li>
                <li><Link href="/cart" className="text-sm text-zinc-400 transition-colors hover:text-indigo-300">{t("cart")}</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-4">
                Contatti
              </h3>
              <ul className="space-y-2.5">
                {contactEmail && <li className="text-sm text-zinc-400">{contactEmail}</li>}
                {contactLocation && <li className="text-sm text-zinc-400">{contactLocation}</li>}
                {!contactEmail && !contactLocation && (
                  <li className="text-sm text-zinc-600 italic">Nessun contatto configurato</li>
                )}
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-zinc-600">
              {footerText}
            </p>
            <p className="text-xs text-zinc-600">
              Forgiato da <span className="text-zinc-500 font-medium">HexLocker</span> &times; <span className="text-zinc-500 font-medium">SmithForgeLabs</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}