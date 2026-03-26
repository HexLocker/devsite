"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Menu, X, ShoppingCart, User, ArrowRight, ChevronDown } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import type { NavItem, LogoShape } from "@/lib/nav/types";

interface PhoneNavbarProps {
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

export default function PhoneNavbar({ siteName = "DevSite", logoUrl = "", logoShape = "square", navItems = [] }: PhoneNavbarProps) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems());
  const { user, logout } = useAuthStore();
  const [expandedDropdown, setExpandedDropdown] = useState<string | null>(null);

  const close = useCallback(() => { setOpen(false); setExpandedDropdown(null); }, []);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Sticky header bar */}
      <header className="sticky top-0 z-40 w-full px-3 pt-2.5">
        <div className="relative mx-auto flex items-center justify-between rounded-2xl border border-white/[0.06] bg-[#0c0c14]/70 backdrop-blur-2xl px-4 py-3 overflow-hidden">
          {/* Gradient glow */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden">
            <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 h-[200%] w-[60%] bg-gradient-to-b from-indigo-500/[0.07] via-transparent to-transparent blur-2xl" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent" />
          </div>

          <Link href="/" className="relative z-10 font-heading text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={siteName} className={`h-7 w-auto object-contain ${LOGO_SHAPE_CLASS[logoShape]}`} />
            ) : null}
            <span>{siteName}</span>
          </Link>

          <div className="relative z-10 flex items-center gap-1">
            <Link href="/cart" className="relative rounded-lg p-2 text-zinc-400 hover:text-white transition-colors" aria-label={t("cart")}>
              <ShoppingCart size={20} strokeWidth={1.8} />
              {mounted && totalItems > 0 && (
                <span className="absolute top-0.5 right-0.5 flex h-[17px] w-[17px] items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white ring-2 ring-[#0c0c14]">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Apri menu"
              className="rounded-lg p-2 text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
            >
              <Menu size={22} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </header>

      {/* Full-screen overlay */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ease-out ${
          open ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
      >
        {/* Dark gradient background */}
        <div className="absolute inset-0 bg-[#09090B]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-indigo-500/[0.04] via-transparent to-transparent" />

        <div className="relative flex h-full flex-col px-6 py-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="font-heading text-lg font-extrabold text-white flex items-center gap-2">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={siteName} className={`h-7 w-auto object-contain ${LOGO_SHAPE_CLASS[logoShape]}`} />
              ) : null}
              {siteName}
            </span>
            <button
              type="button"
              onClick={close}
              className="rounded-lg p-2 text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
              aria-label="Chiudi menu"
            >
              <X size={22} strokeWidth={1.8} />
            </button>
          </div>

          {/* Nav items */}
          <nav className="mt-10 flex-1 overflow-y-auto">
            {navItems.map((item, i) => (
              <div key={item.id}>
                {item.type === "link" && item.href ? (
                  <Link
                    href={item.href}
                    onClick={close}
                    className="flex items-center justify-between py-4 text-2xl font-semibold text-white border-b border-white/[0.06] hover:opacity-60 transition-opacity"
                    style={{ transitionDelay: open ? `${i * 35}ms` : "0ms" }}
                  >
                    {item.label}
                    <ArrowRight size={18} className="text-zinc-600" strokeWidth={1.5} />
                  </Link>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setExpandedDropdown(expandedDropdown === item.id ? null : item.id)}
                      className="flex w-full items-center justify-between py-4 text-2xl font-semibold text-white border-b border-white/[0.06] hover:opacity-60 transition-opacity cursor-pointer"
                    >
                      {item.label}
                      <ChevronDown
                        size={20}
                        className={`text-zinc-500 transition-transform duration-200 ${expandedDropdown === item.id ? "rotate-180" : ""}`}
                        strokeWidth={1.5}
                      />
                    </button>
                    {expandedDropdown === item.id && item.children && item.children.length > 0 && (
                      <div className="pl-4 border-b border-white/[0.06]">
                        {item.children.map((child) =>
                          child.href ? (
                            <Link
                              key={child.id}
                              href={child.href}
                              onClick={close}
                              className="flex items-center justify-between py-3 text-lg font-medium text-zinc-400 hover:text-white transition-colors"
                            >
                              {child.label}
                              <ArrowRight size={14} className="text-zinc-700" strokeWidth={1.5} />
                            </Link>
                          ) : null
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </nav>

          {/* Bottom actions */}
          <div className="space-y-2.5 pb-6 pt-4">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-sm text-zinc-500 mb-3">
                  <User size={15} strokeWidth={1.8} />
                  <span>{user.name ?? user.email.split("@")[0]}</span>
                </div>
                <Link
                  href="/account"
                  onClick={close}
                  className="block w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-3 text-center text-sm font-semibold text-zinc-200 hover:bg-white/[0.07] transition-colors"
                >
                  {t("account")}
                </Link>
                {(user.role === "ADMIN" || user.role === "EDITOR") && (
                  <Link
                    href="/admin"
                    onClick={close}
                    className="block w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-3 text-center text-sm font-semibold text-zinc-200 hover:bg-white/[0.07] transition-colors"
                  >
                    {t("admin")}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => { logout(); close(); }}
                  className="block w-full rounded-xl bg-red-500/10 border border-red-500/20 py-3 text-center text-sm font-semibold text-red-400 hover:bg-red-500/15 transition-colors cursor-pointer"
                >
                  {t("logout")}
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={close}
                className="block w-full rounded-xl bg-indigo-500/15 border border-indigo-400/20 py-3.5 text-center text-sm font-semibold text-indigo-300 hover:bg-indigo-500/25 transition-colors"
              >
                {t("login")}
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}