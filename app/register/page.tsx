"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Le password non corrispondono.");
      return;
    }
    if (password.length < 8) {
      setError("La password deve contenere almeno 8 caratteri.");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("La password deve contenere almeno una lettera maiuscola.");
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError("La password deve contenere almeno una lettera minuscola.");
      return;
    }
    if (!/\d/.test(password)) {
      setError("La password deve contenere almeno un numero.");
      return;
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      setError("La password deve contenere almeno un carattere speciale (es. !, @, #).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registrazione fallita. Riprova.");
        return;
      }
      // Auto-login after registration
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (loginRes.ok) {
        router.push("/");
      } else {
        router.push("/login");
      }
    } catch {
      setError("Errore di rete. Verifica la connessione e riprova.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "block w-full rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090B] px-4">
      <div className="w-full max-w-md">
        <div className="mb-4">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            ← Torna al sito
          </Link>
        </div>
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-8">
        <div className="mb-6 text-center">
          <Link href="/" className="font-heading text-2xl font-extrabold text-white">
            DevSite
          </Link>
          <h1 className="mt-2 font-heading text-xl font-bold text-white">Crea un account</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Hai già un account?{" "}
            <Link href="/login" className="text-indigo-400 font-medium hover:text-indigo-300">
              Accedi
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Email
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mario@esempio.it"
              className={inputClass}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Password
            </label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Es. MyPass1!"
              className={inputClass}
              autoComplete="new-password"
            />
            <p className="mt-1.5 text-xs text-zinc-600">
              Min. 8 caratteri · maiuscola · minuscola · numero · carattere speciale
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Conferma password
            </label>
            <input
              required
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Ripeti la password"
              className={inputClass}
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-2.5 font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 transition-colors cursor-pointer"
          >
            {loading ? "Registrazione in corso…" : "Crea account"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-zinc-500">
          Proseguendo accetti i nostri{" "}
          <Link href="/termini" className="underline underline-offset-2 text-zinc-400 hover:text-zinc-300">
            Termini di servizio
          </Link>
          {" "}e la{" "}
          <Link href="/privacy" className="underline underline-offset-2 text-zinc-400 hover:text-zinc-300">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
      </div>
    </div>
  );
}
