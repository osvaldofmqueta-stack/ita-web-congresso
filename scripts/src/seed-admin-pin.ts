/**
 * Garante que o PIN de administração está definido na base (admin2026 por defeito).
 * Útil quando o login com "admin2026" falha — pode haver um valor vazio ou diferente em csa_settings.
 * Executar: pnpm --filter @workspace/scripts seed:admin-pin
 *
 * Requer .env na raiz do projeto com DATABASE_URL (copie .env.example para .env).
 */
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../../.env") });

const DEFAULT_ADMIN_PIN = "admin2026";

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error("Erro: DATABASE_URL não está definida.");
    console.error("Crie um ficheiro .env na raiz do projeto (copie .env.example) e defina DATABASE_URL com a conexão PostgreSQL.");
    process.exit(1);
  }

  const { db, csaSettingsTable } = await import("@workspace/db");

  await db
    .insert(csaSettingsTable)
    .values({ key: "admin_pin", value: DEFAULT_ADMIN_PIN })
    .onConflictDoUpdate({
      target: csaSettingsTable.key,
      set: { value: DEFAULT_ADMIN_PIN, updatedAt: new Date() },
    });
  console.log("PIN de administração definido em csa_settings (admin_pin) =", DEFAULT_ADMIN_PIN);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
