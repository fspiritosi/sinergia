import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Theme mode type
 */
export type Theme = "light" | "dark" | "system";

/**
 * Table density type
 */
export type TableDensity = "compact" | "comfortable" | "spacious";

/**
 * Page size options for tables
 */
export type PageSize = 10 | 25 | 50 | 100;

/**
 * User preferences state interface
 */
interface UserPreferencesState {
  // Theme preference
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Table density preference
  tableDensity: TableDensity;
  setTableDensity: (density: TableDensity) => void;

  // Sidebar collapsed state
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // Default page size for tables
  defaultPageSize: PageSize;
  setDefaultPageSize: (size: PageSize) => void;

  // Reset all preferences to defaults
  resetPreferences: () => void;
}

/**
 * Default preferences
 */
const DEFAULT_PREFERENCES = {
  theme: "system" as Theme,
  tableDensity: "comfortable" as TableDensity,
  sidebarCollapsed: false,
  defaultPageSize: 10 as PageSize,
};

/**
 * User preferences store with localStorage persistence
 *
 * @example
 * ```tsx
 * import { useUserPreferencesStore } from "@/stores/user-preferences.store"
 *
 * function Component() {
 *   const { theme, setTheme } = useUserPreferencesStore()
 *
 *   return (
 *     <button onClick={() => setTheme("dark")}>
 *       Current theme: {theme}
 *     </button>
 *   )
 * }
 * ```
 */
export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set) => ({
      // Initial state
      ...DEFAULT_PREFERENCES,

      // Theme actions
      setTheme: (theme) => set({ theme }),

      // Table density actions
      setTableDensity: (tableDensity) => set({ tableDensity }),

      // Sidebar actions
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // Page size actions
      setDefaultPageSize: (defaultPageSize) => set({ defaultPageSize }),

      // Reset action
      resetPreferences: () => set(DEFAULT_PREFERENCES),
    }),
    {
      name: "user-preferences", // localStorage key
      storage: createJSONStorage(() => localStorage),
      // Only persist these fields
      partialize: (state) => ({
        theme: state.theme,
        tableDensity: state.tableDensity,
        sidebarCollapsed: state.sidebarCollapsed,
        defaultPageSize: state.defaultPageSize,
      }),
    }
  )
);

/**
 * Get table density CSS classes
 */
export function getTableDensityClasses(density: TableDensity): string {
  switch (density) {
    case "compact":
      return "py-1 text-sm";
    case "comfortable":
      return "py-2";
    case "spacious":
      return "py-3";
    default:
      return "py-2";
  }
}

/**
 * Apply theme to document
 * Call this in a useEffect to apply theme changes
 */
export function applyTheme(theme: Theme) {
  const root = window.document.documentElement;

  // Remove existing theme classes
  root.classList.remove("light", "dark");

  if (theme === "system") {
    // Use system preference
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    root.classList.add(systemTheme);
  } else {
    root.classList.add(theme);
  }
}
