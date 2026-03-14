/* Dados do congresso: estáticos + API para datas importantes. */

export const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

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

const STATIC_LINKS: AppLink[] = [];

export function getSettings(): CongressSettings {
  return { ...DEFAULT_SETTINGS };
}

export function getLinks(): AppLink[] {
  return [...STATIC_LINKS];
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

export async function verifyPin(pin: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/csa/verify-pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: pin.trim() }),
    });
    const data = await res.json();
    return data.ok === true;
  } catch {
    return false;
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
