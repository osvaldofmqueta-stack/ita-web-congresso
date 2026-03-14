/**
 * Vercel Serverless: encaminha todos os pedidos /api/* para a app Express (api-server).
 * No Vercel: a DATABASE_URL deve ser definida nas variáveis de ambiente
 * do projeto (Settings → Environment Variables) com a conexão PostgreSQL
 * (ex.: Neon, Supabase). Esta rota não lê ficheiro .env em produção.
 */

type ExpressApp = (req: import("http").IncomingMessage, res: import("http").ServerResponse, next?: (err?: Error) => void) => void;

let appPromise: Promise<ExpressApp> | null = null;

function getApp(): Promise<ExpressApp> {
  if (!appPromise) {
    appPromise = import("../artifacts/api-server/src/app.js").then(
      (m) => m.default as ExpressApp,
    );
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
