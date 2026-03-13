import { useState, useEffect, useCallback } from "react";
import {
  verifyPin,
  fetchSettings,
  updateSettings,
  fetchLinks,
  createLink,
  updateLink,
  deleteLink,
  type CongressSettings,
  type AppLink,
} from "@/lib/api";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

const SESSION_KEY = "csa2026_admin_session";

function getSession(): string | null {
  return sessionStorage.getItem(SESSION_KEY);
}

function saveSession(pin: string) {
  sessionStorage.setItem(SESSION_KEY, pin);
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

/* ─── Toast ───────────────────────────────────────────────────────────────── */

interface ToastState {
  message: string;
  type: "success" | "error";
}

function Toast({ message, type, onClose }: ToastState & { onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-medium border transition-all ${
        type === "success"
          ? "bg-green-950 border-green-500/30 text-green-200"
          : "bg-red-950 border-red-500/30 text-red-200"
      }`}
    >
      <span>{type === "success" ? "✅" : "❌"}</span>
      <span>{message}</span>
      <button onClick={onClose} className="ml-1 opacity-50 hover:opacity-100">✕</button>
    </div>
  );
}

/* ─── Login Screen ────────────────────────────────────────────────────────── */

function LoginScreen({ onLogin }: { onLogin: (pin: string) => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;
    setLoading(true);
    setError("");
    const ok = await verifyPin(pin);
    if (ok) {
      onLogin(pin);
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
          <p style={{ color: "#c8a83c" }} className="text-sm mt-1 opacity-80">CSA 2026 — URNM, Angola</p>
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
              onChange={(e) => { setPin(e.target.value); setError(""); }}
              placeholder="••••••••"
              className="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/25 text-center text-2xl tracking-widest focus:outline-none focus:border-yellow-400/50 transition-colors"
              autoFocus
              autoComplete="current-password"
            />
            {error && (
              <p className="text-red-400 text-xs mt-2.5 text-center">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!pin || loading}
            className="w-full py-3.5 rounded-xl font-bold text-[#0a1437] text-sm disabled:opacity-40 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 shadow-lg"
            style={{ background: "linear-gradient(135deg, #c8a83c, #f5d675)" }}
          >
            {loading ? "A verificar..." : "Entrar no Painel"}
          </button>
        </form>

        <p className="text-center text-white/20 text-xs mt-6 font-mono">
          PIN padrão: admin2026
        </p>
        <div className="text-center mt-3">
          <a href="/" className="text-white/30 hover:text-white/60 text-xs transition-colors">
            ← Voltar ao site
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── Badge ───────────────────────────────────────────────────────────────── */

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
        active
          ? "bg-green-100 text-green-700 border border-green-200"
          : "bg-yellow-50 text-yellow-700 border border-yellow-200"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-green-500" : "bg-yellow-500"}`} />
      {active ? "Activo" : "Em breve"}
    </span>
  );
}

/* ─── Platform badge ──────────────────────────────────────────────────────── */

function PlatformBadge({ platform }: { platform: string }) {
  const isAndroid = platform.toLowerCase() === "android";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
        isAndroid
          ? "bg-green-900/20 text-green-700 border border-green-200"
          : "bg-gray-100 text-gray-600 border border-gray-200"
      }`}
    >
      {isAndroid ? "🤖 Android" : "🍎 iOS"}
    </span>
  );
}

/* ─── Modal Link Form ─────────────────────────────────────────────────────── */

interface LinkFormData {
  platform: string;
  label: string;
  url: string;
  active: boolean;
}

function LinkModal({
  link,
  onSave,
  onClose,
  saving,
}: {
  link: LinkFormData | null;
  onSave: (data: LinkFormData) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<LinkFormData>(
    link ?? { platform: "android", label: "", url: "", active: false }
  );

  const set = (k: keyof LinkFormData, v: string | boolean) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-lg">
            {link ? "Editar Link" : "Novo Link de Download"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Plataforma</label>
            <div className="grid grid-cols-2 gap-2">
              {["android", "ios"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set("platform", p)}
                  className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                    form.platform === p
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {p === "android" ? "🤖 Android" : "🍎 iOS"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Descrição / Etiqueta
            </label>
            <input
              type="text"
              value={form.label}
              onChange={(e) => set("label", e.target.value)}
              placeholder="Ex: CSA 2026 para Android"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              URL de Download
            </label>
            <input
              type="url"
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              placeholder="https://play.google.com/store/apps/..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-700">Link activo</p>
              <p className="text-xs text-gray-400">Visível no site como botão de download</p>
            </div>
            <button
              type="button"
              onClick={() => set("active", !form.active)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                form.active ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  form.active ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.label || !form.url || saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #0a1437, #1a2d6e)" }}
          >
            {saving ? "A guardar..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Admin Dashboard ─────────────────────────────────────────────────────── */

function AdminDashboard({ pin, onLogout }: { pin: string; onLogout: () => void }) {
  const [settings, setSettings] = useState<CongressSettings | null>(null);
  const [links, setLinks] = useState<AppLink[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<"settings" | "links" | "security">("settings");

  // Link modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<AppLink | null>(null);
  const [savingLink, setSavingLink] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Security tab
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
  }, []);

  const loadData = useCallback(async () => {
    const [s, l] = await Promise.all([fetchSettings(), fetchLinks()]);
    setSettings(s);
    setLinks(l);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    const res = await updateSettings(settings, pin);
    setSavingSettings(false);
    if (res.ok) {
      showToast("Definições guardadas com sucesso!", "success");
    } else {
      showToast(res.error ?? "Erro ao guardar definições", "error");
    }
  };

  const handleSaveLink = async (data: { platform: string; label: string; url: string; active: boolean }) => {
    setSavingLink(true);
    let res;
    if (editingLink) {
      res = await updateLink(editingLink.id, data, pin);
    } else {
      res = await createLink(data, pin);
    }
    setSavingLink(false);
    if (res.ok) {
      showToast(editingLink ? "Link actualizado!" : "Link criado com sucesso!", "success");
      setModalOpen(false);
      setEditingLink(null);
      await loadData();
    } else {
      showToast(res.error ?? "Erro ao guardar link", "error");
    }
  };

  const handleDeleteLink = async (id: number) => {
    if (!confirm("Tem certeza que deseja eliminar este link?")) return;
    setDeletingId(id);
    const res = await deleteLink(id, pin);
    setDeletingId(null);
    if (res.ok) {
      showToast("Link eliminado.", "success");
      await loadData();
    } else {
      showToast(res.error ?? "Erro ao eliminar", "error");
    }
  };

  const handleToggleLink = async (link: AppLink) => {
    const res = await updateLink(link.id, { active: !link.active }, pin);
    if (res.ok) {
      await loadData();
    }
  };

  const handleChangePin = async () => {
    if (newPin.length < 4) {
      showToast("O PIN deve ter pelo menos 4 caracteres.", "error");
      return;
    }
    if (newPin !== confirmPin) {
      showToast("Os PINs não coincidem.", "error");
      return;
    }
    const res = await updateSettings({ admin_pin: newPin } as Record<string, string> & CongressSettings, pin);
    if (res.ok) {
      showToast("PIN alterado! Faça login novamente.", "success");
      setTimeout(() => { clearSession(); onLogout(); }, 2000);
    } else {
      showToast(res.error ?? "Erro ao alterar PIN", "error");
    }
  };

  const inscriptionDate = settings?.inscription_end_date
    ? new Date(settings.inscription_end_date + "T23:59:59")
    : null;
  const inscriptionOpen = inscriptionDate ? inscriptionDate > new Date() : false;
  const activeLinks = links.filter((l) => l.active);

  const TABS = [
    { id: "settings" as const, label: "Definições", icon: "⚙️" },
    { id: "links" as const, label: "Links de Download", icon: "📱" },
    { id: "security" as const, label: "Segurança", icon: "🔐" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/csa-logo.png" alt="CSA" className="w-8 h-8 object-contain" />
            <div className="hidden sm:block">
              <span className="font-bold text-gray-800 text-sm">CSA 2026</span>
              <span className="mx-2 text-gray-200">|</span>
              <span className="text-gray-400 text-sm">Área Administrativa</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
              </svg>
              Ver site
            </a>
            <button
              onClick={() => { clearSession(); onLogout(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors border border-gray-200"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4a2 2 0 00-2 2v14a2 2 0 002 2h8v-2H4V5z"/>
              </svg>
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Inscrições",
              value: inscriptionOpen ? "Abertas" : "Encerradas",
              sub: settings?.inscription_end_date ?? "—",
              color: inscriptionOpen ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700",
            },
            {
              label: "Congresso",
              value: settings?.congress_event_date
                ? new Date(settings.congress_event_date).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })
                : "—",
              sub: "Data do evento",
              color: "border-blue-200 bg-blue-50 text-blue-700",
            },
            {
              label: "Links activos",
              value: `${activeLinks.length}`,
              sub: `${links.length} total`,
              color: activeLinks.length > 0 ? "border-purple-200 bg-purple-50 text-purple-700" : "border-gray-200 bg-gray-50 text-gray-600",
            },
            {
              label: "Android / iOS",
              value: `${links.filter(l => l.platform === "android" && l.active).length} / ${links.filter(l => l.platform === "ios" && l.active).length}`,
              sub: "links activos",
              color: "border-orange-200 bg-orange-50 text-orange-700",
            },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl border px-4 py-3 ${s.color}`}>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-60">{s.label}</p>
              <p className="text-xl font-bold mt-1">{s.value}</p>
              <p className="text-xs opacity-60 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-full sm:w-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-white shadow-sm text-gray-800"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── SETTINGS TAB ── */}
        {activeTab === "settings" && settings && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Definições do Congresso</h2>
              <p className="text-xs text-gray-400 mt-0.5">Estas informações aparecem no site público</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    Encerramento das Inscrições
                  </label>
                  <p className="text-xs text-gray-400 mb-2">Data final para inscrições (a contagem regressiva aponta para esta data)</p>
                  <input
                    type="date"
                    value={settings.inscription_end_date}
                    onChange={(e) => setSettings({ ...settings, inscription_end_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    Data do Congresso
                  </label>
                  <p className="text-xs text-gray-400 mb-2">Data principal do evento científico</p>
                  <input
                    type="date"
                    value={settings.congress_event_date}
                    onChange={(e) => setSettings({ ...settings, congress_event_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Local do Congresso
                </label>
                <input
                  type="text"
                  value={settings.congress_location}
                  onChange={(e) => setSettings({ ...settings, congress_location: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 hover:scale-105 transition-all shadow-md"
                  style={{ background: "linear-gradient(135deg, #0a1437, #1a2d6e)" }}
                >
                  {savingSettings ? (
                    <><span className="animate-spin">⟳</span> A guardar...</>
                  ) : (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zm2 16H5V5h11.17L19 7.83V19zm-7-7a3 3 0 100 6 3 3 0 000-6zM6 6h9v4H6z"/></svg> Guardar Definições</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── LINKS TAB ── */}
        {activeTab === "links" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-800">Links de Download</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Gerir links para as aplicações móveis</p>
                </div>
                <button
                  onClick={() => { setEditingLink(null); setModalOpen(true); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm hover:scale-105 transition-all"
                  style={{ background: "linear-gradient(135deg, #c8a83c, #f5d675)", color: "#0a1437" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                  Novo Link
                </button>
              </div>

              {links.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="text-4xl mb-4">📱</div>
                  <p className="text-gray-500 font-medium">Nenhum link de download ainda</p>
                  <p className="text-gray-400 text-sm mt-1">Clique em "Novo Link" para adicionar o primeiro</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {links.map((link) => (
                    <div key={link.id} className="px-6 py-4 flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <PlatformBadge platform={link.platform} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">{link.label}</p>
                        <p className="text-gray-400 text-xs truncate mt-0.5">{link.url}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <StatusBadge active={link.active} />
                        <button
                          onClick={() => handleToggleLink(link)}
                          title={link.active ? "Desactivar" : "Activar"}
                          className={`p-1.5 rounded-lg transition-colors ${
                            link.active ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"
                          }`}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 1C5.93 1 1 5.93 1 12s4.93 11 11 11 11-4.93 11-11S18.07 1 12 1zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => { setEditingLink(link); setModalOpen(true); }}
                          className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                          title="Editar"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteLink(link.id)}
                          disabled={deletingId === link.id}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Eliminar"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info card */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4">
              <p className="text-blue-800 text-sm font-medium">💡 Como funciona</p>
              <p className="text-blue-600 text-xs mt-1">
                Quando um link está <strong>activo</strong>, o botão de download correspondente no site fica clicável e redireciona para a loja.
                Quando <strong>inactivo</strong>, aparece a mensagem "Em Breve". A plataforma (Android/iOS) determina qual botão é actualizado.
              </p>
            </div>
          </div>
        )}

        {/* ── SECURITY TAB ── */}
        {activeTab === "security" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Alterar PIN de Acesso</h2>
              <p className="text-xs text-gray-400 mt-0.5">O PIN é armazenado de forma segura na base de dados</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Novo PIN</label>
                  <input
                    type="password"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    autoComplete="new-password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Confirmar PIN</label>
                  <input
                    type="password"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="Repetir novo PIN"
                    autoComplete="new-password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400"
                  />
                </div>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                ⚠️ Após alterar o PIN, será desconectado automaticamente e precisará de fazer login novamente com o novo PIN.
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleChangePin}
                  disabled={!newPin || !confirmPin}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-40 transition-colors"
                >
                  Alterar PIN
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {modalOpen && (
        <LinkModal
          link={editingLink}
          onSave={handleSaveLink}
          onClose={() => { setModalOpen(false); setEditingLink(null); }}
          saving={savingLink}
        />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

/* ─── Main export ─────────────────────────────────────────────────────────── */

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

  return pin ? (
    <AdminDashboard pin={pin} onLogout={handleLogout} />
  ) : (
    <LoginScreen onLogin={handleLogin} />
  );
}
