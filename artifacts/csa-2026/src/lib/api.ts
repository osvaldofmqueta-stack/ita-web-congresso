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
    return { ...DEFAULT_SETTINGS, ...data.settings };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function updateSettings(
  settings: Partial<CongressSettings> & { admin_pin?: string },
  pin: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/csa/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-pin": pin },
      body: JSON.stringify({ settings }),
    });
    const data = await res.json();
    return data;
  } catch {
    return { ok: false, error: "Erro de ligação ao servidor" };
  }
}

export async function verifyPin(pin: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/csa/verify-pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json();
    return data.ok === true;
  } catch {
    return false;
  }
}

export async function fetchLinks(): Promise<AppLink[]> {
  try {
    const res = await fetch(`${API_BASE}/csa/links`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.links ?? [];
  } catch {
    return [];
  }
}

export async function createLink(
  link: Omit<AppLink, "id" | "createdAt" | "updatedAt">,
  pin: string
): Promise<{ ok: boolean; link?: AppLink; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/csa/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-pin": pin },
      body: JSON.stringify(link),
    });
    return await res.json();
  } catch {
    return { ok: false, error: "Erro de ligação ao servidor" };
  }
}

export async function updateLink(
  id: number,
  link: Partial<Omit<AppLink, "id" | "createdAt" | "updatedAt">>,
  pin: string
): Promise<{ ok: boolean; link?: AppLink; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/csa/links/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-pin": pin },
      body: JSON.stringify(link),
    });
    return await res.json();
  } catch {
    return { ok: false, error: "Erro de ligação ao servidor" };
  }
}

export async function deleteLink(
  id: number,
  pin: string
): Promise<{ ok: boolean; error?: string }> {
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
