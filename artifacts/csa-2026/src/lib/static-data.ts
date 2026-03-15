/**
 * Dados estáticos do congresso — página sem dependência da API.
 */

export interface AcceptedFormat {
  icon: string;
  title: string;
  desc: string;
  color: string;
}

export interface RegistrationPricingCategory {
  label: string;
  spectatorPrices: { urnm: string; ext: string };
}

export interface RegistrationPricing {
  categories: RegistrationPricingCategory[];
  prelectoresPrice: string;
}

export interface CongressSettings {
  congress_name: string;
  congress_abbr: string;
  institution: string;
  university: string;
  university_abbr: string;
  inscription_end_date: string;
  congress_event_date: string;
  congress_location: string;
  accepted_formats: AcceptedFormat[];
  registration_pricing: RegistrationPricing | null;
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

export const STATIC_SETTINGS: CongressSettings = {
  congress_name: "Congresso de Alimento 2026",
  congress_abbr: "CSA 2026",
  institution: "Instituto de Tecnologia Agro-Alimentar",
  university: "Universidade Rainha Njinga a Mbande",
  university_abbr: "URNM",
  inscription_end_date: "2026-05-30",
  congress_event_date: "2026-05-01",
  congress_location: "Instituto de Tecnologia Agro-Alimentar, URNM, Angola",
  accepted_formats: [
    { icon: "📄", title: "Artigo Completo", desc: "8 a 12 páginas, revisão por pares duplo-cego", color: "border-yellow-400/20" },
    { icon: "📝", title: "Resumo Alargado", desc: "2 a 4 páginas, para comunicações orais", color: "border-blue-400/20" },
    { icon: "🖼️", title: "Poster Científico", desc: "Formato A0, apresentação em sessão dedicada", color: "border-green-400/20" },
  ],
  registration_pricing: {
    categories: [
      { label: "Docentes/Investigadores", spectatorPrices: { urnm: "5.000", ext: "7.000" } },
      { label: "Estudantes", spectatorPrices: { urnm: "3.000", ext: "4.000" } },
      { label: "Outros", spectatorPrices: { urnm: "5.000", ext: "10.000" } },
    ],
    prelectoresPrice: "20.000",
  },
};

export const STATIC_DATES: ImportantDate[] = [
  { id: 1, label: "Submissão de resumos", date: "15 Mar 2026", done: false, sortOrder: 1, createdAt: "", updatedAt: "" },
  { id: 2, label: "Divulgação de resultados", date: "10 Abr 2026", done: false, sortOrder: 2, createdAt: "", updatedAt: "" },
  { id: 3, label: "Início das inscrições", date: "20 Abr 2026", done: false, sortOrder: 3, createdAt: "", updatedAt: "" },
  { id: 4, label: "Fim das inscrições", date: "30 Mai 2026", done: false, sortOrder: 4, createdAt: "", updatedAt: "" },
  { id: 5, label: "Congresso", date: "01 Mai 2026", done: false, sortOrder: 5, createdAt: "", updatedAt: "" },
];

export const STATIC_LINKS: AppLink[] = [];

export const STATIC_SPEAKERS: Speaker[] = [];

export function getSpeakerPhotoUrl(photoUrl: string | null | undefined): string {
  if (!photoUrl) return "";
  if (photoUrl.startsWith("http")) return photoUrl;
  return photoUrl;
}
