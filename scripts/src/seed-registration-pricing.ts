/**
 * Popula a tabela csa_settings com as taxas de inscrição (registration_pricing).
 * Executar: pnpm --filter @workspace/scripts seed:pricing
 */
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../../.env") });

import { db, csaSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const REGISTRATION_PRICING = {
  categories: [
    { label: "Docentes/Investigadores", spectatorPrices: { urnm: "5.000", ext: "7.000" } },
    { label: "Estudantes", spectatorPrices: { urnm: "3.000", ext: "4.000" } },
    { label: "Outros", spectatorPrices: { urnm: "5.000", ext: "10.000" } },
  ],
  prelectoresPrice: "20.000",
};

async function seed() {
  const value = JSON.stringify(REGISTRATION_PRICING);
  await db
    .insert(csaSettingsTable)
    .values({ key: "registration_pricing", value })
    .onConflictDoUpdate({
      target: csaSettingsTable.key,
      set: { value, updatedAt: new Date() },
    });
  console.log("Taxas de inscrição gravadas em csa_settings (registration_pricing)");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
