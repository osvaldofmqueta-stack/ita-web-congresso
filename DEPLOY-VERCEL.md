# Deploy na Vercel

O projeto está preparado para hospedar o **site estático** na Vercel (sem API).

## O que já está configurado

- **`vercel.json`** na raiz com:
  - `buildCommand`: instala dependências e faz o build do `csa-2026`
  - `outputDirectory`: `artifacts/csa-2026/dist/public` (saída do Vite)
  - `installCommand`: `pnpm install`
  - `rewrites`: SPA — rotas não encontradas como ficheiro vão para `index.html`
  - `env.BASE_PATH`: `/` (raiz do domínio)

## Como fazer o deploy

1. Conecte o repositório à [Vercel](https://vercel.com).
2. **Root Directory**: deixe em branco (raiz do repo).
3. **Framework Preset**: None (o build é customizado no `vercel.json`).
4. **Build & Output**: já vêm do `vercel.json`; não é preciso preencher.
5. Clique em **Deploy**.

A Vercel usa `pnpm-lock.yaml` e executa `pnpm install` e o `buildCommand` definido.

## Variáveis de ambiente (opcional)

| Variável    | Uso |
|-------------|-----|
| `BASE_PATH` | Subpath do site (ex.: `/congresso`). Padrão: `/`. |

Para definir: no projeto na Vercel → **Settings** → **Environment Variables**.
