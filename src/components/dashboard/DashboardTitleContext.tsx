"use client"

import { createContext, useContext, useMemo, useState } from "react"

type DashboardTitleContextValue = {
  title: string | null
  setTitle: (title: string | null) => void
}

const DashboardTitleContext = createContext<DashboardTitleContextValue | null>(null)

export function DashboardTitleProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitle] = useState<string | null>(null)

  const value = useMemo(() => ({ title, setTitle }), [title])

  return <DashboardTitleContext.Provider value={value}>{children}</DashboardTitleContext.Provider>
}

export function useDashboardTitle() {
  const ctx = useContext(DashboardTitleContext)
  if (!ctx) {
    throw new Error("useDashboardTitle must be used within DashboardTitleProvider")
  }
  return ctx
}
