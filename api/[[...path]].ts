/**
 * Handler /api/* no Vercel.
 *
 * Para este projeto (site estático do congresso) não há API ativa,
 * então esta função apenas responde 404 para qualquer chamada.
 *
 * Isso evita que o Vercel tente compilar o servidor Express completo
 * (artifacts/api-server), que não é necessário para o deploy do site.
 */

export default async function handler(
  req: import("http").IncomingMessage & { url?: string },
  res: import("http").ServerResponse,
): Promise<void> {
  res.statusCode = 404;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(
    JSON.stringify({
      error: "API desativada neste deploy. O site funciona apenas com conteúdo estático.",
      path: req.url ?? "",
    }),
  );
}
