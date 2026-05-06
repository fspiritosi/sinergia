"use client";

import { type ReactNode } from "react";
import { usePermissions } from "./use-permissions";

type Props = {
  permission?: string;
  anyOf?: string[];
  allOf?: string[];
  role?: string;
  fallback?: ReactNode;
  children: ReactNode;
};

export function Can({ permission, anyOf, allOf, role, fallback = null, children }: Props) {
  const { can, canAny, canAll, isRole } = usePermissions();

  if (role && !isRole(role)) return <>{fallback}</>;
  if (permission && !can(permission)) return <>{fallback}</>;
  if (anyOf && !canAny(anyOf)) return <>{fallback}</>;
  if (allOf && !canAll(allOf)) return <>{fallback}</>;

  return <>{children}</>;
}
