"use client";

type Selector<T> = keyof T | ((item: T) => string | undefined | null);

export function createStringSearchFilter<T>(selectors: Selector<T>[]) {
  return (item: T, searchValue: string): boolean => {
    if (!searchValue) return true;
    const searchLower = searchValue.toLowerCase();

    return selectors.some((selector) => {
      const rawValue =
        typeof selector === "function"
          ? selector(item)
          : (item as Record<string, unknown>)[selector as string];
      if (typeof rawValue !== "string") return false;
      return rawValue.toLowerCase().includes(searchLower);
    });
  };
}
