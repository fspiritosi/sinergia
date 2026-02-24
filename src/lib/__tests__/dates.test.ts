import { describe, it, expect } from "vitest"
import {
  isValidDate,
  parseDateOnlyToLocalNoon,
  parseMonthOnlyToLocalNoon,
  parseCalendarStringToDate,
  toDateOnlyString,
  toMonthOnlyString,
  addMonths,
  formatDateOnly,
  formatDateTime,
} from "../dates"

describe("Date utility functions", () => {
  describe("isValidDate", () => {
    it("should return true for valid dates", () => {
      expect(isValidDate(new Date("2024-01-15"))).toBe(true)
      expect(isValidDate(new Date())).toBe(true)
      expect(isValidDate(new Date(2024, 0, 15))).toBe(true)
    })

    it("should return false for invalid dates", () => {
      expect(isValidDate(new Date("invalid"))).toBe(false)
      expect(isValidDate(new Date(NaN))).toBe(false)
    })
  })

  describe("parseDateOnlyToLocalNoon", () => {
    it("should parse YYYY-MM-DD format correctly", () => {
      const result = parseDateOnlyToLocalNoon("2024-01-15")
      expect(result.getFullYear()).toBe(2024)
      expect(result.getMonth()).toBe(0) // January
      expect(result.getDate()).toBe(15)
      expect(result.getHours()).toBe(12)
      expect(result.getMinutes()).toBe(0)
    })

    it("should handle different valid dates", () => {
      const result1 = parseDateOnlyToLocalNoon("2023-12-31")
      expect(result1.getFullYear()).toBe(2023)
      expect(result1.getMonth()).toBe(11) // December
      expect(result1.getDate()).toBe(31)

      const result2 = parseDateOnlyToLocalNoon("2024-02-29") // Leap year
      expect(result2.getFullYear()).toBe(2024)
      expect(result2.getMonth()).toBe(1) // February
      expect(result2.getDate()).toBe(29)
    })

    it("should throw error for invalid date strings", () => {
      expect(() => parseDateOnlyToLocalNoon("invalid")).toThrow("Fecha inválida")
    })

    it("should handle JavaScript date auto-correction", () => {
      // JavaScript auto-corrects invalid dates (e.g., month 13 → next year January)
      const result1 = parseDateOnlyToLocalNoon("2024-13-01")
      expect(result1.getFullYear()).toBe(2025)
      expect(result1.getMonth()).toBe(0) // JavaScript corrected to January

      // Feb 30 → March 1 or 2 depending on the year
      const result2 = parseDateOnlyToLocalNoon("2024-02-30")
      expect(result2.getFullYear()).toBe(2024)
      expect(result2.getMonth()).toBe(2) // March
    })

    it("should handle ISO date strings as fallback", () => {
      const result = parseDateOnlyToLocalNoon("2024-01-15T10:30:00Z")
      expect(isValidDate(result)).toBe(true)
    })
  })

  describe("parseMonthOnlyToLocalNoon", () => {
    it("should parse YYYY-MM format correctly", () => {
      const result = parseMonthOnlyToLocalNoon("2024-01")
      expect(result.getFullYear()).toBe(2024)
      expect(result.getMonth()).toBe(0) // January
      expect(result.getDate()).toBe(1)
      expect(result.getHours()).toBe(12)
    })

    it("should handle different months", () => {
      const result1 = parseMonthOnlyToLocalNoon("2024-12")
      expect(result1.getMonth()).toBe(11) // December

      const result2 = parseMonthOnlyToLocalNoon("2024-06")
      expect(result2.getMonth()).toBe(5) // June
    })

    it("should throw error for invalid month strings", () => {
      expect(() => parseMonthOnlyToLocalNoon("invalid")).toThrow("Mes inválido")
    })

    it("should handle JavaScript month auto-correction", () => {
      // JavaScript auto-corrects invalid months (e.g., month 13 → next year January)
      const result1 = parseMonthOnlyToLocalNoon("2024-13")
      expect(result1.getFullYear()).toBe(2025)
      expect(result1.getMonth()).toBe(0) // January

      // Month 0 → previous year December
      const result2 = parseMonthOnlyToLocalNoon("2024-00")
      expect(result2.getFullYear()).toBe(2023)
      expect(result2.getMonth()).toBe(11) // December
    })
  })

  describe("parseCalendarStringToDate", () => {
    it("should parse date-only strings", () => {
      const result = parseCalendarStringToDate("2024-01-15")
      expect(result.getFullYear()).toBe(2024)
      expect(result.getMonth()).toBe(0)
      expect(result.getDate()).toBe(15)
    })

    it("should parse month-only strings", () => {
      const result = parseCalendarStringToDate("2024-01")
      expect(result.getFullYear()).toBe(2024)
      expect(result.getMonth()).toBe(0)
      expect(result.getDate()).toBe(1)
    })

    it("should parse ISO datetime strings as fallback", () => {
      const result = parseCalendarStringToDate("2024-01-15T10:30:00Z")
      expect(isValidDate(result)).toBe(true)
    })

    it("should throw error for invalid strings", () => {
      expect(() => parseCalendarStringToDate("invalid")).toThrow("Fecha inválida")
    })
  })

  describe("toDateOnlyString", () => {
    it("should convert Date to YYYY-MM-DD format", () => {
      const date = new Date(Date.UTC(2024, 0, 15))
      expect(toDateOnlyString(date)).toBe("2024-01-15")
    })

    it("should handle different dates", () => {
      const date1 = new Date(Date.UTC(2023, 11, 31))
      expect(toDateOnlyString(date1)).toBe("2023-12-31")

      const date2 = new Date(Date.UTC(2024, 1, 29)) // Leap year
      expect(toDateOnlyString(date2)).toBe("2024-02-29")
    })

    it("should pad single-digit months and days with zeros", () => {
      const date = new Date(Date.UTC(2024, 0, 5))
      expect(toDateOnlyString(date)).toBe("2024-01-05")
    })
  })

  describe("toMonthOnlyString", () => {
    it("should convert Date to YYYY-MM format", () => {
      const date = new Date(Date.UTC(2024, 0, 15))
      expect(toMonthOnlyString(date)).toBe("2024-01")
    })

    it("should handle different months", () => {
      const date1 = new Date(Date.UTC(2024, 11, 31))
      expect(toMonthOnlyString(date1)).toBe("2024-12")

      const date2 = new Date(Date.UTC(2024, 5, 15))
      expect(toMonthOnlyString(date2)).toBe("2024-06")
    })
  })

  describe("addMonths", () => {
    it("should add positive months", () => {
      const date = new Date(Date.UTC(2024, 0, 15))
      const result = addMonths(date, 3)
      expect(result.getUTCFullYear()).toBe(2024)
      expect(result.getUTCMonth()).toBe(3) // April
      expect(result.getUTCDate()).toBe(15)
    })

    it("should subtract months with negative values", () => {
      const date = new Date(Date.UTC(2024, 3, 15))
      const result = addMonths(date, -2)
      expect(result.getUTCFullYear()).toBe(2024)
      expect(result.getUTCMonth()).toBe(1) // February
    })

    it("should handle year boundaries", () => {
      const date = new Date(Date.UTC(2024, 11, 15)) // December
      const result = addMonths(date, 2)
      expect(result.getUTCFullYear()).toBe(2025)
      expect(result.getUTCMonth()).toBe(1) // February
    })

    it("should not mutate original date", () => {
      const date = new Date(Date.UTC(2024, 0, 15))
      const originalTime = date.getTime()
      addMonths(date, 3)
      expect(date.getTime()).toBe(originalTime)
    })
  })

  describe("formatDateOnly", () => {
    it("should format Date objects", () => {
      const date = new Date(2024, 0, 15, 12, 0, 0)
      const result = formatDateOnly(date, "es-AR")
      expect(result).toBeTruthy()
      expect(result).not.toBe("-")
    })

    it("should format date strings", () => {
      const result = formatDateOnly("2024-01-15", "es-AR")
      expect(result).toBeTruthy()
      expect(result).not.toBe("-")
    })

    it("should throw error for invalid Date objects", () => {
      const invalidDate = new Date("invalid")
      // formatDateOnly calls parseDateOnlyToLocalNoon which throws for invalid dates
      expect(() => formatDateOnly(invalidDate, "es-AR")).toThrow("Fecha inválida")
    })

    it("should use default locale es-AR", () => {
      const date = new Date(2024, 0, 15, 12, 0, 0)
      const result = formatDateOnly(date)
      expect(result).toBeTruthy()
    })
  })

  describe("formatDateTime", () => {
    it("should format Date objects with time", () => {
      const date = new Date(2024, 0, 15, 14, 30, 0)
      const result = formatDateTime(date, "es-AR")
      expect(result).toBeTruthy()
      expect(result).not.toBe("-")
    })

    it("should format ISO date strings", () => {
      const result = formatDateTime("2024-01-15T14:30:00Z", "es-AR")
      expect(result).toBeTruthy()
      expect(result).not.toBe("-")
    })

    it("should return '-' for invalid dates", () => {
      const result = formatDateTime("invalid", "es-AR")
      expect(result).toBe("-")
    })

    it("should use default locale es-AR", () => {
      const date = new Date(2024, 0, 15, 14, 30, 0)
      const result = formatDateTime(date)
      expect(result).toBeTruthy()
    })
  })
})
