import { useState, useEffect } from "react";
import {
  loadSettings,
  saveSettings,
  isAdminAuthenticated,
  authenticateAdmin,
  logoutAdmin,
  type CongressSettings,
} from "@/lib/settings";

/* ─── Login Screen ────────────────────────────────────────────────────────── */

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (authenticateAdmin(pin)) {
        onLogin();
      } else {
        setError("PIN incorrecto. Tente novamente.");
        setPin("");
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #0a1437 0%, #1a2d6e 100%)" }}
    >
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="flex justify-center gap-3 mb-4">
            <img src="/csa-logo.png" alt="CSA" className="w-14 h-14 object-contain" />
          </div>
          <h1 className="text-white font-bold text-2xl">Área Administrativa</h1>
          <p className="text-yellow-300/70 text-sm mt-1">CSA 2026 — URNM</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            className="rounded-2xl p-6 border border-white/10"
            style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)" }}
          >
            <label className="block text-white/70 text-xs font-medium uppercase tracking-wider mb-2">
              PIN de Acesso
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(""); }}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 text-center text-xl tracking-widest focus:outline-none focus:border-yellow-400/60 transition-colors"
              autoFocus
            />
            {error && (
              <p className="text-red-400 text-xs mt-2 text-center">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!pin || loading}
            className="w-full py-3.5 rounded-xl font-bold text-[#0a1437] text-sm disabled:opacity-50 transition-all hover:scale-105 disabled:hover:scale-100"
            style={{ background: "linear-gradient(135deg, #c8a83c, #f5d675)" }}
          >
            {loading ? "A verificar..." : "Entrar"}
          </button>
        </form>

        <p className="text-center text-white/25 text-xs mt-6">
          PIN padrão: <span className="font-mono">admin2026</span>
        </p>

        <div className="text-center mt-4">
          <a
            href="/"
            className="text-white/40 hover:text-white/70 text-xs transition-colors"
          >
            ← Voltar ao site
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── Toast ───────────────────────────────────────────────────────────────── */

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-medium transition-all border ${
      type === "success"
        ? "bg-green-900/90 border-green-500/40 text-green-200"
        : "bg-red-900/90 border-red-500/40 text-red-200"
    }`}>
      {type === "success" ? "✅" : "❌"} {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">✕</button>
    </div>
  );
}

/* ─── Section Card ────────────────────────────────────────────────────────── */

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <h2 className="font-semibold text-gray-800 text-base">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

/* ─── Field ───────────────────────────────────────────────────────────────── */

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-2">{hint}</p>}
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors disabled:bg-gray-50 disabled:text-gray-400"
    />
  );
}

/* ─── Admin Dashboard ─────────────────────────────────────────────────────── */

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [settings, setSettings] = useState<CongressSettings>(loadSettings());
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const set = (key: keyof CongressSettings, value: string) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    saveSettings(settings);
    setToast({ message: "Definições guardadas com sucesso!", type: "success" });
  };

  const handleSavePin = () => {
    if (!newPin || newPin.length < 4) {
      setToast({ message: "O PIN deve ter pelo menos 4 caracteres.", type: "error" });
      return;
    }
    if (newPin !== confirmPin) {
      setToast({ message: "Os PINs não coincidem.", type: "error" });
      return;
    }
    const updated = { ...settings, adminPin: newPin };
    setSettings(updated);
    saveSettings(updated);
    setNewPin("");
    setConfirmPin("");
    setToast({ message: "PIN alterado com sucesso!", type: "success" });
  };

  const handleLogout = () => {
    logoutAdmin();
    onLogout();
  };

  const androidActive = settings.androidLink.trim() !== "";
  const iosActive = settings.iosLink.trim() !== "";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/csa-logo.png" alt="CSA" className="w-8 h-8 object-contain" />
            <div>
              <span className="font-bold text-gray-800 text-sm">CSA 2026</span>
              <span className="mx-2 text-gray-300">|</span>
              <span className="text-gray-500 text-sm">Área Administrativa</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
              </svg>
              Ver site
            </a>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #0a1437, #1a2d6e)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zm2 16H5V5h11.17L19 7.83V19zm-7-7a3 3 0 100 6 3 3 0 000-6zM6 6h9v4H6z"/>
              </svg>
              Guardar
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Sair"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4a2 2 0 00-2 2v14a2 2 0 002 2h8v-2H4V5z"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Status bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Inscrições", value: new Date(settings.inscriptionEndDate) > new Date() ? "Abertas" : "Encerradas", color: new Date(settings.inscriptionEndDate) > new Date() ? "text-green-600 bg-green-50 border-green-200" : "text-red-600 bg-red-50 border-red-200" },
            { label: "App Android", value: androidActive ? "Activo" : "Em breve", color: androidActive ? "text-green-600 bg-green-50 border-green-200" : "text-yellow-600 bg-yellow-50 border-yellow-200" },
            { label: "App iOS", value: iosActive ? "Activo" : "Em breve", color: iosActive ? "text-green-600 bg-green-50 border-green-200" : "text-yellow-600 bg-yellow-50 border-yellow-200" },
            { label: "Data Congresso", value: new Date(settings.congressEventDate).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" }), color: "text-blue-700 bg-blue-50 border-blue-200" },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-xl border px-4 py-3 ${stat.color}`}>
              <p className="text-xs font-medium opacity-70 uppercase tracking-wider">{stat.label}</p>
              <p className="font-bold text-sm mt-0.5">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Dates section */}
        <SectionCard title="Datas do Congresso" icon="📅">
          <div className="grid sm:grid-cols-2 gap-5">
            <Field
              label="Data de encerramento das inscrições"
              hint="Os participantes vêem uma contagem decrescente até esta data"
            >
              <Input
                type="date"
                value={settings.inscriptionEndDate}
                onChange={(v) => set("inscriptionEndDate", v)}
              />
            </Field>
            <Field
              label="Data do Congresso"
              hint="Data principal do evento"
            >
              <Input
                type="date"
                value={settings.congressEventDate}
                onChange={(v) => set("congressEventDate", v)}
              />
            </Field>
          </div>
        </SectionCard>

        {/* Download Links */}
        <SectionCard title="Links de Download das Aplicações" icon="📱">
          <div className="space-y-5">
            <Field
              label="Link Android (Google Play Store)"
              hint='Deixe vazio para mostrar "Em Breve". Ex: https://play.google.com/store/apps/details?id=...'
            >
              <div className="flex gap-2">
                <Input
                  value={settings.androidLink}
                  onChange={(v) => set("androidLink", v)}
                  placeholder="https://play.google.com/store/apps/..."
                />
                {androidActive && (
                  <a
                    href={settings.androidLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl bg-green-100 text-green-700 text-xs font-medium hover:bg-green-200 transition-colors"
                  >
                    Testar
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${androidActive ? "bg-green-500" : "bg-yellow-400"}`} />
                <span className="text-xs text-gray-500">{androidActive ? "Link activo — botão de download visível no site" : "Em breve — botão mostrará aviso no site"}</span>
              </div>
            </Field>

            <Field
              label="Link iOS (Apple App Store)"
              hint='Deixe vazio para mostrar "Em Breve". Ex: https://apps.apple.com/app/...'
            >
              <div className="flex gap-2">
                <Input
                  value={settings.iosLink}
                  onChange={(v) => set("iosLink", v)}
                  placeholder="https://apps.apple.com/app/..."
                />
                {iosActive && (
                  <a
                    href={settings.iosLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl bg-green-100 text-green-700 text-xs font-medium hover:bg-green-200 transition-colors"
                  >
                    Testar
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${iosActive ? "bg-green-500" : "bg-yellow-400"}`} />
                <span className="text-xs text-gray-500">{iosActive ? "Link activo — botão de download visível no site" : "Em breve — botão mostrará aviso no site"}</span>
              </div>
            </Field>
          </div>
        </SectionCard>

        {/* Save button (main) */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #0a1437, #1a2d6e)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zm2 16H5V5h11.17L19 7.83V19zm-7-7a3 3 0 100 6 3 3 0 000-6zM6 6h9v4H6z"/>
            </svg>
            Guardar Todas as Definições
          </button>
        </div>

        {/* Change PIN */}
        <SectionCard title="Alterar PIN de Acesso" icon="🔐">
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Novo PIN" hint="Mínimo 4 caracteres">
              <Input
                type="password"
                value={newPin}
                onChange={setNewPin}
                placeholder="Novo PIN"
              />
            </Field>
            <Field label="Confirmar PIN">
              <Input
                type="password"
                value={confirmPin}
                onChange={setConfirmPin}
                placeholder="Repetir PIN"
              />
            </Field>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Depois de alterar o PIN, precisará de o usar na próxima vez que entrar.
            </p>
            <button
              onClick={handleSavePin}
              disabled={!newPin || !confirmPin}
              className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-40 transition-colors"
            >
              Alterar PIN
            </button>
          </div>
        </SectionCard>

        {/* Footer info */}
        <p className="text-center text-gray-400 text-xs pb-4">
          As alterações são aplicadas imediatamente após guardar. Abra o site em modo privado para ver as mudanças sem cache.
        </p>
      </main>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────────────────────── */

export default function AdminPage() {
  const [authed, setAuthed] = useState(isAdminAuthenticated());

  return authed ? (
    <AdminDashboard onLogout={() => setAuthed(false)} />
  ) : (
    <LoginScreen onLogin={() => setAuthed(true)} />
  );
}
