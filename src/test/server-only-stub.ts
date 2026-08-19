/**
 * Stub de `server-only` para Vitest.
 *
 * El paquete real lanza "This module cannot be imported from a Client Component"
 * cuando se importa fuera del runtime de servidor de Next. Como los tests corren
 * en jsdom, cualquier módulo marcado con `import "server-only"` (auth.ts,
 * mailer.ts, rbac/require.ts…) sería intesteable.
 *
 * Se aliasea en vitest.config.ts. No afecta al build de Next, que sigue usando
 * el paquete real y conserva la garantía de no filtrar código server al cliente.
 */
export {};
