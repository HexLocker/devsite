"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Plus, ExternalLink, ChevronDown, User, LogOut, AlertCircle, Home, Menu } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useAdminMenu } from "@/components/admin/layout/AdminMenuContext";
import { useRouter } from "next/navigation";

function getTokenExpiry(): number | null {
  try {
    const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
    if (!match) return null;
    const b64 = match[1].split(".")[1];
    const json = JSON.parse(atob(b64.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof json.exp === "number" ? json.exp : null;
  } catch {
    return null;
  }
}

export default function AdminTopBar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const { setMobileOpen } = useAdminMenu();

  const [newOpen, setNewOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);

  const newRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (newRef.current && !newRef.current.contains(e.target as Node)) setNewOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Check token expiry every 30 seconds
  useEffect(() => {
    function check() {
      const exp = getTokenExpiry();
      setTokenExpired(exp !== null && Date.now() / 1000 > exp);
    }
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const displayName = user?.name || user?.email?.split("@")[0] || "Admin";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="h-10 bg-[#1d2327] border-b border-[#3c434a] flex items-center px-4 gap-4 z-50">
      {/* Hamburger — mobile only */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden text-[#a7aaad] hover:text-white transition-colors"
        aria-label="Apri menu"
      >
        <Menu size={18} />
      </button>

      {/* Back to site */}
      <Link
        href="/"
        className="flex items-center gap-1.5 text-[#a7aaad] hover:text-white text-sm transition-colors"
        title="Torna al sito"
      >
        <Home size={14} />
        <span className="hidden sm:block">Sito</span>
      </Link>

      {/* Open site in new tab */}
      <Link
        href="/"
        target="_blank"
        className="text-[#a7aaad] hover:text-white transition-colors"
        title="Apri il sito in una nuova scheda"
      >
        <ExternalLink size={13} />
      </Link>

      {/* + Nuovo dropdown */}
      <div className="relative" ref={newRef}>
        <button
          onClick={() => setNewOpen((p) => !p)}
          className="flex items-center gap-1 text-[#a7aaad] hover:bg-[#2c3338] hover:text-white text-sm px-2 py-1 rounded transition-colors"
        >
          <Plus size={14} />
          <span>Nuovo</span>
          <ChevronDown size={12} />
        </button>
        {newOpen && (
          <div className="absolute left-0 top-full mt-1 bg-white shadow-lg rounded border border-gray-200 py-1 min-w-[160px] z-50">
            {[
              { label: "Articolo", href: "/admin/posts/new" },
              { label: "Pagina", href: "/admin/pages/new" },
              { label: "Prodotto", href: "/admin/products/new" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setNewOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Token expiry warning */}
      {tokenExpired && (
        <div
          className="flex items-center gap-1 text-red-400 cursor-default"
          title="Token scaduto — effettua nuovamente l'accesso per aggiornarlo"
        >
          <AlertCircle size={16} className="animate-pulse" />
          <span className="hidden sm:block text-xs font-medium">Token scaduto</span>
        </div>
      )}

      {/* User menu */}
      <div className="relative" ref={userRef}>
        <button
          onClick={() => setUserOpen((p) => !p)}
          className="flex items-center gap-2 text-[#a7aaad] hover:text-white text-sm transition-colors"
        >
          <span className="w-6 h-6 rounded-full bg-[#2271b1] text-white text-xs flex items-center justify-center font-semibold">
            {initials}
          </span>
          <span className="hidden sm:block max-w-[120px] truncate">{displayName}</span>
          <ChevronDown size={12} />
        </button>
        {userOpen && (
          <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded border border-gray-200 py-1 min-w-[160px] z-50">
            <Link
              href="/admin/users/profile"
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setUserOpen(false)}
            >
              <User size={14} />
              Profilo
            </Link>
            <div className="border-t border-gray-100 my-1" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={14} />
              Esci
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
