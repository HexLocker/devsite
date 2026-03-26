"use client";

import { useEffect, useState, useCallback } from "react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Plus, Trash2, GripVertical, Eye, EyeOff, AlertCircle, CheckCircle, Pencil, X } from "lucide-react";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";

interface FeatureCard {
  id: string;
  categoryTag: string;
  title: string;
  description: string | null;
  icon: string;
  href: string | null;
  color: string;
  order: number;
  active: boolean;
}

const INITIAL_FORM = {
  categoryTag: "",
  title: "",
  description: "",
  icon: "Star",
  href: "",
  color: "#6366F1",
  order: 0,
  active: true,
};

function BentoPreview({ card }: { card: typeof INITIAL_FORM }) {
  const IconComponent = (
    (LucideIcons as unknown as Record<string, LucideIcon>)[card.icon] ??
    (LucideIcons as unknown as Record<string, LucideIcon>)["Star"]
  ) as LucideIcon;

  return (
    <div
      className="relative flex flex-col justify-between rounded-2xl border border-white/10 p-5 overflow-hidden"
      style={{ backgroundColor: "#080814", minHeight: 160 }}
    >
      <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl pointer-events-none opacity-40"
        style={{ backgroundColor: card.color }} />
      <div className="flex items-start justify-between gap-2">
        <span className="inline-block rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          {card.categoryTag || "CATEGORIA"}
        </span>
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${card.color}22`, color: card.color }}
        >
          <IconComponent size={17} strokeWidth={1.8} />
        </div>
      </div>
      <div>
        <h3 className="font-bold text-sm text-white leading-snug mt-3">
          {card.title || "Titolo della card"}
        </h3>
        {card.description && (
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{card.description}</p>
        )}
      </div>
    </div>
  );
}

export default function AdminFeatureCardsPage() {
  const [cards, setCards] = useState<FeatureCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/feature-cards?all=1");
      if (res.ok) {
        const data = await res.json();
        setCards(data.cards ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  function updateForm(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormError("");
    setFormSuccess(false);
  }

  function startEdit(card: FeatureCard) {
    setEditingId(card.id);
    setForm({
      categoryTag: card.categoryTag,
      title: card.title,
      description: card.description ?? "",
      icon: card.icon,
      href: card.href ?? "",
      color: card.color,
      order: card.order,
      active: card.active,
    });
    setFormError("");
    setFormSuccess(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setFormError("");
    setFormSuccess(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.categoryTag.trim()) { setFormError("Il tag categoria è obbligatorio."); return; }
    if (!form.title.trim()) { setFormError("Il titolo è obbligatorio."); return; }

    setSaving(true);
    setFormError("");
    const payload = {
      categoryTag: form.categoryTag.trim().toUpperCase(),
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      icon: form.icon.trim() || "Star",
      href: form.href.trim() || undefined,
      color: form.color,
      order: Number(form.order),
      active: form.active,
    };

    try {
      if (editingId) {
        // Edit mode — PATCH
        const res = await fetch(`/api/feature-cards/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setFormError(data?.error ?? "Errore durante l'aggiornamento.");
          return;
        }
        setFormSuccess(true);
        setEditingId(null);
        setForm(INITIAL_FORM);
      } else {
        // Create mode — POST
        const res = await fetch("/api/feature-cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setFormError(data?.error ?? "Errore durante la creazione.");
          return;
        }
        setFormSuccess(true);
        setForm(INITIAL_FORM);
      }
      fetchCards();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(card: FeatureCard) {
    await fetch(`/api/feature-cards/${card.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !card.active }),
    });
    fetchCards();
  }

  async function doDelete(id: string) {
    await fetch(`/api/feature-cards/${id}`, { method: "DELETE" });
    setPendingDelete(null);
    fetchCards();
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Feature Cards</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gestisci le card visualizzate nella sezione funzionalità della homepage.
          </p>
        </div>
      </div>

      {/* Create form */}
      <div className="rounded-lg border border-[#e2e4e7] bg-white p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          {editingId ? <><Pencil size={16} className="text-[#2271b1]" /> Modifica card</> : <><Plus size={16} className="text-[#2271b1]" /> Aggiungi nuova card</>}
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form fields */}
          <form onSubmit={handleCreate} className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tag categoria *
                </label>
                <input
                  type="text"
                  value={form.categoryTag}
                  onChange={(e) => updateForm("categoryTag", e.target.value)}
                  placeholder="CREATIVITÀ"
                  maxLength={30}
                  className="w-full rounded border border-[#8c8f94] px-2.5 py-1.5 text-sm text-gray-800 focus:border-[#2271b1] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Titolo *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => updateForm("title", e.target.value)}
                  placeholder="Portfolio"
                  maxLength={80}
                  className="w-full rounded border border-[#8c8f94] px-2.5 py-1.5 text-sm text-gray-800 focus:border-[#2271b1] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Descrizione
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                placeholder="Breve descrizione della funzionalità"
                maxLength={200}
                className="w-full rounded border border-[#8c8f94] px-2.5 py-1.5 text-sm text-gray-800 focus:border-[#2271b1] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Icona Lucide
                </label>
                <input
                  type="text"
                  value={form.icon}
                  onChange={(e) => updateForm("icon", e.target.value)}
                  placeholder="Star"
                  className="w-full rounded border border-[#8c8f94] px-2.5 py-1.5 text-sm text-gray-800 focus:border-[#2271b1] focus:outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-0.5">Es: Briefcase, BookOpen, Zap…</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Colore accento
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => updateForm("color", e.target.value)}
                    className="h-8 w-10 rounded border border-[#8c8f94] cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={form.color}
                    onChange={(e) => updateForm("color", e.target.value)}
                    maxLength={7}
                    className="flex-1 rounded border border-[#8c8f94] px-2 py-1.5 text-sm text-gray-800 font-mono focus:outline-none focus:border-[#2271b1]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Ordine
                </label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => updateForm("order", parseInt(e.target.value) || 0)}
                  min={0}
                  className="w-full rounded border border-[#8c8f94] px-2.5 py-1.5 text-sm text-gray-800 focus:border-[#2271b1] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Link (facoltativo)
              </label>
              <input
                type="text"
                value={form.href}
                onChange={(e) => updateForm("href", e.target.value)}
                placeholder="/portfolio"
                className="w-full rounded border border-[#8c8f94] px-2.5 py-1.5 text-sm text-gray-800 focus:border-[#2271b1] focus:outline-none"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => updateForm("active", e.target.checked)}
                className="w-4 h-4 rounded border-[#8c8f94]"
              />
              <span className="text-sm text-gray-700">Attiva (visibile in homepage)</span>
            </label>

            {formError && (
              <div className="flex items-center gap-1.5 text-sm text-red-600">
                <AlertCircle size={14} />
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="flex items-center gap-1.5 text-sm text-green-600">
                <CheckCircle size={14} />
                {editingId ? "Card aggiornata con successo!" : "Card creata con successo!"}
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded bg-[#2271b1] px-4 py-2 text-sm font-medium text-white hover:bg-[#1761a8] transition-colors disabled:opacity-60"
              >
                {editingId ? <Pencil size={14} /> : <Plus size={14} />}
                {saving ? "Salvataggio…" : editingId ? "Aggiorna card" : "Aggiungi card"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="inline-flex items-center gap-1.5 rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <X size={14} /> Annulla
                </button>
              )}
            </div>
          </form>

          {/* Live preview */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Anteprima</p>
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "#07070F" }}>
              <div className="p-4">
                <BentoPreview card={form} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards list */}
      <div className="rounded-lg border border-[#e2e4e7] bg-white">
        <div className="border-b border-[#e2e4e7] px-6 py-4">
          <h2 className="text-base font-semibold text-gray-800">
            Cards esistenti
            <span className="ml-2 text-sm font-normal text-gray-500">({cards.length})</span>
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-[#2271b1]" />
          </div>
        ) : cards.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">Nessuna card trovata. Creane una sopra.</p>
        ) : (
          <div className="divide-y divide-[#e2e4e7]">
            {cards.map((card) => {
              const IconComponent = (
                (LucideIcons as unknown as Record<string, LucideIcon>)[card.icon] ??
                (LucideIcons as unknown as Record<string, LucideIcon>)["Star"]
              ) as LucideIcon;

              return (
                <div key={card.id} className="flex items-center gap-4 px-6 py-4">
                  <GripVertical size={14} className="text-gray-300 flex-shrink-0" />

                  {/* Icon preview */}
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${card.color}22`, color: card.color }}
                  >
                    <IconComponent size={16} strokeWidth={1.8} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                        {card.categoryTag}
                      </span>
                      {!card.active && (
                        <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium bg-yellow-100 text-yellow-700">
                          Nascosta
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-800 truncate">{card.title}</p>
                    {card.description && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{card.description}</p>
                    )}
                  </div>

                  {/* Order badge */}
                  <span className="text-xs text-gray-400 tabular-nums w-4 text-center">
                    #{card.order}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(card)}
                      title="Modifica"
                      className={`p-1.5 rounded transition-colors ${editingId === card.id ? "text-[#2271b1] bg-blue-50" : "text-gray-400 hover:text-[#2271b1] hover:bg-blue-50"}`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleToggleActive(card)}
                      title={card.active ? "Nascondi" : "Mostra"}
                      className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      {card.active ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <button
                      onClick={() => setPendingDelete(card.id)}
                      title="Elimina"
                      className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {pendingDelete && (
        <ConfirmDialog
          message="Eliminare questa card? L'operazione è irreversibile."
          onConfirm={() => doDelete(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
