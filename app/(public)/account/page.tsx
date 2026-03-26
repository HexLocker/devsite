"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User, MapPin, CreditCard, ShoppingBag, Shield,
  Plus, Trash2, Pencil, Check, X, ChevronRight,
  LogOut, Phone, Mail, Lock, AlertTriangle,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProfileData {
  id: string; email: string; name?: string | null;
  phone?: string | null; avatar?: string | null; role: string;
}

interface Address {
  id: string; label: string; firstName: string; lastName: string;
  line1: string; line2?: string | null; city: string;
  province?: string | null; postalCode: string; country: string; isDefault: boolean;
}

interface SavedCard {
  id: string; brand: string; last4: string;
  expiryMonth: number; expiryYear: number;
  holderName: string; isDefault: boolean;
}

interface Order {
  id: string; status: string; total: number; createdAt: string;
  items?: { name: string; quantity: number; price: number }[];
}

type Section = "profile" | "addresses" | "cards" | "orders" | "security";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const INPUT =
  "block w-full rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition";
const LABEL = "mb-1 block text-xs font-semibold uppercase tracking-widest text-zinc-500";
const BTN_PRIMARY =
  "inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50";
const BTN_GHOST =
  "inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-white/[0.06] transition";
const BTN_DANGER =
  "inline-flex items-center gap-2 rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition disabled:opacity-50";
const CARD = "rounded-xl border border-white/10 bg-white/[0.04] p-6";
const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/15 text-yellow-400",
  CONFIRMED: "bg-blue-500/15 text-blue-400",
  SHIPPED: "bg-indigo-500/15 text-indigo-400",
  DELIVERED: "bg-emerald-500/15 text-emerald-400",
  CANCELLED: "bg-red-500/15 text-red-400",
};
const STATUS_LABELS: Record<string, string> = {
  PENDING: "In attesa", CONFIRMED: "Confermato",
  SHIPPED: "Spedito", DELIVERED: "Consegnato", CANCELLED: "Annullato",
};

function cardBrandIcon(brand: string) {
  const map: Record<string, string> = { Visa: "VISA", Mastercard: "MC", Amex: "AMEX", Other: "CARD" };
  return map[brand] ?? "CARD";
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, type, onClose }: { msg: string; type: "ok" | "err"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl ${type === "ok" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-red-500/30 bg-red-500/10 text-red-400"}`}>
      {type === "ok" ? <Check size={16} /> : <X size={16} />} {msg}
    </div>
  );
}

// ─── Address Form ─────────────────────────────────────────────────────────────

function AddressForm({ initial, onSave, onCancel }: {
  initial?: Partial<Address>;
  onSave: (data: Omit<Address, "id">) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    label: initial?.label ?? "Casa",
    firstName: initial?.firstName ?? "",
    lastName: initial?.lastName ?? "",
    line1: initial?.line1 ?? "",
    line2: initial?.line2 ?? "",
    city: initial?.city ?? "",
    province: initial?.province ?? "",
    postalCode: initial?.postalCode ?? "",
    country: initial?.country ?? "IT",
    isDefault: initial?.isDefault ?? false,
  });
  const [saving, setSaving] = useState(false);

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({ ...form, line2: form.line2 || null, province: form.province || null });
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Etichetta</label>
          <select value={form.label} onChange={f("label")} className={INPUT}>
            {["Casa", "Ufficio", "Altro"].map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div className="flex items-end pb-0.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))}
              className="rounded border-white/20 bg-white/10 text-indigo-500 focus:ring-indigo-500/30" />
            <span className="text-sm text-zinc-400">Predefinito</span>
          </label>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={LABEL}>Nome</label><input required value={form.firstName} onChange={f("firstName")} className={INPUT} placeholder="Mario" /></div>
        <div><label className={LABEL}>Cognome</label><input required value={form.lastName} onChange={f("lastName")} className={INPUT} placeholder="Rossi" /></div>
      </div>
      <div><label className={LABEL}>Indirizzo</label><input required value={form.line1} onChange={f("line1")} className={INPUT} placeholder="Via Roma 1" /></div>
      <div><label className={LABEL}>Interno / Piano (opzionale)</label><input value={form.line2} onChange={f("line2")} className={INPUT} placeholder="Interno 3" /></div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2"><label className={LABEL}>Città</label><input required value={form.city} onChange={f("city")} className={INPUT} placeholder="Milano" /></div>
        <div><label className={LABEL}>Prov.</label><input value={form.province} onChange={f("province")} className={INPUT} placeholder="MI" maxLength={3} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={LABEL}>CAP</label><input required value={form.postalCode} onChange={f("postalCode")} className={INPUT} placeholder="20100" /></div>
        <div>
          <label className={LABEL}>Paese</label>
          <select value={form.country} onChange={f("country")} className={INPUT}>
            <option value="IT">🇮🇹 Italia</option>
            <option value="DE">🇩🇪 Germania</option>
            <option value="FR">🇫🇷 Francia</option>
            <option value="ES">🇪🇸 Spagna</option>
            <option value="GB">🇬🇧 UK</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={saving} className={BTN_PRIMARY}>{saving ? "Salvataggio…" : "Salva indirizzo"}</button>
        <button type="button" onClick={onCancel} className={BTN_GHOST}>Annulla</button>
      </div>
    </form>
  );
}

// ─── Card Form ────────────────────────────────────────────────────────────────

function CardForm({ onSave, onCancel }: {
  onSave: (data: Omit<SavedCard, "id">) => Promise<void>;
  onCancel: () => void;
}) {
  const [cardNumber, setCardNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function detectBrand(num: string): "Visa" | "Mastercard" | "Amex" | "Other" {
    if (/^4/.test(num)) return "Visa";
    if (/^5[1-5]/.test(num)) return "Mastercard";
    if (/^3[47]/.test(num)) return "Amex";
    return "Other";
  }

  function formatCardNumber(val: string) {
    return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }

  function formatExpiry(val: string) {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const digits = cardNumber.replace(/\s/g, "");
    if (digits.length < 13) { setError("Numero carta non valido"); return; }
    const parts = expiry.split("/");
    if (parts.length !== 2) { setError("Scadenza non valida (MM/AA)"); return; }
    const month = parseInt(parts[0]);
    const year = 2000 + parseInt(parts[1]);
    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) { setError("Scadenza non valida"); return; }
    const now = new Date();
    if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
      setError("La carta è scaduta"); return;
    }
    setSaving(true);
    await onSave({ brand: detectBrand(digits), last4: digits.slice(-4), expiryMonth: month, expiryYear: year, holderName, isDefault });
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</div>}
      <div>
        <label className={LABEL}>Numero carta</label>
        <input value={cardNumber} onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
          className={`${INPUT} font-mono tracking-widest`} placeholder="0000 0000 0000 0000" required />
        <p className="mt-1 text-xs text-zinc-600">Salviamo solo le ultime 4 cifre, mai il numero completo.</p>
      </div>
      <div><label className={LABEL}>Nome intestatario</label><input required value={holderName} onChange={(e) => setHolderName(e.target.value.toUpperCase())} className={INPUT} placeholder="MARIO ROSSI" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Scadenza (MM/AA)</label>
          <input value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} className={INPUT} placeholder="12/28" required />
        </div>
        <div className="flex items-end pb-0.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded border-white/20 bg-white/10 text-indigo-500 focus:ring-indigo-500/30" />
            <span className="text-sm text-zinc-400">Predefinita</span>
          </label>
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={saving} className={BTN_PRIMARY}>{saving ? "Salvataggio…" : "Aggiungi carta"}</button>
        <button type="button" onClick={onCancel} className={BTN_GHOST}>Annulla</button>
      </div>
    </form>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AccountPage() {
  const router = useRouter();
  const { user: authUser, logout, refreshUser } = useAuthStore();

  const [section, setSection] = useState<Section>("profile");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  // Profile edit
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Email change
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  // Password change
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  // Delete account
  const [deletePassword, setDeletePassword] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Address/Card forms
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [showCardForm, setShowCardForm] = useState(false);

  const showToast = useCallback((msg: string, type: "ok" | "err") => {
    setToast({ msg, type });
  }, []);

  useEffect(() => {
    if (!authUser) { router.replace("/login"); return; }
    async function load() {
      const [pRes, aRes, cRes, oRes] = await Promise.all([
        fetch("/api/profile", { credentials: "include" }),
        fetch("/api/profile/addresses", { credentials: "include" }),
        fetch("/api/profile/cards", { credentials: "include" }),
        fetch("/api/orders", { credentials: "include" }),
      ]);
      if (pRes.ok) { const d = await pRes.json(); setProfile(d.user); setEditName(d.user.name ?? ""); setEditPhone(d.user.phone ?? ""); }
      if (aRes.ok) { const d = await aRes.json(); setAddresses(d.addresses); }
      if (cRes.ok) { const d = await cRes.json(); setCards(d.cards); }
      if (oRes.ok) { const d = await oRes.json(); setOrders(d.orders ?? []); }
      setLoading(false);
    }
    load();
  }, [authUser, router]);

  async function saveProfile() {
    setSavingProfile(true);
    const res = await fetch("/api/profile", {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName || null, phone: editPhone || null }),
    });
    const d = await res.json();
    if (res.ok) { setProfile(d.user); await refreshUser(); showToast("Profilo aggiornato", "ok"); }
    else showToast(d.error ?? "Errore", "err");
    setSavingProfile(false);
  }

  async function changeEmail(e: React.FormEvent) {
    e.preventDefault();
    setSavingEmail(true);
    const res = await fetch("/api/profile/email", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newEmail, currentPassword: emailPassword }),
    });
    const d = await res.json();
    if (res.ok) { setProfile((p) => p ? { ...p, email: newEmail } : p); setNewEmail(""); setEmailPassword(""); showToast("Email aggiornata", "ok"); }
    else showToast(d.error ?? "Errore", "err");
    setSavingEmail(false);
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPwd !== confirmPwd) { showToast("Le password non corrispondono", "err"); return; }
    setSavingPwd(true);
    const res = await fetch("/api/profile/password", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
    });
    const d = await res.json();
    if (res.ok) { setCurrentPwd(""); setNewPwd(""); setConfirmPwd(""); showToast("Password aggiornata", "ok"); }
    else showToast(d.error ?? "Errore", "err");
    setSavingPwd(false);
  }

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setDeletingAccount(true);
    const res = await fetch("/api/profile/delete", {
      method: "DELETE", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: deletePassword }),
    });
    const d = await res.json();
    if (res.ok) { await logout(); router.replace("/"); }
    else { showToast(d.error ?? "Errore", "err"); setDeletingAccount(false); }
  }

  async function saveAddress(data: Omit<Address, "id">, editId?: string) {
    const url = editId ? `/api/profile/addresses/${editId}` : "/api/profile/addresses";
    const method = editId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method, credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const d = await res.json();
    if (res.ok) {
      const aRes = await fetch("/api/profile/addresses", { credentials: "include" });
      if (aRes.ok) setAddresses((await aRes.json()).addresses);
      setShowAddressForm(false); setEditingAddress(null);
      showToast(editId ? "Indirizzo aggiornato" : "Indirizzo aggiunto", "ok");
    } else showToast(d.error ?? "Errore", "err");
  }

  async function deleteAddress(id: string) {
    const res = await fetch(`/api/profile/addresses/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) { setAddresses((p) => p.filter((a) => a.id !== id)); showToast("Indirizzo eliminato", "ok"); }
    else showToast("Errore", "err");
  }

  async function saveCard(data: Omit<SavedCard, "id">) {
    const res = await fetch("/api/profile/cards", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const d = await res.json();
    if (res.ok) { setCards((p) => [d.card, ...p.filter((c) => !d.card.isDefault || !c.isDefault)]); setShowCardForm(false); showToast("Carta aggiunta", "ok"); }
    else showToast(d.error ?? "Errore", "err");
  }

  async function deleteCard(id: string) {
    const res = await fetch(`/api/profile/cards/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) { setCards((p) => p.filter((c) => c.id !== id)); showToast("Carta rimossa", "ok"); }
    else showToast("Errore", "err");
  }

  async function setDefaultCard(id: string) {
    const res = await fetch(`/api/profile/cards/${id}`, { method: "PATCH", credentials: "include" });
    if (res.ok) { setCards((p) => p.map((c) => ({ ...c, isDefault: c.id === id }))); }
  }

  const navItems: { id: Section; icon: React.ReactNode; label: string; badge?: number }[] = [
    { id: "profile", icon: <User size={16} />, label: "Profilo" },
    { id: "addresses", icon: <MapPin size={16} />, label: "Indirizzi", badge: addresses.length || undefined },
    { id: "cards", icon: <CreditCard size={16} />, label: "Carte", badge: cards.length || undefined },
    { id: "orders", icon: <ShoppingBag size={16} />, label: "Ordini", badge: orders.length || undefined },
    { id: "security", icon: <Shield size={16} />, label: "Sicurezza" },
  ];

  if (!authUser) return null;

  return (
    <div className="min-h-screen bg-[#09090B] pt-20 pb-16">
      <div className="mx-auto max-w-5xl px-4">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-extrabold text-white">Il mio account</h1>
            <p className="mt-1 text-sm text-zinc-500">{profile?.email}</p>
          </div>
          <button onClick={() => { logout(); router.replace("/"); }} className={BTN_GHOST}>
            <LogOut size={15} /> Esci
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">

          {/* Sidebar */}
          <nav className="flex flex-row gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => setSection(item.id)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition whitespace-nowrap lg:w-full ${section === item.id ? "bg-white/[0.08] text-white" : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"}`}>
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-xs text-zinc-400">{item.badge}</span>
                )}
                <ChevronRight size={14} className="ml-auto hidden lg:block opacity-40" />
              </button>
            ))}
          </nav>

          {/* Content */}
          <div>
            {loading ? (
              <div className={`${CARD} space-y-4`}>
                {[...Array(3)].map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-white/[0.06]" />)}
              </div>
            ) : (

              // ── PROFILO ────────────────────────────────────────────────

              section === "profile" ? (
                <div className="space-y-6">
                  <div className={CARD}>
                    <h2 className="mb-5 text-base font-semibold text-white flex items-center gap-2"><User size={16} className="text-indigo-400" /> Dati personali</h2>
                    <div className="space-y-4">
                      <div>
                        <label className={LABEL}>Nome completo</label>
                        <input value={editName} onChange={(e) => setEditName(e.target.value)} className={INPUT} placeholder="Mario Rossi" />
                      </div>
                      <div>
                        <label className={LABEL}><span className="flex items-center gap-1.5"><Phone size={11} /> Numero di telefono</span></label>
                        <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className={INPUT} placeholder="+39 333 1234567" type="tel" />
                        {editPhone && (
                          <button onClick={() => setEditPhone("")} className="mt-1.5 flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition">
                            <X size={12} /> Rimuovi numero
                          </button>
                        )}
                      </div>
                      <div className="pt-1">
                        <button disabled={savingProfile} onClick={saveProfile} className={BTN_PRIMARY}>
                          {savingProfile ? "Salvataggio…" : "Salva modifiche"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={CARD}>
                    <h3 className="mb-2 text-sm font-semibold text-white flex items-center gap-2"><Mail size={16} className="text-zinc-500" /> Email corrente</h3>
                    <p className="text-sm text-zinc-400">{profile?.email}</p>
                    <p className="mt-1 text-xs text-zinc-600">Per cambiare email vai alla sezione Sicurezza.</p>
                  </div>
                </div>

              // ── INDIRIZZI ──────────────────────────────────────────────

              ) : section === "addresses" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-white flex items-center gap-2"><MapPin size={16} className="text-indigo-400" /> Indirizzi di spedizione</h2>
                    {!showAddressForm && !editingAddress && (
                      <button onClick={() => setShowAddressForm(true)} className={BTN_PRIMARY}><Plus size={15} /> Aggiungi</button>
                    )}
                  </div>

                  {(showAddressForm) && (
                    <div className={CARD}>
                      <h3 className="mb-4 text-sm font-semibold text-white">Nuovo indirizzo</h3>
                      <AddressForm onSave={(d) => saveAddress(d)} onCancel={() => setShowAddressForm(false)} />
                    </div>
                  )}

                  {editingAddress && (
                    <div className={CARD}>
                      <h3 className="mb-4 text-sm font-semibold text-white">Modifica indirizzo</h3>
                      <AddressForm initial={editingAddress} onSave={(d) => saveAddress(d, editingAddress.id)} onCancel={() => setEditingAddress(null)} />
                    </div>
                  )}

                  {addresses.length === 0 && !showAddressForm ? (
                    <div className={`${CARD} text-center py-10`}>
                      <MapPin size={32} className="mx-auto mb-3 text-zinc-700" />
                      <p className="text-sm text-zinc-500">Nessun indirizzo salvato.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {addresses.map((addr) => (
                        <div key={addr.id} className={`${CARD} flex items-start justify-between gap-4`}>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">{addr.label}</span>
                              {addr.isDefault && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-400">Predefinito</span>}
                            </div>
                            <p className="text-sm font-medium text-white">{addr.firstName} {addr.lastName}</p>
                            <p className="text-sm text-zinc-400">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                            <p className="text-sm text-zinc-400">{addr.postalCode} {addr.city}{addr.province ? ` (${addr.province})` : ""} — {addr.country}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => { setEditingAddress(addr); setShowAddressForm(false); }} className="rounded-lg p-2 text-zinc-500 hover:bg-white/[0.06] hover:text-white transition"><Pencil size={14} /></button>
                            <button onClick={() => deleteAddress(addr.id)} className="rounded-lg p-2 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              // ── CARTE ──────────────────────────────────────────────────

              ) : section === "cards" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-white flex items-center gap-2"><CreditCard size={16} className="text-indigo-400" /> Metodi di pagamento</h2>
                    {!showCardForm && cards.length < 5 && (
                      <button onClick={() => setShowCardForm(true)} className={BTN_PRIMARY}><Plus size={15} /> Aggiungi carta</button>
                    )}
                  </div>

                  {showCardForm && (
                    <div className={CARD}>
                      <h3 className="mb-4 text-sm font-semibold text-white">Nuova carta</h3>
                      <CardForm onSave={saveCard} onCancel={() => setShowCardForm(false)} />
                    </div>
                  )}

                  {cards.length === 0 && !showCardForm ? (
                    <div className={`${CARD} text-center py-10`}>
                      <CreditCard size={32} className="mx-auto mb-3 text-zinc-700" />
                      <p className="text-sm text-zinc-500">Nessuna carta salvata.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cards.map((card) => (
                        <div key={card.id} className={`${CARD} flex items-center justify-between gap-4`}>
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-16 items-center justify-center rounded-lg bg-white/[0.06] border border-white/10 text-xs font-bold text-white tracking-wide">
                              {cardBrandIcon(card.brand)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white font-mono">•••• •••• •••• {card.last4}</p>
                              <p className="text-xs text-zinc-500">{card.holderName} · Scad. {String(card.expiryMonth).padStart(2, "0")}/{card.expiryYear}</p>
                              {card.isDefault && <span className="text-xs text-emerald-400">Predefinita</span>}
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            {!card.isDefault && (
                              <button onClick={() => setDefaultCard(card.id)} className="text-xs text-zinc-500 hover:text-white transition">Imposta predefinita</button>
                            )}
                            <button onClick={() => deleteCard(card.id)} className="rounded-lg p-2 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-zinc-600">Salviamo solo le ultime 4 cifre e il tipo di carta. I dati completi non vengono mai memorizzati.</p>
                </div>

              // ── ORDINI ─────────────────────────────────────────────────

              ) : section === "orders" ? (
                <div className="space-y-4">
                  <h2 className="text-base font-semibold text-white flex items-center gap-2"><ShoppingBag size={16} className="text-indigo-400" /> I miei ordini</h2>
                  {orders.length === 0 ? (
                    <div className={`${CARD} text-center py-10`}>
                      <ShoppingBag size={32} className="mx-auto mb-3 text-zinc-700" />
                      <p className="text-sm text-zinc-500">Nessun ordine ancora.</p>
                      <Link href="/shop" className="mt-3 inline-block text-sm text-indigo-400 hover:text-indigo-300">Vai allo shop →</Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map((order) => (
                        <div key={order.id} className={`${CARD} flex items-center justify-between gap-4`}>
                          <div>
                            <p className="text-xs text-zinc-600 font-mono">#{order.id.slice(-8).toUpperCase()}</p>
                            <p className="text-sm font-medium text-white mt-0.5">
                              {new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(order.total)}
                            </p>
                            <p className="text-xs text-zinc-500">{new Date(order.createdAt).toLocaleDateString("it-IT")}</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-white/10 text-zinc-400"}`}>
                            {STATUS_LABELS[order.status] ?? order.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              // ── SICUREZZA ──────────────────────────────────────────────

              ) : (
                <div className="space-y-6">
                  {/* Change email */}
                  <div className={CARD}>
                    <h2 className="mb-5 text-base font-semibold text-white flex items-center gap-2"><Mail size={16} className="text-indigo-400" /> Cambia email</h2>
                    <form onSubmit={changeEmail} className="space-y-4">
                      <div><label className={LABEL}>Nuova email</label><input required type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={INPUT} placeholder="nuova@email.it" /></div>
                      <div><label className={LABEL}>Password attuale</label><input required type="password" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} className={INPUT} placeholder="••••••••" /></div>
                      <button type="submit" disabled={savingEmail} className={BTN_PRIMARY}>{savingEmail ? "Aggiornamento…" : "Aggiorna email"}</button>
                    </form>
                  </div>

                  {/* Change password */}
                  <div className={CARD}>
                    <h2 className="mb-5 text-base font-semibold text-white flex items-center gap-2"><Lock size={16} className="text-indigo-400" /> Cambia password</h2>
                    <form onSubmit={changePassword} className="space-y-4">
                      <div><label className={LABEL}>Password attuale</label><input required type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} className={INPUT} placeholder="••••••••" /></div>
                      <div><label className={LABEL}>Nuova password</label><input required type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className={INPUT} placeholder="••••••••" /></div>
                      <div><label className={LABEL}>Conferma nuova password</label><input required type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} className={INPUT} placeholder="••••••••" /></div>
                      <p className="text-xs text-zinc-600">Min. 8 caratteri · maiuscola · minuscola · numero · carattere speciale</p>
                      <button type="submit" disabled={savingPwd} className={BTN_PRIMARY}>{savingPwd ? "Aggiornamento…" : "Aggiorna password"}</button>
                    </form>
                  </div>

                  {/* Delete account */}
                  <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-6">
                    <h2 className="mb-2 text-base font-semibold text-red-400 flex items-center gap-2"><AlertTriangle size={16} /> Zona pericolosa</h2>
                    <p className="mb-5 text-sm text-zinc-500">L&apos;eliminazione dell&apos;account è irreversibile. Tutti i tuoi dati saranno cancellati.</p>
                    {!confirmDelete ? (
                      <button onClick={() => setConfirmDelete(true)} className={BTN_DANGER}><Trash2 size={15} /> Elimina account</button>
                    ) : (
                      <form onSubmit={deleteAccount} className="space-y-4">
                        <div><label className={LABEL}>Conferma con la tua password</label><input required type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} className={INPUT} placeholder="••••••••" /></div>
                        <div className="flex gap-3">
                          <button type="submit" disabled={deletingAccount} className={BTN_DANGER}>{deletingAccount ? "Eliminazione…" : "Sì, elimina definitivamente"}</button>
                          <button type="button" onClick={() => { setConfirmDelete(false); setDeletePassword(""); }} className={BTN_GHOST}>Annulla</button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
