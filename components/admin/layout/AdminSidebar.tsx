"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  ShoppingBag,
  ClipboardList,
  Images,
  UsersRound,
  SlidersHorizontal,
  LayoutGrid,
  Star,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useAdminMenu } from "@/components/admin/layout/AdminMenuContext";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: { label: string; href: string }[];
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: "Articoli",
    icon: <FileText size={18} />,
    children: [
      { label: "Tutti gli articoli", href: "/admin/posts" },
      { label: "Aggiungi nuovo", href: "/admin/posts/new" },
    ],
  },
  {
    label: "Pagine",
    icon: <BookOpen size={18} />,
    children: [
      { label: "Tutte le pagine", href: "/admin/pages" },
      { label: "Aggiungi nuova", href: "/admin/pages/new" },
    ],
  },
  {
    label: "Prodotti",
    icon: <ShoppingBag size={18} />,
    children: [
      { label: "Tutti i prodotti", href: "/admin/products" },
      { label: "Aggiungi nuovo", href: "/admin/products/new" },
      { label: "Categorie", href: "/admin/products/categories" },
    ],
  },
  {
    label: "Ordini",
    href: "/admin/orders",
    icon: <ClipboardList size={18} />,
  },
  {
    label: "Feature Cards",
    href: "/admin/feature-cards",
    icon: <LayoutGrid size={18} />,
  },
  {
    label: "Recensioni",
    href: "/admin/reviews",
    icon: <Star size={18} />,
  },
  {
    label: "Media",
    icon: <Images size={18} />,
    children: [
      { label: "Libreria", href: "/admin/media" },
      { label: "Aggiungi nuovo", href: "/admin/media?upload=1" },
    ],
  },
  {
    label: "Utenti",
    icon: <UsersRound size={18} />,
    adminOnly: true,
    children: [
      { label: "Tutti gli utenti", href: "/admin/users" },
      { label: "Aggiungi nuovo", href: "/admin/users/new" },
    ],
  },
  {
    label: "Impostazioni",
    icon: <SlidersHorizontal size={18} />,
    adminOnly: true,
    children: [
      { label: "Generali", href: "/admin/settings?tab=generale" },
      { label: "Aspetto", href: "/admin/settings?tab=aspetto" },
      { label: "SEO", href: "/admin/settings?tab=seo" },
      { label: "Navigazione", href: "/admin/settings?tab=navigazione" },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";
  const { mobileOpen, setMobileOpen } = useAdminMenu();

  // Persist collapse state (desktop only)
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("admin_sidebar_collapsed") === "1";
  });

  // Open submenu if current path matches a child (strip query params for comparison)
  const defaultOpen = navItems.reduce((acc, item) => {
    if (item.children?.some((c) => pathname.startsWith(c.href.split("?")[0]))) {
      acc[item.label] = true;
    }
    return acc;
  }, {} as Record<string, boolean>);
  const [open, setOpen] = useState<Record<string, boolean>>(defaultOpen);

  useEffect(() => {
    localStorage.setItem("admin_sidebar_collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  const toggle = (label: string) =>
    setOpen((prev) => ({ ...prev, [label]: !prev[label] }));

  const isActive = (href: string) => {
    const path = href.split("?")[0];
    return path === "/admin" ? pathname === "/admin" : pathname.startsWith(path);
  };

  const sidebarContent = (
    <aside
      className={`${
        collapsed ? "w-14" : "w-56"
      } flex-shrink-0 bg-[#1d2327] text-[#a7aaad] flex flex-col h-full transition-all duration-200`}
    >
      {/* Branding row */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-[#3c434a]">
        {!collapsed && (
          <span className="text-white font-semibold text-sm truncate">Admin</span>
        )}
        <div className="flex items-center gap-1">
          {/* Close button on mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-[#a7aaad] hover:text-white p-1 rounded"
            title="Chiudi menu"
          >
            <X size={16} />
          </button>
          {/* Collapse button on desktop */}
          <button
            onClick={() => setCollapsed((p) => !p)}
            className="hidden md:block text-[#a7aaad] hover:text-white p-1 rounded"
            title={collapsed ? "Espandi menu" : "Comprimi menu"}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {navItems
          .filter((item) => !item.adminOnly || isAdmin)
          .map((item) => {
            const hasChildren = !!item.children;
            const isItemActive =
              item.href ? isActive(item.href)
              : item.children?.some((c) => isActive(c.href)) ?? false;

            return (
              <div key={item.label}>
                {item.href && !hasChildren ? (
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 text-sm hover:bg-[#2c3338] hover:text-white transition-colors ${
                      isItemActive ? "bg-[#2c3338] text-white border-l-[3px] border-blue-400" : ""
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => !collapsed && toggle(item.label)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-[#2c3338] hover:text-white transition-colors ${
                        isItemActive ? "text-white" : ""
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          {open[item.label]
                            ? <ChevronDown size={14} />
                            : <ChevronRight size={14} />}
                        </>
                      )}
                    </button>
                    {!collapsed && open[item.label] && (
                      <div className="bg-[#161b1e]">
                        {item.children?.map((child) => (
                          <Link
                            key={child.label}
                            href={child.href}
                            onClick={() => setMobileOpen(false)}
                            className={`block pl-10 pr-3 py-1.5 text-sm hover:bg-[#2c3338] hover:text-white transition-colors ${
                              isActive(child.href) ? "text-blue-300 bg-[#1e2c3a] font-medium" : ""
                            }`}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
      </nav>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <div className="hidden md:flex flex-shrink-0 min-h-screen">
        {sidebarContent}
      </div>

      {/* Mobile sidebar — fixed overlay drawer */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 z-50 flex md:hidden">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
}
