import {
  Building2,
  Calendar,
  ClipboardCheck,
  ClipboardList,
  FileSignature,
  FileText,
  LayoutDashboard,
  MoreHorizontal,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export type CategorySlug =
  | "dashboard"
  | "clientes"
  | "propuestas"
  | "planificacion"
  | "planes"
  | "informes"
  | "inspecciones"
  | "configuracion"
  | "usuarios"
  | "otro";

export interface CategoryDef {
  slug: CategorySlug;
  label: string;
  icon: LucideIcon;
}

// Categorías mapeadas a los módulos reales de sinergia (ver app-sidebar):
// Gestión (Clientes, Propuestas), Planificación (Calendario, Planes de
// Trabajo, Informes, Inspecciones) y Configuración (Servicios, Items, Tipos,
// Condiciones, Usuarios y Roles).
export const CATEGORIES: CategoryDef[] = [
  { slug: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { slug: "clientes", label: "Clientes", icon: Building2 },
  { slug: "propuestas", label: "Propuestas", icon: FileSignature },
  { slug: "planificacion", label: "Planificación", icon: Calendar },
  { slug: "planes", label: "Planes de Trabajo", icon: ClipboardList },
  { slug: "informes", label: "Informes", icon: FileText },
  { slug: "inspecciones", label: "Inspecciones", icon: ClipboardCheck },
  { slug: "configuracion", label: "Configuración", icon: Settings },
  { slug: "usuarios", label: "Usuarios y permisos", icon: Users },
  { slug: "otro", label: "Otro", icon: MoreHorizontal },
];

export const CATEGORY_BY_SLUG: Record<CategorySlug, CategoryDef> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c])
) as Record<CategorySlug, CategoryDef>;

const CATEGORY_BY_LABEL: Record<string, CategoryDef> = Object.fromEntries(
  CATEGORIES.map((c) => [c.label, c])
);

const CATEGORY_PREFIX_RE = /^\[([^\]]+)\]\s*(.*)$/;

export function parseCategoryFromTitle(title: string): {
  categoryLabel: string | null;
  categoryDef: CategoryDef | null;
  cleanTitle: string;
} {
  const match = title.match(CATEGORY_PREFIX_RE);
  if (!match) return { categoryLabel: null, categoryDef: null, cleanTitle: title };
  const label = match[1];
  return {
    categoryLabel: label,
    categoryDef: CATEGORY_BY_LABEL[label] ?? null,
    cleanTitle: match[2] || title,
  };
}

export function buildTitleWithCategory(category: CategorySlug, rawTitle: string): string {
  const label = CATEGORY_BY_SLUG[category]?.label ?? "Otro";
  return `[${label}] ${rawTitle.trim()}`;
}
