# ITA Web Congresso – rodar localmente

O site é estático (dados no código), sem API.

## Ver o site

1. **Instalar dependências** (se ainda não fez):
   ```bash
   pnpm install
   ```

2. **Subir o site**:
   ```bash
   pnpm dev
   ```

3. **Abrir no navegador**: [http://localhost:3000](http://localhost:3000)

## Editar dados do congresso

- **Datas e local**: em `artifacts/csa-2026/src/lib/api.ts` — constantes `DEFAULT_SETTINGS` e `getSettings()`.
- **Links de download / redes**: no mesmo ficheiro, array `STATIC_LINKS` e `getLinks()`.

## O que foi ajustado no projeto

- **`package.json`**: `preinstall` em Node para funcionar no Windows.
- **`pnpm-workspace.yaml`**: binários Windows permitidos; apenas os artefactos `csa-2026` e `mockup-sandbox` no workspace.
- **Script `dev`** na raiz: `pnpm dev` sobe o site CSA 2026.
