import { describe, it, expect } from "vitest"
import { cn } from "../utils"

describe("cn utility function", () => {
  it("should merge class names", () => {
    const result = cn("text-red-500", "bg-blue-500")
    expect(result).toBe("text-red-500 bg-blue-500")
  })

  it("should handle conditional classes", () => {
    const result = cn("base-class", false && "hidden", "visible")
    expect(result).toBe("base-class visible")
  })

  it("should merge Tailwind classes correctly", () => {
    // twMerge should deduplicate conflicting classes
    const result = cn("px-2", "px-4")
    expect(result).toBe("px-4")
  })

  it("should handle empty input", () => {
    const result = cn()
    expect(result).toBe("")
  })

  it("should handle undefined and null values", () => {
    const result = cn("text-sm", undefined, null, "font-bold")
    expect(result).toBe("text-sm font-bold")
  })
})
