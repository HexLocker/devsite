"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Upload } from "lucide-react";
import NavManagerTab from "@/components/admin/settings/NavManagerTab";
import type { LogoShape } from "@/lib/nav/types";

type Tab = "generale" | "seo" | "aspetto" | "navigazione";

interface SettingsMap {
  [key: string]: string;
}

const TABS: { id: Tab; label: string }[] = [
  { id: "generale", label: "Generale" },
  { id: "seo", label: "SEO" },
  { id: "aspetto", label: "Aspetto" },
  { id: "navigazione", label: "Navigazione" },
];

function Field({
  label,
  id,
  value,
  onChange,
  type = "text",
  placeholder,
  description,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  description?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {type === "textarea" ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder={placeholder}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2271b1]"
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2271b1]"
        />
      )}
      {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
    </div>
  );
}

export default function AdminSettingsPage() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("generale");
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [faviconUploading, setFaviconUploading] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "seo" || t === "aspetto" || t === "generale" || t === "navigazione") setTab(t);
  }, [searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        const map: SettingsMap = {};
        for (const [k, v] of Object.entries(data.settings ?? {})) {
          map[k] = typeof v === "string" ? v : JSON.stringify(v);
        }
        setSettings(map);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function set(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function get(key: string) {
    return settings[key] ?? "";
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const items = Object.entries(settings).map(([key, value]) => ({ key, value }));
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(items),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Errore di salvataggio");
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-500 py-8 text-center">Caricamento impostazioni…</div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-800">Impostazioni</h1>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 mb-6 gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? "border-[#2271b1] text-[#2271b1]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-md border border-gray-200 p-6 space-y-5">
        {/* ── Generale ── */}
        {tab === "generale" && (
          <>
            <Field
              label="Nome del sito"
              id="site_name"
              value={get("site_name")}
              onChange={(v) => set("site_name", v)}
              placeholder="Il mio sito"
            />
            <Field
              label="Slogan"
              id="tagline"
              value={get("tagline")}
              onChange={(v) => set("tagline", v)}
              placeholder="Un breve motto o descrizione"
            />
            <Field
              label="URL del sito"
              id="site_url"
              value={get("site_url")}
              onChange={(v) => set("site_url", v)}
              type="url"
              placeholder="https://miosito.it"
            />
            <Field
              label="Email amministratore"
              id="admin_email"
              value={get("admin_email")}
              onChange={(v) => set("admin_email", v)}
              type="email"
              placeholder="admin@esempio.it"
            />
            <Field
              label="Località (visualizzata nel footer)"
              id="contact_location"
              value={get("contact_location")}
              onChange={(v) => set("contact_location", v)}
              placeholder="Roma, Italia"
            />
            <Field
              label="Testo footer"
              id="footer_text"
              value={get("footer_text")}
              onChange={(v) => set("footer_text", v)}
              type="textarea"
              placeholder="© 2025 Il mio sito"
            />

            {/* ── Logo ── */}
            <div className="border-t border-gray-100 pt-5 mt-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Logo del sito</h3>

              <Field
                label="URL Logo"
                id="logo"
                value={get("logo")}
                onChange={(v) => set("logo", v)}
                placeholder="https://miosito.it/logo.png"
                description="Inserisci un URL oppure carica un file qui sotto."
              />

              {/* Upload button */}
              <div className="mt-2 flex items-center gap-3">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setLogoUploading(true);
                      try {
                        const fd = new FormData();
                        fd.append("file", file);
                        const res = await fetch("/api/media/upload", { method: "POST", body: fd });
                        if (res.ok) {
                          const data = await res.json();
                          set("logo", data.media.url);
                        }
                      } finally {
                        setLogoUploading(false);
                      }
                    }}
                  />
                  {logoUploading ? "Caricamento…" : <><Upload size={13} /> Carica logo</>}
                </label>

                {get("logo") && (
                  <button
                    type="button"
                    disabled={removingBg}
                    onClick={async () => {
                      setRemovingBg(true);
                      try {
                        const res = await fetch("/api/admin/logo/remove-bg", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ logoUrl: get("logo") }),
                        });
                        if (res.ok) {
                          const data = await res.json();
                          set("logo", data.url);
                        }
                      } finally {
                        setRemovingBg(false);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-50 hover:bg-purple-100 text-purple-700 rounded transition-colors disabled:opacity-50"
                  >
                    {removingBg ? "Elaborazione…" : "✨ Rimuovi sfondo"}
                  </button>
                )}
              </div>

              {/* Logo preview + Shape picker */}
              {get("logo") && (
                <div className="mt-3 flex items-start gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={get("logo")}
                    alt="Logo preview"
                    className={`h-14 w-14 object-contain border border-gray-200 p-1 bg-white ${
                      get("logo_shape") === "circle" ? "rounded-full" :
                      get("logo_shape") === "rounded" ? "rounded-xl" : "rounded-none"
                    }`}
                  />
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1.5">Forma logo</p>
                    <div className="flex gap-1.5">
                      {(["square", "rounded", "circle"] as LogoShape[]).map((shape) => (
                        <button
                          key={shape}
                          type="button"
                          onClick={() => set("logo_shape", shape)}
                          className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors ${
                            (get("logo_shape") || "square") === shape
                              ? "bg-[#2271b1] text-white border-[#2271b1]"
                              : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {shape === "square" ? "□ Quadrato" : shape === "rounded" ? "⌷ Arrotondato" : "○ Cerchio"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── SEO ── */}
        {tab === "seo" && (
          <>
            <Field
              label="Titolo SEO predefinito"
              id="seo_title"
              value={get("seo_title")}
              onChange={(v) => set("seo_title", v)}
              placeholder="Nome sito – breve descrizione"
              description="Usato come titolo predefinito nelle pagine senza titolo SEO personalizzato."
            />
            <Field
              label="Meta description predefinita"
              id="seo_description"
              value={get("seo_description")}
              onChange={(v) => set("seo_description", v)}
              type="textarea"
              placeholder="Descrizione del sito per i motori di ricerca…"
              description="Max 160 caratteri consigliati."
            />
            <Field
              label="URL immagine OG (Open Graph)"
              id="og_image"
              value={get("og_image")}
              onChange={(v) => set("og_image", v)}
              placeholder="https://miosito.it/og-image.jpg"
              description="Immagine mostrata quando si condivide il sito sui social. Dimensione consigliata: 1200×630 px."
            />
            <Field
              label="Google Analytics ID"
              id="ga_id"
              value={get("ga_id")}
              onChange={(v) => set("ga_id", v)}
              placeholder="G-XXXXXXXXXX"
            />
          </>
        )}

        {/* ── Aspetto ── */}
        {tab === "aspetto" && (
          <>
            {/* Favicon */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Favicon URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={get("favicon")}
                  onChange={(e) => set("favicon", e.target.value)}
                  placeholder="https://miosito.it/favicon.ico"
                  className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2271b1]"
                />
                {get("favicon") && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={get("favicon")} alt="favicon" className="h-9 w-9 object-contain border border-gray-200 rounded p-1 bg-white" />
                )}
              </div>
              <div className="mt-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept="image/*,.ico"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setFaviconUploading(true);
                      try {
                        const fd = new FormData();
                        fd.append("file", file);
                        const res = await fetch("/api/media/upload", { method: "POST", body: fd });
                        if (res.ok) {
                          const data = await res.json();
                          set("favicon", data.media.url);
                        }
                      } finally {
                        setFaviconUploading(false);
                      }
                    }}
                  />
                  <Upload size={13} />
                  {faviconUploading ? "Caricamento…" : "Carica favicon"}
                </label>
              </div>
            </div>

            {/* Colore primario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Colore primario</label>
              <div className="flex items-center gap-3">
                <input
                  id="primary_color"
                  type="color"
                  value={get("primary_color") || "#6366f1"}
                  onChange={(e) => set("primary_color", e.target.value)}
                  className="h-9 w-16 rounded border border-gray-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={get("primary_color") || "#6366f1"}
                  onChange={(e) => set("primary_color", e.target.value)}
                  placeholder="#6366f1"
                  className="w-28 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2271b1]"
                />
                <span className="text-xs text-gray-500">Colore principale del tema (accent)</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                id="show_reviews_marquee"
                type="checkbox"
                checked={get("show_reviews_marquee") === "true"}
                onChange={(e) => set("show_reviews_marquee", e.target.checked ? "true" : "false")}
                className="h-4 w-4 rounded border-gray-300 text-[#2271b1] cursor-pointer"
              />
              <label htmlFor="show_reviews_marquee" className="text-sm font-medium text-gray-700 cursor-pointer">
                Mostra marquee recensioni su tutte le pagine
              </label>
            </div>
          </>
        )}

        {/* ── Navigazione ── */}
        {tab === "navigazione" && (
          <NavManagerTab />
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">Impostazioni salvate con successo.</p>}

        {tab !== "navigazione" && (
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#2271b1] text-white rounded px-4 py-2 text-sm font-medium hover:bg-[#135e96] disabled:opacity-50 transition-colors"
            >
              {saving ? "Salvataggio..." : "Salva impostazioni"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
