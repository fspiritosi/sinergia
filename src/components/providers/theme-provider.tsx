"use client";

import { useEffect } from "react";
import { useUserPreferencesStore, applyTheme } from "@/stores/user-preferences.store";

/**
 * Theme Provider Component
 *
 * Automatically applies the user's theme preference to the document.
 * Should be mounted in the root layout to ensure theme is applied on all pages.
 *
 * @example
 * ```tsx
 * // app/layout.tsx
 * import { ThemeProvider } from "@/components/providers/theme-provider"
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <ThemeProvider />
 *         {children}
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 */
export function ThemeProvider() {
  const theme = useUserPreferencesStore((state) => state.theme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for system theme changes when theme is "system"
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      applyTheme(theme);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  return null;
}
