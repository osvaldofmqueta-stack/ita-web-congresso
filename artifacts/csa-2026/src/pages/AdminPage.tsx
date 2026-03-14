import { useState, useEffect, useCallback } from "react";
import {
  verifyPin,
  fetchDates,
  createDate,
  updateDate,
  deleteDate,
  type ImportantDate,
} from "@/lib/api";

const SESSION_KEY = "csa2026_admin_session";

function getSession(): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function saveSession(pin: string) {
  sessionStorage.setItem(SESSION_KEY, pin);
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

function LoginScreen({ onLogin }: { onLogin: (pin: string) => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPin = pin.trim();
    if (!trimmedPin) return;
    setLoading(true);
    setError("");
    const ok = await verifyPin(trimmedPin);
    if (ok) {
      onLogin(trimmedPin);
    } else {
      setError("PIN incorrecto. Tente novamente.");
      setPin("");
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{ background: "linear-gradient(135deg, #0a1437 0%, #0f1e50 100%)" }}
    >
      <div className="w-full max-w-sm mx-4 relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center gap-4 mb-5">
            <img src="/csa-logo.png" alt="CSA" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-white font-bold text-2xl tracking-tight">Área Administrativa</h1>
          <p style={{ color: "#c8a83c" }} className="text-sm mt-1 opacity-80">CSA 2026 — Datas Importantes</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            className="rounded-2xl p-6 border border-white/10"
            style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(16px)" }}
          >
            <label className="block text-white/60 text-xs font-semibold uppercase tracking-widest mb-3">
              PIN de Acesso
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError("");
              }}
              placeholder="••••••••"
              className="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/25 text-center text-2xl tracking-widest focus:outline-none focus:border-yellow-400/50 transition-colors"
              autoFocus
              autoComplete="current-password"
            />
            {error && <p className="text-red-400 text-xs mt-2.5 text-center">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={!pin || loading}
            className="w-full py-3.5 rounded-xl font-bold text-[#0a1437] text-sm disabled:opacity-40 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 shadow-lg"
            style={{ background: "linear-gradient(135deg, #c8a83c, #f5d675)" }}
          >
            {loading ? "A verificar..." : "Entrar"}
          </button>
        </form>

        <p className="text-center text-white/20 text-xs mt-6 font-mono">PIN padrão: admin2026</p>
      </div>
    </div>
  );
}

function AdminDates({ pin, onLogout }: { pin: string; onLogout: () => void }) {
  const [dates, setDates] = useState<ImportantDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newDate, setNewDate] = useState("");
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const list = await fetchDates();
    setDates(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || !newDate.trim()) return;
    setSaving(true);
    const res = await createDate({ label: newLabel.trim(), date: newDate.trim() }, pin);
    setSaving(false);
    if (res.ok && res.date) {
      setDates((prev) => [...prev, res.date!].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id));
      setNewLabel("");
      setNewDate("");
      setShowForm(false);
    }
  };

  const handleUpdate = async (id: number, updates: { label?: string; date?: string; done?: boolean }) => {
    setSaving(true);
    const res = await updateDate(id, updates, pin);
    setSaving(false);
    if (res.ok && res.date) {
      setDates((prev) => prev.map((d) => (d.id === id ? res.date! : d)));
      setEditingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remover esta data?")) return;
    setSaving(true);
    const res = await deleteDate(id, pin);
    setSaving(false);
    if (res.ok) setDates((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0a1437] text-white">
      <header className="border-b border-white/10 bg-[#0a1437]/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/csa-logo.png" alt="CSA" className="h-9 w-9 object-contain" />
            <div>
              <h1 className="font-bold text-lg">Datas Importantes</h1>
              <p className="text-white/50 text-xs">Editar datas exibidas na Chamada para Artigos</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="px-3 py-1.5 rounded-lg text-sm border border-white/20 text-white/80 hover:bg-white/10"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <p className="text-white/60">A carregar...</p>
        ) : (
          <div className="space-y-4">
            {dates.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5"
              >
                {editingId === d.id ? (
                  <>
                    <input
                      type="text"
                      value={d.label}
                      onChange={(e) => setDates((prev) => prev.map((x) => (x.id === d.id ? { ...x, label: e.target.value } : x)))}
                      className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
                      placeholder="Label"
                    />
                    <input
                      type="text"
                      value={d.date}
                      onChange={(e) => setDates((prev) => prev.map((x) => (x.id === d.id ? { ...x, date: e.target.value } : x)))}
                      className="w-32 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
                      placeholder="Data"
                    />
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={d.done}
                        onChange={(e) => setDates((prev) => prev.map((x) => (x.id === d.id ? { ...x, done: e.target.checked } : x)))}
                        className="rounded"
                      />
                      Concluído
                    </label>
                    <button
                      onClick={() => handleUpdate(d.id, { label: d.label, date: d.date, done: d.done })}
                      disabled={saving}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium text-[#0a1437] bg-[#c8a83c]"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 rounded-lg text-sm text-white/70 hover:bg-white/10"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1">
                      <p className="font-medium">{d.label}</p>
                      <p className="text-white/60 text-sm">{d.date}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs ${d.done ? "bg-green-500/20 text-green-300" : "bg-white/10"}`}>
                      {d.done ? "Concluído" : "Pendente"}
                    </span>
                    <button
                      onClick={() => setEditingId(d.id)}
                      className="px-3 py-1.5 rounded-lg text-sm border border-white/20 hover:bg-white/10"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      disabled={saving}
                      className="px-3 py-1.5 rounded-lg text-sm text-red-300 hover:bg-red-500/20"
                    >
                      Remover
                    </button>
                  </>
                )}
              </div>
            ))}

            {showForm ? (
              <form onSubmit={handleCreate} className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-dashed border-white/20 bg-white/5">
                <input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Ex: Submissão de resumos"
                  className="flex-1 min-w-[180px] px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
                  required
                />
                <input
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  placeholder="Ex: 15 Mar 2026"
                  className="w-32 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
                  required
                />
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium text-[#0a1437] bg-[#c8a83c]">
                  Adicionar
                </button>
                <button type="button" onClick={() => { setShowForm(false); setNewLabel(""); setNewDate(""); }} className="px-3 py-2 text-sm text-white/70">
                  Cancelar
                </button>
              </form>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="w-full py-3 rounded-xl border border-dashed border-white/30 text-white/70 hover:bg-white/5 hover:text-white transition-colors"
              >
                + Nova data importante
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminPage() {
  const [pin, setPin] = useState<string | null>(() => getSession());

  const handleLogin = (p: string) => {
    saveSession(p);
    setPin(p);
  };

  const handleLogout = () => {
    clearSession();
    setPin(null);
  };

  if (!pin) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <AdminDates pin={pin} onLogout={handleLogout} />;
}
