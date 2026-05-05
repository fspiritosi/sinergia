"use client";

import { useContext, useMemo } from "react";
import { PermissionsContext } from "./PermissionsProvider";

export function usePermissions() {
  const { role, codes } = useContext(PermissionsContext);

  return useMemo(
    () => ({
      role,
      permissions: [...codes],
      can: (code: string) => codes.has(code),
      canAny: (list: string[]) => list.some((c) => codes.has(c)),
      canAll: (list: string[]) => list.every((c) => codes.has(c)),
      isRole: (name: string) => role === name,
    }),
    [role, codes]
  );
}
