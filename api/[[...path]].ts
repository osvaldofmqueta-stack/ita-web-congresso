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

config({ path: path.resolve(process.cwd(), ".env") });

type ExpressApp = (req: import("http").IncomingMessage, res: import("http").ServerResponse, next?: (err?: Error) => void) => void;

let appPromise: Promise<ExpressApp> | null = null;

function getApp(): Promise<ExpressApp> {
  if (!appPromise) {
    appPromise = import("../artifacts/api-server/src/app.js").then((m) => m.default as ExpressApp);
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
