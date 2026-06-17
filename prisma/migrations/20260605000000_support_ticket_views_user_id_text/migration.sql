-- El módulo de Ayuda (taskapp-cli) crea support_ticket_views.user_id como UUID,
-- pensado para auth con IDs UUID (better-auth/supabase). Sinergia usa Clerk, cuyos
-- IDs de usuario son strings tipo "user_xxx" (no UUID). Cambiamos la columna a TEXT
-- para almacenar el ID de Clerk sin error P2023.

ALTER TABLE "support_ticket_views"
  ALTER COLUMN "user_id" TYPE TEXT;
