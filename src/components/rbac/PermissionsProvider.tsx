"use client";

import { createContext, type ReactNode } from "react";

export type PermissionsContextValue = {
  role: string | null;
  codes: ReadonlySet<string>;
};

export const PermissionsContext = createContext<PermissionsContextValue>({
  role: null,
  codes: new Set(),
});

type Props = {
  role: string | null;
  codes: string[];
  children: ReactNode;
};

export function PermissionsProvider({ role, codes, children }: Props) {
  const value: PermissionsContextValue = {
    role,
    codes: new Set(codes),
  };

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}
