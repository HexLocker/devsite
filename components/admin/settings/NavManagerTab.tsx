"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronUp, ChevronDown, Trash2, Plus, GripVertical, ChevronRight } from "lucide-react";
import type { NavItem } from "@/lib/nav/types";

const MAX_ITEMS = 7;

// ─── Component ───────────────────────────────────────────────────────────────

export default function NavManagerTab() {
  const [items, setItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Published pages for the dropdown picker
  const [pages, setPages] = useState<{ slug: string; title: string }[]>([]);

  // Inline form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newHref, setNewHref] = useState("");
  const [newType, setNewType] = useState<"link" | "dropdown">("link");

  // Expanded dropdowns for editing children
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Child inline form
  const [showChildForm, setShowChildForm] = useState<string | null>(null);
  const [childLabel, setChildLabel] = useState("");
  const [childHref, setChildHref] = useState("");

  // ─── Load ──────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, pagesRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/pages?status=PUBLISHED&limit=50"),
      ]);

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        const raw = data.settings?.nav_items;
        let parsed: NavItem[] = [];
        if (Array.isArray(raw)) {
          parsed = raw as NavItem[];
        } else if (typeof raw === "string") {
          try { parsed = JSON.parse(raw); } catch { /* keep empty */ }
        }
        // Always ensure the Home "/" item exists
        if (!parsed.some((item) => item.href === "/")) {
          parsed = [
            { id: "nav-home", label: "Home", href: "/", type: "link", order: 0 },
            ...parsed,
          ];
        }
        setItems(parsed);
      }

      if (pagesRes.ok) {
        const data = await pagesRes.json();
        setPages((data.pages ?? []).map((p: { slug: string; title: string }) => ({ slug: p.slug, title: p.title })));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ─── Save ──────────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      // Re-index order
      const ordered = items.map((item, i) => ({
        ...item,
        order: i,
        children: item.children?.map((c, ci) => ({ ...c, order: ci })),
      }));

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{ key: "nav_items", value: ordered }]),
      });

      if (!res.ok) throw new Error("Errore nel salvataggio");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setSaving(false);
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  function moveItem(index: number, direction: -1 | 1) {
    const next = [...items];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  }

  function removeItem(id: string) {
    setItems(items.filter((i) => i.id !== id));
  }

  function addItem() {
    if (!newLabel.trim()) return;
    if (items.length >= MAX_ITEMS) return;

    const item: NavItem = {
      id: crypto.randomUUID(),
      label: newLabel.trim(),
      href: newType === "link" ? (newHref.trim() || "/") : null,
      type: newType,
      order: items.length,
      children: newType === "dropdown" ? [] : undefined,
    };

    setItems([...items, item]);
    setNewLabel("");
    setNewHref("");
    setNewType("link");
    setShowAddForm(false);
  }

  // ─── Child helpers ─────────────────────────────────────────────────────────

  function addChild(parentId: string) {
    if (!childLabel.trim()) return;
    setItems(items.map((item) => {
      if (item.id !== parentId) return item;
      const children = [...(item.children ?? [])];
      children.push({
        id: crypto.randomUUID(),
        label: childLabel.trim(),
        href: childHref.trim() || "/",
        type: "link",
        order: children.length,
      });
      return { ...item, children };
    }));
    setChildLabel("");
    setChildHref("");
    setShowChildForm(null);
  }

  function removeChild(parentId: string, childId: string) {
    setItems(items.map((item) => {
      if (item.id !== parentId) return item;
      return { ...item, children: (item.children ?? []).filter((c) => c.id !== childId) };
    }));
  }

  function moveChild(parentId: string, childIndex: number, direction: -1 | 1) {
    setItems(items.map((item) => {
      if (item.id !== parentId) return item;
      const children = [...(item.children ?? [])];
      const target = childIndex + direction;
      if (target < 0 || target >= children.length) return item;
      [children[childIndex], children[target]] = [children[target], children[childIndex]];
      return { ...item, children };
    }));
  }

  // ─── Select page from dropdown ─────────────────────────────────────────────

  function selectPage(slug: string) {
    const page = pages.find((p) => p.slug === slug);
    if (page) {
      setNewLabel(page.title);
      setNewHref("/" + page.slug);
    }
  }

  function selectChildPage(slug: string) {
    const page = pages.find((p) => p.slug === slug);
    if (page) {
      setChildLabel(page.title);
      setChildHref("/" + page.slug);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return <div className="text-sm text-gray-500 py-4">Caricamento navigazione…</div>;
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        Gestisci gli elementi del menu di navigazione. Massimo {MAX_ITEMS} elementi. Trascina per riordinare o usa le frecce.
      </p>

      {/* ── Items list ── */}
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={item.id} className="border border-gray-200 rounded-lg bg-white">
            {/* Main row */}
            <div className="flex items-center gap-2 px-3 py-2.5">
              <GripVertical size={14} className="text-gray-300 flex-shrink-0" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800 truncate">{item.label}</span>
                  <span className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    item.type === "dropdown"
                      ? "bg-purple-50 text-purple-600"
                      : "bg-blue-50 text-blue-600"
                  }`}>
                    {item.type === "dropdown" ? "Menu" : "Link"}
                  </span>
                </div>
                {item.href && (
                  <p className="text-xs text-gray-400 truncate">{item.href}</p>
                )}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {item.type === "dropdown" && (
                  <button
                    type="button"
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-50 transition-colors"
                    title="Sotto-menu"
                  >
                    <ChevronRight
                      size={14}
                      className={`transition-transform ${expandedId === item.id ? "rotate-90" : ""}`}
                    />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => moveItem(idx, -1)}
                  disabled={idx === 0}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-50 disabled:opacity-30 transition-colors"
                  title="Sposta su"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(idx, 1)}
                  disabled={idx === items.length - 1}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-50 disabled:opacity-30 transition-colors"
                  title="Sposta giù"
                >
                  <ChevronDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  disabled={item.href === "/"}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-400 disabled:hover:bg-transparent"
                  title={item.href === "/" ? "Elemento Home protetto" : "Rimuovi"}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Children (for dropdown items) */}
            {item.type === "dropdown" && expandedId === item.id && (
              <div className="border-t border-gray-100 bg-gray-50/50 px-3 py-2 space-y-1.5">
                {(item.children ?? []).length === 0 && (
                  <p className="text-xs text-gray-400 italic py-1">Nessun sotto-elemento</p>
                )}
                {(item.children ?? []).map((child, ci) => (
                  <div key={child.id} className="flex items-center gap-2 pl-4 py-1">
                    <span className="text-xs text-gray-300">└</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-700 truncate">{child.label}</span>
                      {child.href && <span className="text-xs text-gray-400 ml-2">{child.href}</span>}
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => moveChild(item.id, ci, -1)}
                        disabled={ci === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveChild(item.id, ci, 1)}
                        disabled={ci === (item.children ?? []).length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <ChevronDown size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeChild(item.id, child.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add child form */}
                {showChildForm === item.id ? (
                  <div className="flex items-end gap-2 pl-4 pt-2">
                    <div className="flex-1 space-y-1.5">
                      <select
                        onChange={(e) => { if (e.target.value) selectChildPage(e.target.value); }}
                        className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
                        defaultValue=""
                      >
                        <option value="">Scegli pagina…</option>
                        {pages.map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}
                      </select>
                      <div className="flex gap-1.5">
                        <input
                          value={childLabel}
                          onChange={(e) => setChildLabel(e.target.value)}
                          placeholder="Label"
                          className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
                        />
                        <input
                          value={childHref}
                          onChange={(e) => setChildHref(e.target.value)}
                          placeholder="/percorso"
                          className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => addChild(item.id)}
                      className="px-2.5 py-1 text-xs font-medium text-white bg-[#2271b1] rounded hover:bg-[#135e96] whitespace-nowrap"
                    >
                      Aggiungi
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowChildForm(null); setChildLabel(""); setChildHref(""); }}
                      className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                    >
                      Annulla
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowChildForm(item.id)}
                    className="flex items-center gap-1 pl-4 text-xs text-[#2271b1] hover:text-[#135e96] py-1"
                  >
                    <Plus size={12} /> Aggiungi sotto-elemento
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Add item form ── */}
      {items.length < MAX_ITEMS && (
        <>
          {showAddForm ? (
            <div className="border border-dashed border-gray-300 rounded-lg p-4 space-y-3 bg-gray-50/50">
              <div className="flex gap-3">
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="radio"
                    checked={newType === "link"}
                    onChange={() => setNewType("link")}
                    className="accent-[#2271b1]"
                  />
                  Link
                </label>
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="radio"
                    checked={newType === "dropdown"}
                    onChange={() => setNewType("dropdown")}
                    className="accent-[#2271b1]"
                  />
                  Menu dropdown
                </label>
              </div>

              {newType === "link" && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Seleziona da pagine pubblicate</label>
                  <select
                    onChange={(e) => { if (e.target.value) selectPage(e.target.value); }}
                    className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
                    defaultValue=""
                  >
                    <option value="">Scegli pagina… (opzionale)</option>
                    {pages.map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}
                  </select>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Label (es. Chi siamo)"
                  className="flex-1 rounded border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
                />
                {newType === "link" && (
                  <input
                    value={newHref}
                    onChange={(e) => setNewHref(e.target.value)}
                    placeholder="/percorso"
                    className="flex-1 rounded border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
                  />
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addItem}
                  disabled={!newLabel.trim()}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-[#2271b1] rounded hover:bg-[#135e96] disabled:opacity-50 transition-colors"
                >
                  Aggiungi
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setNewLabel(""); setNewHref(""); }}
                  className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
                >
                  Annulla
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 text-sm text-[#2271b1] hover:text-[#135e96] py-2"
            >
              <Plus size={15} /> Aggiungi elemento ({items.length}/{MAX_ITEMS})
            </button>
          )}
        </>
      )}

      {items.length >= MAX_ITEMS && (
        <p className="text-xs text-amber-600">Hai raggiunto il limite massimo di {MAX_ITEMS} elementi.</p>
      )}

      {/* ── Save / Error / Success ── */}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">Navigazione salvata con successo.</p>}

      <div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-[#2271b1] text-white rounded px-4 py-2 text-sm font-medium hover:bg-[#135e96] disabled:opacity-50 transition-colors"
        >
          {saving ? "Salvataggio..." : "Salva navigazione"}
        </button>
      </div>
    </div>
  );
}
