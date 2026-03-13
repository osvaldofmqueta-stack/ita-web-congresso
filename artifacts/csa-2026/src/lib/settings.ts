export interface CongressSettings {
  inscriptionEndDate: string;
  androidLink: string;
  iosLink: string;
  congressEventDate: string;
  adminPin: string;
}

const STORAGE_KEY = "csa2026_settings";
const AUTH_KEY = "csa2026_admin_auth";

export const DEFAULT_SETTINGS: CongressSettings = {
  inscriptionEndDate: "2026-04-30",
  androidLink: "",
  iosLink: "",
  congressEventDate: "2026-05-15",
  adminPin: "admin2026",
};

export function loadSettings(): CongressSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: CongressSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function isAdminAuthenticated(): boolean {
  return localStorage.getItem(AUTH_KEY) === "true";
}

export function authenticateAdmin(pin: string): boolean {
  const settings = loadSettings();
  if (pin === settings.adminPin) {
    localStorage.setItem(AUTH_KEY, "true");
    return true;
  }
  return false;
}

export function logoutAdmin(): void {
  localStorage.removeItem(AUTH_KEY);
}
