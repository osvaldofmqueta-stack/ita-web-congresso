/**
 * Popula as datas importantes do congresso em csa_important_dates.
 * Executar: pnpm --filter @workspace/scripts seed:important-dates
 */
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../../.env") });

const IMPORTANT_DATES: { label: string; date: string; sortOrder: number }[] = [
  { label: "Submissão de resumos", date: "15 Mar 2026", sortOrder: 1 },
  { label: "Divulgação de resultados", date: "10 Abr 2026", sortOrder: 2 },
  { label: "Início das inscrições", date: "20 Abr 2026", sortOrder: 3 },
  { label: "Fim das inscrições", date: "30 Mai 2026", sortOrder: 4 },
  { label: "Congresso", date: "01 Mai 2026", sortOrder: 5 },
];

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error("Erro: DATABASE_URL não está definida.");
    process.exit(1);
  }

  const { db, csaImportantDatesTable } = await import("@workspace/db");

  await db.delete(csaImportantDatesTable);

  for (const d of IMPORTANT_DATES) {
    await db.insert(csaImportantDatesTable).values({
      label: d.label,
      date: d.date,
      done: false,
      sortOrder: d.sortOrder,
    });
  }
  console.log(`${IMPORTANT_DATES.length} datas importantes gravadas em csa_important_dates`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
