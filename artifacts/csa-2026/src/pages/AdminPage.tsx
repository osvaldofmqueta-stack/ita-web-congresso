import { useState, useEffect, useCallback } from "react";
import {
  verifyPin,
  fetchSettings,
  updateSettings,
  fetchLinks,
  createLink,
  updateLink,
  deleteLink,
  fetchDates,
  createDate,
  updateDate,
  deleteDate,
  fetchSpeakersAll,
  createSpeaker,
  updateSpeaker,
  deleteSpeaker,
  uploadSpeakerPhoto,
  getSpeakerPhotoUrl,
  type CongressSettings,
  type ImportantDate,
  type AppLink,
  type Speaker,
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

const TABS = ["Configurações", "Links da App", "Datas Importantes", "Palestrantes"] as const;
type Tab = (typeof TABS)[number];

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
          <p style={{ color: "#c8a83c" }} className="text-sm mt-1 opacity-80">CSA 2026 — Gestão completa do site</p>
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

/* ─── Configurações (data do congresso, local) ────────────────────────────── */

function AdminSettings({ pin }: { pin: string }) {
  const [settings, setSettings] = useState<CongressSettings>({
    inscription_end_date: "2026-04-30",
    congress_event_date: "2026-05-15",
    congress_location: "Instituto de Tecnologia Agro-Alimentar, URNM, Angola",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings().then(setSettings);
    setLoading(false);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await updateSettings(settings, pin);
    setSaving(false);
    if (res.ok) {
      setSavedMsg("Configurações guardadas. Já estão publicadas no site.");
      setTimeout(() => setSavedMsg(null), 4000);
    }
  };

  if (loading) return <p className="text-white/60">A carregar...</p>;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {savedMsg && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-green-400/40 bg-green-500/20 text-green-200 text-sm">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/30 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
          </span>
          {savedMsg}
        </div>
      )}
      <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-4">
        <h3 className="font-semibold text-yellow-300">Datas e local do congresso</h3>
        <div>
          <label className="block text-white/60 text-xs uppercase tracking-wider mb-1">Fim das inscrições (YYYY-MM-DD)</label>
          <input
            type="text"
            value={settings.inscription_end_date}
            onChange={(e) => setSettings((s) => ({ ...s, inscription_end_date: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
            placeholder="2026-04-30"
          />
        </div>
        <div>
          <label className="block text-white/60 text-xs uppercase tracking-wider mb-1">Data do evento (YYYY-MM-DD)</label>
          <input
            type="text"
            value={settings.congress_event_date}
            onChange={(e) => setSettings((s) => ({ ...s, congress_event_date: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
            placeholder="2026-05-15"
          />
        </div>
        <div>
          <label className="block text-white/60 text-xs uppercase tracking-wider mb-1">Local do congresso</label>
          <input
            type="text"
            value={settings.congress_location}
            onChange={(e) => setSettings((s) => ({ ...s, congress_location: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
            placeholder="Instituto de Tecnologia Agro-Alimentar, URNM, Angola"
          />
        </div>
        <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium text-[#0a1437] bg-[#c8a83c]">
          {saving ? "A guardar..." : "Guardar configurações"}
        </button>
      </div>
    </form>
  );
}

/* ─── Links da App (Android / iOS) ────────────────────────────────────────── */

function AdminLinks({ pin }: { pin: string }) {
  const [links, setLinks] = useState<AppLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [linkSavedMsg, setLinkSavedMsg] = useState<string | null>(null);
  const [newPlatform, setNewPlatform] = useState("android");
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newActive, setNewActive] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const list = await fetchLinks();
    setLinks(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;
    setSaving(true);
    const res = await createLink(
      { platform: newPlatform, label: newLabel.trim() || "Descarregar", url: newUrl.trim(), active: newActive },
      pin
    );
    setSaving(false);
    if (res.ok && res.link) {
      setLinks((prev) => [...prev, res.link!]);
      setNewLabel("");
      setNewUrl("");
      setLinkSavedMsg("Link adicionado. Já está publicado no site.");
      setTimeout(() => setLinkSavedMsg(null), 4000);
    }
  };

  const handleUpdate = async (id: number, updates: { label?: string; url?: string; active?: boolean }) => {
    setSaving(true);
    const res = await updateLink(id, updates, pin);
    setSaving(false);
    if (res.ok && res.link) {
      setLinks((prev) => prev.map((l) => (l.id === id ? res.link! : l)));
      setEditingId(null);
      setLinkSavedMsg("Link guardado. Já está publicado no site.");
      setTimeout(() => setLinkSavedMsg(null), 4000);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remover este link?")) return;
    setSaving(true);
    const res = await deleteLink(id, pin);
    setSaving(false);
    if (res.ok) setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  if (loading) return <p className="text-white/60">A carregar...</p>;

  return (
    <div className="space-y-6">
      {linkSavedMsg && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-green-400/40 bg-green-500/20 text-green-200 text-sm">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/30 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
          </span>
          {linkSavedMsg}
        </div>
      )}
      <div className="p-4 rounded-xl border border-white/10 bg-white/5">
        <h3 className="font-semibold text-yellow-300 mb-4">Links para descarregar a app (Android / iOS)</h3>
        <div className="space-y-3">
          {links.map((l) => (
            <div key={l.id} className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
              <span className="px-2 py-0.5 rounded bg-white/10 text-xs uppercase">{l.platform}</span>
              <input
                type="text"
                value={editingId === l.id ? l.label : l.label}
                onChange={(e) => editingId === l.id && setLinks((prev) => prev.map((x) => (x.id === l.id ? { ...x, label: e.target.value } : x)))}
                className="flex-1 min-w-[100px] px-3 py-1.5 rounded bg-white/10 border border-white/20 text-white text-sm"
                placeholder="Label"
                readOnly={editingId !== l.id}
                onFocus={() => setEditingId(l.id)}
              />
              <input
                type="url"
                value={l.url}
                onChange={(e) => setLinks((prev) => prev.map((x) => (x.id === l.id ? { ...x, url: e.target.value } : x)))}
                className="flex-1 min-w-[180px] px-3 py-1.5 rounded bg-white/10 border border-white/20 text-white text-sm"
                placeholder="URL"
                readOnly={editingId !== l.id}
              />
              <label className="flex items-center gap-2 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={l.active}
                  onChange={(e) => handleUpdate(l.id, { ...l, active: e.target.checked })}
                  className="rounded"
                />
                Ativo
              </label>
              {editingId === l.id ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleUpdate(l.id, { label: l.label, url: l.url, active: l.active })}
                    disabled={saving}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-[#0a1437] bg-[#c8a83c]"
                  >
                    Guardar
                  </button>
                  <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 text-sm text-white/70">
                    Cancelar
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => setEditingId(l.id)} className="px-3 py-1.5 rounded-lg text-sm border border-white/20 hover:bg-white/10">
                  Editar
                </button>
              )}
              <button type="button" onClick={() => handleDelete(l.id)} disabled={saving} className="px-3 py-1.5 rounded-lg text-sm text-red-300 hover:bg-red-500/20">
                Remover
              </button>
            </div>
          ))}
        </div>
        <form onSubmit={handleCreate} className="mt-4 flex flex-wrap items-center gap-3 p-3 rounded-lg border border-dashed border-white/20">
          <select
            value={newPlatform}
            onChange={(e) => setNewPlatform(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
          >
            <option value="android">Android</option>
            <option value="ios">iOS</option>
          </select>
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Ex: Descarregar"
            className="w-32 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
          />
          <input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="URL da loja (Google Play / App Store)"
            className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
            required
          />
          <label className="flex items-center gap-2 text-sm text-white/80">
            <input type="checkbox" checked={newActive} onChange={(e) => setNewActive(e.target.checked)} className="rounded" />
            Ativo
          </label>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium text-[#0a1437] bg-[#c8a83c]">
            Adicionar link
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Datas Importantes (chamada de artigos) ───────────────────────────────── */

function AdminDates({ pin }: { pin: string }) {
  const [dates, setDates] = useState<ImportantDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dateSavedMsg, setDateSavedMsg] = useState<string | null>(null);
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
      setDateSavedMsg("Data adicionada. Já está publicada no site.");
      setTimeout(() => setDateSavedMsg(null), 4000);
    }
  };

  const handleUpdate = async (id: number, updates: { label?: string; date?: string; done?: boolean }) => {
    setSaving(true);
    const res = await updateDate(id, updates, pin);
    setSaving(false);
    if (res.ok && res.date) {
      setDates((prev) => prev.map((d) => (d.id === id ? res.date! : d)));
      setEditingId(null);
      setDateSavedMsg("Alterações guardadas. Já estão publicadas no site.");
      setTimeout(() => setDateSavedMsg(null), 4000);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remover esta data?")) return;
    setSaving(true);
    const res = await deleteDate(id, pin);
    setSaving(false);
    if (res.ok) setDates((prev) => prev.filter((d) => d.id !== id));
  };

  if (loading) return <p className="text-white/60">A carregar...</p>;

  return (
    <div className="space-y-4">
      {dateSavedMsg && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-green-400/40 bg-green-500/20 text-green-200 text-sm">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/30 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
          </span>
          {dateSavedMsg}
        </div>
      )}
      {dates.map((d) => (
        <div key={d.id} className="flex flex-wrap items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5">
          {editingId === d.id ? (
            <>
              <input
                type="text"
                value={d.label}
                onChange={(e) => setDates((prev) => prev.map((x) => (x.id === d.id ? { ...x, label: e.target.value } : x)))}
                className="flex-1 min-w-[180px] px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
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
              <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg text-sm text-white/70 hover:bg-white/10">
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
              <button onClick={() => setEditingId(d.id)} className="px-3 py-1.5 rounded-lg text-sm border border-white/20 hover:bg-white/10">
                Editar
              </button>
              <button onClick={() => handleDelete(d.id)} disabled={saving} className="px-3 py-1.5 rounded-lg text-sm text-red-300 hover:bg-red-500/20">
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
  );
}

/* ─── Palestrantes (foto, categoria, grau académico, origem URNM/Externo) ────── */

const ORIGIN_OPTIONS = ["URNM", "Externo"];

function AdminSpeakers({ pin }: { pin: string }) {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<number | "new" | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newPhotoPreviewUrl, setNewPhotoPreviewUrl] = useState<string | null>(null);
  const [editingPhotoPreviewUrl, setEditingPhotoPreviewUrl] = useState<Record<number, string>>({});
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    role: "",
    area: "",
    country: "",
    initials: "",
    photoUrl: "",
    category: "",
    academicDegree: "",
    origin: "",
    active: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const list = await fetchSpeakersAll(pin);
    setSpeakers(list);
    setLoading(false);
  }, [pin]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    if (newPhotoPreviewUrl) URL.revokeObjectURL(newPhotoPreviewUrl);
    setNewPhotoPreviewUrl(null);
    setForm({
      name: "",
      role: "",
      area: "",
      country: "",
      initials: "",
      photoUrl: "",
      category: "",
      academicDegree: "",
      origin: "",
      active: true,
    });
    setShowForm(false);
    setEditingId(null);
  };

  const showSaved = (msg: string) => {
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(null), 4000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const res = await createSpeaker(
      {
        name: form.name.trim(),
        role: form.role.trim() || "Palestrante",
        area: form.area.trim() || "—",
        country: form.country.trim() || "—",
        initials: form.initials.trim() || form.name.trim().slice(0, 2).toUpperCase(),
        photoUrl: form.photoUrl.trim() || null,
        category: form.category.trim() || null,
        academicDegree: form.academicDegree.trim() || null,
        origin: form.origin.trim() || null,
        active: form.active,
      },
      pin
    );
    setSaving(false);
    if (res.ok && res.speaker) {
      setSpeakers((prev) => [...prev, res.speaker!].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id));
      resetForm();
      showSaved("Palestrante adicionado e já publicado no site.");
    }
  };

  const handleUpdate = async (id: number, s: Speaker) => {
    setSaving(true);
    const res = await updateSpeaker(
      id,
      {
        name: s.name,
        role: s.role,
        area: s.area,
        country: s.country,
        initials: s.initials,
        photoUrl: s.photoUrl,
        category: s.category,
        academicDegree: s.academicDegree,
        origin: s.origin,
        active: s.active,
      },
      pin
    );
    setSaving(false);
    if (res.ok && res.speaker) {
      setSpeakers((prev) => prev.map((x) => (x.id === id ? res.speaker! : x)));
      setEditingId(null);
      if (editingPhotoPreviewUrl[id]) {
        URL.revokeObjectURL(editingPhotoPreviewUrl[id]);
        setEditingPhotoPreviewUrl((prev) => { const next = { ...prev }; delete next[id]; return next; });
      }
      showSaved("Alterações guardadas e já publicadas no site.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remover este palestrante?")) return;
    setSaving(true);
    const res = await deleteSpeaker(id, pin);
    setSaving(false);
    if (res.ok) setSpeakers((prev) => prev.filter((s) => s.id !== id));
  };

  const handlePhotoUpload = async (file: File, speakerId: number | "new") => {
    if (!file.type.startsWith("image/")) return;
    const objectUrl = URL.createObjectURL(file);
    if (speakerId === "new") {
      setNewPhotoPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return objectUrl; });
    } else {
      setEditingPhotoPreviewUrl((prev) => {
        if (prev[speakerId]) URL.revokeObjectURL(prev[speakerId]);
        return { ...prev, [speakerId]: objectUrl };
      });
    }
    setUploadingPhoto(speakerId);
    const res = await uploadSpeakerPhoto(file, pin);
    setUploadingPhoto(null);
    if (res.ok && res.url) {
      if (speakerId === "new") {
        URL.revokeObjectURL(objectUrl);
        setNewPhotoPreviewUrl(null);
        setForm((f) => ({ ...f, photoUrl: res.url! }));
      } else {
        URL.revokeObjectURL(objectUrl);
        setEditingPhotoPreviewUrl((prev) => { const next = { ...prev }; delete next[speakerId]; return next; });
        setSpeakers((prev) => prev.map((s) => (s.id === speakerId ? { ...s, photoUrl: res.url } : s)));
      }
    } else {
      if (speakerId === "new") setNewPhotoPreviewUrl(null);
      else setEditingPhotoPreviewUrl((prev) => { const next = { ...prev }; delete next[speakerId]; return next; });
      URL.revokeObjectURL(objectUrl);
    }
  };

  if (loading) return <p className="text-white/60">A carregar...</p>;

  return (
    <div className="space-y-6">
      {savedMessage && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-green-400/40 bg-green-500/20 text-green-200 text-sm"
          role="alert"
        >
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/30 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
          </span>
          {savedMessage}
        </div>
      )}
      <div className="p-4 rounded-xl border border-white/10 bg-white/5">
        <h3 className="font-semibold text-yellow-300 mb-4">Palestrantes — foto, categoria, grau académico, origem (URNM/Externo)</h3>
        <div className="space-y-4">
          {speakers.map((s) => (
            <div key={s.id} className="flex flex-wrap items-start gap-4 p-4 rounded-xl border border-white/10 bg-white/5">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/10 flex-shrink-0 flex items-center justify-center relative">
                {editingPhotoPreviewUrl[s.id] ? (
                  <img src={editingPhotoPreviewUrl[s.id]} alt={s.name} className="w-full h-full object-cover" />
                ) : s.photoUrl ? (
                  <img src={getSpeakerPhotoUrl(s.photoUrl)} alt={s.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-yellow-300 text-xl font-bold">{s.initials || "?"}</span>
                )}
                {editingId === s.id && (
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer text-white text-xs">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingPhoto !== null}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handlePhotoUpload(f, s.id);
                        e.target.value = "";
                      }}
                    />
                    {uploadingPhoto === s.id ? "A subir..." : "Alterar foto"}
                  </label>
                )}
              </div>
              {editingId === s.id ? (
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0">
                  <input
                    value={s.name}
                    onChange={(e) => setSpeakers((prev) => prev.map((x) => (x.id === s.id ? { ...x, name: e.target.value } : x)))}
                    className="px-3 py-1.5 rounded bg-white/10 border border-white/20 text-white text-sm"
                    placeholder="Nome"
                  />
                  <input
                    value={s.role}
                    onChange={(e) => setSpeakers((prev) => prev.map((x) => (x.id === s.id ? { ...x, role: e.target.value } : x)))}
                    className="px-3 py-1.5 rounded bg-white/10 border border-white/20 text-white text-sm"
                    placeholder="Função / role"
                  />
                  <input
                    value={s.area}
                    onChange={(e) => setSpeakers((prev) => prev.map((x) => (x.id === s.id ? { ...x, area: e.target.value } : x)))}
                    className="px-3 py-1.5 rounded bg-white/10 border border-white/20 text-white text-sm"
                    placeholder="Área"
                  />
                  <input
                    value={s.country}
                    onChange={(e) => setSpeakers((prev) => prev.map((x) => (x.id === s.id ? { ...x, country: e.target.value } : x)))}
                    className="px-3 py-1.5 rounded bg-white/10 border border-white/20 text-white text-sm"
                    placeholder="País"
                  />
                  <div className="sm:col-span-2 flex items-center gap-4">
                    <label className="px-3 py-1.5 rounded bg-white/10 border border-white/20 text-white text-sm cursor-pointer hover:bg-white/15">
                      {uploadingPhoto === s.id ? "A subir..." : "Subir foto (local)"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingPhoto !== null}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handlePhotoUpload(f, s.id);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    {(editingPhotoPreviewUrl[s.id] || s.photoUrl) && (
                      <div className="flex items-center gap-2">
                        <span className="text-white/50 text-xs">Pré-visualização:</span>
                        <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-yellow-400/30 bg-white/5">
                          <img
                            src={editingPhotoPreviewUrl[s.id] || getSpeakerPhotoUrl(s.photoUrl)}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-white/40 text-xs">Guardar para publicar no site</span>
                      </div>
                    )}
                  </div>
                  <input
                    value={s.category ?? ""}
                    onChange={(e) => setSpeakers((prev) => prev.map((x) => (x.id === s.id ? { ...x, category: e.target.value.trim() || null } : x)))}
                    className="px-3 py-1.5 rounded bg-white/10 border border-white/20 text-white text-sm"
                    placeholder="Categoria"
                  />
                  <input
                    value={s.academicDegree ?? ""}
                    onChange={(e) => setSpeakers((prev) => prev.map((x) => (x.id === s.id ? { ...x, academicDegree: e.target.value.trim() || null } : x)))}
                    className="px-3 py-1.5 rounded bg-white/10 border border-white/20 text-white text-sm"
                    placeholder="Grau académico"
                  />
                  <select
                    value={s.origin ?? ""}
                    onChange={(e) => setSpeakers((prev) => prev.map((x) => (x.id === s.id ? { ...x, origin: e.target.value.trim() || null } : x)))}
                    className="px-3 py-1.5 rounded bg-white/10 border border-white/20 text-white text-sm"
                  >
                    <option value="">— Origem —</option>
                    {ORIGIN_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={s.active}
                      onChange={(e) => setSpeakers((prev) => prev.map((x) => (x.id === s.id ? { ...x, active: e.target.checked } : x)))}
                      className="rounded"
                    />
                    Visível no site
                  </label>
                  <div className="sm:col-span-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdate(s.id, s)}
                      disabled={saving}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium text-[#0a1437] bg-[#c8a83c]"
                    >
                      Guardar
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 text-sm text-white/70">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-white/60 text-sm">{s.role} · {s.area}</p>
                    <p className="text-white/50 text-xs">{s.country}</p>
                    {s.academicDegree && <p className="text-yellow-300/80 text-xs">{s.academicDegree}</p>}
                    {s.category && <span className="inline-block mt-1 px-2 py-0.5 rounded bg-white/10 text-xs">{s.category}</span>}
                    {s.origin && <p className="text-white/40 text-xs uppercase mt-1">{s.origin}</p>}
                  </div>
                  <button onClick={() => setEditingId(s.id)} className="px-3 py-1.5 rounded-lg text-sm border border-white/20 hover:bg-white/10">
                    Editar
                  </button>
                  <button onClick={() => handleDelete(s.id)} disabled={saving} className="px-3 py-1.5 rounded-lg text-sm text-red-300 hover:bg-red-500/20">
                    Remover
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {showForm ? (
          <form onSubmit={handleCreate} className="mt-6 p-4 rounded-xl border border-dashed border-white/20 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nome *"
                className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
                required
              />
              <input
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                placeholder="Função / role"
                className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
              />
              <input
                value={form.area}
                onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
                placeholder="Área"
                className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
              />
              <input
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                placeholder="País"
                className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
              />
              <input
                value={form.initials}
                onChange={(e) => setForm((f) => ({ ...f, initials: e.target.value }))}
                placeholder="Iniciais (opcional)"
                className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
              />
              <div className="sm:col-span-2">
                <label className="inline-block px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm cursor-pointer hover:bg-white/15 mb-2">
                  {uploadingPhoto === "new" ? "A subir..." : "Subir foto (escolher ficheiro local)"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingPhoto !== null}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handlePhotoUpload(f, "new");
                      e.target.value = "";
                    }}
                  />
                </label>
                {(newPhotoPreviewUrl || form.photoUrl) && (
                  <div className="mt-2 p-3 rounded-xl bg-white/5 border border-white/10 inline-block">
                    <p className="text-white/70 text-xs mb-2">Pré-visualização (já visível ao publicar):</p>
                    <div className="w-28 h-28 rounded-xl overflow-hidden border-2 border-yellow-400/30">
                      <img
                        src={newPhotoPreviewUrl || getSpeakerPhotoUrl(form.photoUrl)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
              <input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="Categoria"
                className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
              />
              <input
                value={form.academicDegree}
                onChange={(e) => setForm((f) => ({ ...f, academicDegree: e.target.value }))}
                placeholder="Grau académico"
                className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
              />
              <select
                value={form.origin}
                onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))}
                className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
              >
                <option value="">Origem (URNM/Externo)</option>
                {ORIGIN_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm text-white/80">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="rounded" />
                Visível no site
              </label>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium text-[#0a1437] bg-[#c8a83c]">
                Adicionar palestrante
              </button>
              <button type="button" onClick={resetForm} className="px-3 py-2 text-sm text-white/70">
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 w-full py-3 rounded-xl border border-dashed border-white/30 text-white/70 hover:bg-white/5 hover:text-white transition-colors"
          >
            + Novo palestrante
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Layout com abas ─────────────────────────────────────────────────────── */

function AdminLayout({ pin, onLogout }: { pin: string; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("Configurações");

  return (
    <div className="min-h-screen bg-[#0a1437] text-white">
      <header className="border-b border-white/10 bg-[#0a1437]/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <img src="/csa-logo.png" alt="CSA" className="h-9 w-9 object-contain" />
            <div>
              <h1 className="font-bold text-lg">Administração CSA 2026</h1>
              <p className="text-white/50 text-xs">Configurações, links da app, datas e palestrantes</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="px-3 py-1.5 rounded-lg text-sm border border-white/20 text-white/80 hover:bg-white/10"
          >
            Sair
          </button>
        </div>
        <div className="max-w-5xl mx-auto px-4 pb-2 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-[#c8a83c] text-[#0a1437]"
                  : "text-white/70 hover:bg-white/10"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {tab === "Configurações" && <AdminSettings pin={pin} />}
        {tab === "Links da App" && <AdminLinks pin={pin} />}
        {tab === "Datas Importantes" && <AdminDates pin={pin} />}
        {tab === "Palestrantes" && <AdminSpeakers pin={pin} />}
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

  return <AdminLayout pin={pin} onLogout={handleLogout} />;
}
