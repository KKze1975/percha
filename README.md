# Percha

Clon funcional de Alta como ejercicio de clonación técnica (Next.js/Vercel, stack alineado a Flujo). Ver `PRD.md` para la especificación completa y `GOAL-PROMPT.md` para la metodología de construcción por fases.

## Stack

- Next.js (App Router) + TypeScript, desplegado en Vercel
- DynamoDB (`ClosetItems`) para el inventario del clóset
- Google Drive (delegado vía OAuth a una cuenta real — las cuentas de servicio no tienen cuota de almacenamiento en Drive personal) para las fotos
- API de Claude (Anthropic) para categorización y generación de outfits

## Desarrollo local

```bash
npm install
npm run dev
```

Copia `.env.local.example` a `.env.local` y completa las variables. Las credenciales de Drive (`DRIVE_OAUTH_*` y `DRIVE_FOLDER_ID`) se obtienen corriendo una vez:

```bash
node scripts/drive-oauth-setup.mjs
```

## Tests

```bash
npm run typecheck   # tsc --noEmit
npm test            # vitest run
```

Los tests de integración (`tests/*.integration.test.ts`, `tests/persistence.dynamodb.test.ts`, `tests/outfit.statistical.test.ts`) corren contra DynamoDB, Drive y Claude reales — no hay mocks permanentes. Se saltan automáticamente si falta alguna variable de entorno requerida.

## Deploy

```bash
vercel deploy         # preview
vercel deploy --prod  # producción
```

El repo está conectado al proyecto de Vercel: los pushes a `master` y los PRs disparan deploys automáticamente.
