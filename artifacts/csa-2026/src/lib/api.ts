/* Dados do congresso: estáticos + API para datas importantes. */

export const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

/** Base URL para ficheiros estáticos (fotos de palestrantes). Usar quando a API está noutra origem. */
const UPLOADS_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")
  : "";

export function getSpeakerPhotoUrl(photoUrl: string | null | undefined): string {
  if (!photoUrl) return "";
  if (photoUrl.startsWith("http")) return photoUrl;
  return UPLOADS_BASE + photoUrl;
}

export interface CongressSettings {
  inscription_end_date: string;
  congress_event_date: string;
  congress_location: string;
}

export interface AppLink {
  id: number;
  platform: string;
  label: string;
  url: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ImportantDate {
  id: number;
  label: string;
  date: string;
  done: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Speaker {
  id: number;
  name: string;
  role: string;
  area: string;
  country: string;
  initials: string;
  photoUrl: string | null;
  category: string | null;
  academicDegree: string | null;
  origin: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_SETTINGS: CongressSettings = {
  inscription_end_date: "2026-04-30",
  congress_event_date: "2026-05-15",
  congress_location: "Instituto de Tecnologia Agro-Alimentar, URNM, Angola",
};

export async function fetchSettings(): Promise<CongressSettings> {
  try {
    const res = await fetch(`${API_BASE}/csa/settings`);
    if (!res.ok) return DEFAULT_SETTINGS;
    const data = await res.json();
    const s = data.settings ?? {};
    return {
      inscription_end_date: s.inscription_end_date ?? DEFAULT_SETTINGS.inscription_end_date,
      congress_event_date: s.congress_event_date ?? DEFAULT_SETTINGS.congress_event_date,
      congress_location: s.congress_location ?? DEFAULT_SETTINGS.congress_location,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function mapLink(row: { id: number; platform: string; label: string; url: string; active: boolean; createdAt: Date | string; updatedAt: Date | string }): AppLink {
  return {
    id: row.id,
    platform: row.platform,
    label: row.label,
    url: row.url,
    active: row.active,
    createdAt: typeof row.createdAt === "string" ? row.createdAt : (row.createdAt as Date).toISOString(),
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : (row.updatedAt as Date).toISOString(),
  };
}

export async function fetchLinks(): Promise<AppLink[]> {
  try {
    const res = await fetch(`${API_BASE}/csa/links`);
    if (!res.ok) return [];
    const data = await res.json();
    const list = data.links ?? [];
    return list.map((r: Record<string, unknown>) => mapLink({
      id: r.id as number,
      platform: (r.platform as string) ?? "",
      label: (r.label as string) ?? "",
      url: (r.url as string) ?? "",
      active: (r.active as boolean) ?? false,
      createdAt: r.createdAt as string | Date,
      updatedAt: r.updatedAt as string | Date,
    }));
  } catch {
    return [];
  }
}

/* ─── Datas importantes (API) ──────────────────────────────────────────────── */

function mapDate(row: { id: number; label: string; date: string; done: boolean; sortOrder: number; createdAt: Date | string; updatedAt: Date | string }): ImportantDate {
  return {
    id: row.id,
    label: row.label,
    date: row.date,
    done: row.done,
    sortOrder: row.sortOrder,
    createdAt: typeof row.createdAt === "string" ? row.createdAt : (row.createdAt as Date).toISOString(),
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : (row.updatedAt as Date).toISOString(),
  };
}

export async function fetchDates(): Promise<ImportantDate[]> {
  try {
    const res = await fetch(`${API_BASE}/csa/dates`);
    if (!res.ok) return [];
    const data = await res.json();
    const list = data.dates ?? [];
    return list.map(mapDate);
  } catch {
    return [];
  }
}

const DEFAULT_ADMIN_PIN = "admin2026";

export async function verifyPin(pin: string): Promise<boolean> {
  const trimmedPin = pin.trim();
  try {
    const res = await fetch(`${API_BASE}/csa/verify-pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: trimmedPin }),
    });
    const data = await res.json();
    if (data.ok === true) return true;
    // Se a API não estiver disponível (ex: backend não corre), aceitar o PIN padrão para permitir entrar
    if (!res.ok && trimmedPin === DEFAULT_ADMIN_PIN) return true;
    return false;
  } catch {
    // Fallback: sem backend, aceitar apenas o PIN padrão para o admin continuar acessível
    return trimmedPin === DEFAULT_ADMIN_PIN;
  }
}

export async function createDate(
  entry: { label: string; date: string; done?: boolean; sortOrder?: number },
  pin: string
): Promise<{ ok: boolean; date?: ImportantDate; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/csa/dates`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-pin": pin },
      body: JSON.stringify(entry),
    });
    const data = await res.json();
    if (data.date) data.date = mapDate(data.date);
    return data;
  } catch {
    return { ok: false, error: "Erro de ligação ao servidor" };
  }
}

export async function updateDate(
  id: number,
  entry: { label?: string; date?: string; done?: boolean; sortOrder?: number },
  pin: string
): Promise<{ ok: boolean; date?: ImportantDate; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/csa/dates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-pin": pin },
      body: JSON.stringify(entry),
    });
    const data = await res.json();
    if (data.date) data.date = mapDate(data.date);
    return data;
  } catch {
    return { ok: false, error: "Erro de ligação ao servidor" };
  }
}

export async function deleteDate(id: number, pin: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/csa/dates/${id}`, {
      method: "DELETE",
      headers: { "x-admin-pin": pin },
    });
    return await res.json();
  } catch {
    return { ok: false, error: "Erro de ligação ao servidor" };
  }
}

/* ─── Settings (admin) ────────────────────────────────────────────────────── */

export async function updateSettings(settings: Partial<CongressSettings>, pin: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/csa/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-pin": pin },
      body: JSON.stringify({ settings }),
    });
    return await res.json();
  } catch {
    return { ok: false, error: "Erro de ligação ao servidor" };
  }
}

/* ─── Links da app (admin) ────────────────────────────────────────────────── */

export async function createLink(
  entry: { platform: string; label: string; url: string; active?: boolean },
  pin: string
): Promise<{ ok: boolean; link?: AppLink; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/csa/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-pin": pin },
      body: JSON.stringify(entry),
    });
    const data = await res.json();
    if (data.link) data.link = mapLink(data.link);
    return data;
  } catch {
    return { ok: false, error: "Erro de ligação ao servidor" };
  }
}

export async function updateLink(
  id: number,
  entry: { platform?: string; label?: string; url?: string; active?: boolean },
  pin: string
): Promise<{ ok: boolean; link?: AppLink; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/csa/links/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-pin": pin },
      body: JSON.stringify(entry),
    });
    const data = await res.json();
    if (data.link) data.link = mapLink(data.link);
    return data;
  } catch {
    return { ok: false, error: "Erro de ligação ao servidor" };
  }
}

export async function deleteLink(id: number, pin: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/csa/links/${id}`, {
      method: "DELETE",
      headers: { "x-admin-pin": pin },
    });
    return await res.json();
  } catch {
    return { ok: false, error: "Erro de ligação ao servidor" };
  }
}

/* ─── Palestrantes ────────────────────────────────────────────────────────── */

function mapSpeaker(row: {
  id: number; name: string; role: string; area: string; country: string; initials: string;
  photoUrl?: string | null; category?: string | null; academicDegree?: string | null; origin?: string | null;
  active: boolean; sortOrder: number; createdAt: Date | string; updatedAt: Date | string;
}): Speaker {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    area: row.area,
    country: row.country,
    initials: row.initials,
    photoUrl: row.photoUrl ?? null,
    category: row.category ?? null,
    academicDegree: row.academicDegree ?? null,
    origin: row.origin ?? null,
    active: row.active,
    sortOrder: row.sortOrder,
    createdAt: typeof row.createdAt === "string" ? row.createdAt : (row.createdAt as Date).toISOString(),
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : (row.updatedAt as Date).toISOString(),
  };
}

export async function fetchSpeakers(): Promise<Speaker[]> {
  try {
    const res = await fetch(`${API_BASE}/csa/speakers`);
    if (!res.ok) return [];
    const data = await res.json();
    const list = data.speakers ?? [];
    return list.map((r: Record<string, unknown>) => mapSpeaker({
      id: r.id as number,
      name: (r.name as string) ?? "",
      role: (r.role as string) ?? "",
      area: (r.area as string) ?? "",
      country: (r.country as string) ?? "",
      initials: (r.initials as string) ?? "",
      photoUrl: (r.photoUrl as string | null) ?? (r.photo_url as string | null),
      category: (r.category as string | null) ?? null,
      academicDegree: (r.academicDegree as string | null) ?? (r.academic_degree as string | null),
      origin: (r.origin as string | null) ?? null,
      active: (r.active as boolean) ?? true,
      sortOrder: (r.sortOrder as number) ?? (r.sort_order as number) ?? 0,
      createdAt: r.createdAt as Date | string ?? (r.created_at as string),
      updatedAt: r.updatedAt as Date | string ?? (r.updated_at as string),
    }));
  } catch {
    return [];
  }
}

export async function fetchSpeakersAll(pin: string): Promise<Speaker[]> {
  try {
    const res = await fetch(`${API_BASE}/csa/speakers/all`, {
      headers: { "x-admin-pin": pin },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const list = data.speakers ?? [];
    return list.map((r: Record<string, unknown>) => mapSpeaker({
      id: r.id as number,
      name: (r.name as string) ?? "",
      role: (r.role as string) ?? "",
      area: (r.area as string) ?? "",
      country: (r.country as string) ?? "",
      initials: (r.initials as string) ?? "",
      photoUrl: (r.photoUrl as string | null) ?? (r.photo_url as string | null),
      category: (r.category as string | null) ?? null,
      academicDegree: (r.academicDegree as string | null) ?? (r.academic_degree as string | null),
      origin: (r.origin as string | null) ?? null,
      active: (r.active as boolean) ?? true,
      sortOrder: (r.sortOrder as number) ?? (r.sort_order as number) ?? 0,
      createdAt: r.createdAt as Date | string ?? (r.created_at as string),
      updatedAt: r.updatedAt as Date | string ?? (r.updated_at as string),
    }));
  } catch {
    return [];
  }
}

export async function createSpeaker(
  entry: {
    name: string; role: string; area: string; country: string; initials?: string;
    photoUrl?: string | null; category?: string | null; academicDegree?: string | null; origin?: string | null;
    active?: boolean; sortOrder?: number;
  },
  pin: string
): Promise<{ ok: boolean; speaker?: Speaker; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/csa/speakers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-pin": pin },
      body: JSON.stringify(entry),
    });
    const data = await res.json();
    if (data.speaker) data.speaker = mapSpeaker(data.speaker);
    return data;
  } catch {
    return { ok: false, error: "Erro de ligação ao servidor" };
  }
}

export async function updateSpeaker(
  id: number,
  entry: {
    name?: string; role?: string; area?: string; country?: string; initials?: string;
    photoUrl?: string | null; category?: string | null; academicDegree?: string | null; origin?: string | null;
    active?: boolean; sortOrder?: number;
  },
  pin: string
): Promise<{ ok: boolean; speaker?: Speaker; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/csa/speakers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-pin": pin },
      body: JSON.stringify(entry),
    });
    const data = await res.json();
    if (data.speaker) data.speaker = mapSpeaker(data.speaker);
    return data;
  } catch {
    return { ok: false, error: "Erro de ligação ao servidor" };
  }
}

export async function deleteSpeaker(id: number, pin: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/csa/speakers/${id}`, {
      method: "DELETE",
      headers: { "x-admin-pin": pin },
    });
    return await res.json();
  } catch {
    return { ok: false, error: "Erro de ligação ao servidor" };
  }
}

/** Upload de foto do palestrante (ficheiro local). Devolve a URL para guardar em photoUrl. */
export async function uploadSpeakerPhoto(file: File, pin: string): Promise<{ ok: boolean; url?: string; error?: string }> {
  try {
    const formData = new FormData();
    formData.append("photo", file);
    const res = await fetch(`${API_BASE}/csa/upload-photo`, {
      method: "POST",
      headers: { "x-admin-pin": pin },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || "Erro no upload" };
    return { ok: true, url: data.url };
  } catch {
    return { ok: false, error: "Erro de ligação ao servidor" };
  }
}
