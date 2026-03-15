/**
 * Popula as configurações do congresso em csa_settings.
 * Executar: pnpm --filter @workspace/scripts seed:settings
 */
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../../.env") });

const SETTINGS: Record<string, string> = {
  congress_name: "Congresso de Alimento 2026",
  congress_abbr: "CSA 2026",
  institution: "Instituto de Tecnologia Agro-Alimentar",
  university: "Universidade Rainha Njinga a Mbande",
  university_abbr: "URNM",
  inscription_end_date: "2026-05-30",
  congress_event_date: "2026-05-01",
  congress_location: "Instituto de Tecnologia Agro-Alimentar, URNM, Angola",
  accepted_formats: JSON.stringify([
    { icon: "📄", title: "Artigo Completo", desc: "8 a 12 páginas, revisão por pares duplo-cego", color: "border-yellow-400/20" },
    { icon: "📝", title: "Resumo Alargado", desc: "2 a 4 páginas, para comunicações orais", color: "border-blue-400/20" },
    { icon: "🖼️", title: "Poster Científico", desc: "Formato A0, apresentação em sessão dedicada", color: "border-green-400/20" },
  ]),
};

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error("Erro: DATABASE_URL não está definida.");
    process.exit(1);
  }

  const { db, csaSettingsTable } = await import("@workspace/db");

  for (const [key, value] of Object.entries(SETTINGS)) {
    await db
      .insert(csaSettingsTable)
      .values({ key, value })
      .onConflictDoUpdate({
        target: csaSettingsTable.key,
        set: { value, updatedAt: new Date() },
      });
  }
  console.log("Configurações do congresso gravadas em csa_settings");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
