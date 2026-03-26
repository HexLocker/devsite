"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ShoppingCart, User, ChevronDown } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import type { NavItem, LogoShape } from "@/lib/nav/types";

interface PcNavbarProps {
  siteName?: string;
  logoUrl?: string;
  logoShape?: LogoShape;
  navItems?: NavItem[];
}

const LOGO_SHAPE_CLASS: Record<LogoShape, string> = {
  square: "rounded-none",
  rounded: "rounded-xl",
  circle: "rounded-full",
};

export default function PcNavbar({ siteName = "DevSite", logoUrl = "", logoShape = "square", navItems = [] }: PcNavbarProps) {
  const t = useTranslations("nav");
  const totalItems = useCartStore((s) => s.totalItems());
  const { user, logout } = useAuthStore();
  const [userOpen, setUserOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full px-4 pt-3">
      <nav
        className={`relative mx-auto flex max-w-5xl items-center justify-between rounded-2xl border px-5 py-3 transition-all duration-300 ${
          scrolled
            ? "border-white/[0.08] bg-[#0c0c14]/80 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            : "border-white/[0.06] bg-[#0c0c14]/60 backdrop-blur-xl"
        }`}
      >
        {/* Gradient glow effect */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden">
          <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 h-[200%] w-[60%] bg-gradient-to-b from-indigo-500/[0.07] via-transparent to-transparent blur-2xl" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent" />
        </div>

        {/* Logo */}
        <Link
          href="/"
          className="relative z-10 font-heading text-lg font-extrabold tracking-tight text-white hover:opacity-80 transition-opacity flex items-center gap-2.5 flex-shrink-0"
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={siteName} className={`h-7 w-auto object-contain ${LOGO_SHAPE_CLASS[logoShape]}`} />
          ) : null}
          <span>{siteName}</span>
        </Link>

        {/* Nav links */}
        <ul className="relative z-10 flex items-center gap-1">
          {navItems.map((item) => (
            <li
              key={item.id}
              className="relative"
              onMouseEnter={() => item.type === "dropdown" ? setOpenDropdown(item.id) : undefined}
              onMouseLeave={() => item.type === "dropdown" ? setOpenDropdown(null) : undefined}
            >
              {item.type === "link" && item.href ? (
                <Link
                  href={item.href}
                  className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-zinc-400 transition-all duration-200 hover:text-white hover:bg-white/[0.06]"
                >
                  {item.label}
                </Link>
              ) : (
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-lg px-3.5 py-2 text-[13px] font-medium text-zinc-400 transition-all duration-200 hover:text-white hover:bg-white/[0.06] cursor-pointer"
                >
                  {item.label}
                  <ChevronDown size={12} className={`transition-transform duration-200 ${openDropdown === item.id ? "rotate-180" : ""}`} />
                </button>
              )}

              {item.type === "dropdown" && openDropdown === item.id && item.children && item.children.length > 0 && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 z-50">
                  <div className="min-w-[200px] overflow-hidden rounded-xl border border-white/[0.08] bg-[#111118]/95 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] animate-slide-down">
                    {item.children.map((child) =>
                      child.href ? (
                        <Link
                          key={child.id}
                          href={child.href}
                          className="block px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/[0.05] transition-colors"
                        >
                          {child.label}
                        </Link>
                      ) : null
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>

        {/* Right: cart + user */}
        <div className="relative z-10 flex items-center gap-2 flex-shrink-0">
          <Link
            href="/cart"
            className="relative rounded-lg p-2 text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all"
            aria-label={t("cart")}
          >
            <ShoppingCart size={18} strokeWidth={1.8} />
            {mounted && totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-[17px] w-[17px] items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white ring-2 ring-[#0c0c14]">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[13px] font-medium text-zinc-300 hover:text-white hover:border-white/15 hover:bg-white/[0.07] transition-all cursor-pointer"
              >
                <User size={14} strokeWidth={1.8} />
                <span className="max-w-[90px] truncate">{user.name ?? user.email.split("@")[0]}</span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${userOpen ? "rotate-180" : ""}`} />
              </button>
              {userOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-white/[0.08] bg-[#111118]/95 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] animate-slide-down">
                    <Link
                      href="/account"
                      className="block px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/[0.05] transition-colors"
                      onClick={() => setUserOpen(false)}
                    >
                      {t("account")}
                    </Link>
                    {(user.role === "ADMIN" || user.role === "EDITOR") && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/[0.05] transition-colors"
                        onClick={() => setUserOpen(false)}
                      >
                        {t("admin")}
                      </Link>
                    )}
                    <div className="my-1 h-px bg-white/[0.06]" />
                    <button
                      type="button"
                      onClick={() => { logout(); setUserOpen(false); }}
                      className="block w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      {t("logout")}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-indigo-500/15 border border-indigo-400/20 px-4 py-1.5 text-[13px] font-semibold text-indigo-300 hover:bg-indigo-500/25 hover:border-indigo-400/30 hover:text-indigo-200 transition-all"
            >
              {t("login")}
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}