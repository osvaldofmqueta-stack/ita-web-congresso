/**
 * Vercel Serverless: encaminha todos os pedidos /api/* para a app Express (api-server).
 * Carrega .env antes de importar o db para DATABASE_URL estar definida.
 *
 * No Vercel: defina a variável de ambiente DATABASE_URL no projeto
 * (Settings → Environment Variables) com a conexão PostgreSQL (ex.: Neon, Supabase).
 * Para o login admin funcionar, execute o seed do PIN na mesma base:
 *   pnpm --filter @workspace/scripts seed:admin-pin
 */
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../.env") });

let appPromise: Promise<typeof import("../artifacts/api-server/src/app").default> | null = null;

function getApp() {
  if (!appPromise) {
    appPromise = import("../artifacts/api-server/src/app").then((m) => m.default);
  }
  return appPromise;
}

export default async function handler(
  req: import("http").IncomingMessage & { url?: string },
  res: import("http").ServerResponse
): Promise<void> {
  const app = await getApp();
  return new Promise((resolve, reject) => {
    app(req, res, (err?: Error) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
