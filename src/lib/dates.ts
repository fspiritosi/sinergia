export function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime())
}

export function parseDateOnlyToLocalNoon(value: string): Date {
  const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(value)
  if (!match) {
    const d = new Date(value)
    if (!isValidDate(d)) throw new Error("Fecha inválida")
    return d
  }

  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  const day = Number(match[3])

  const d = new Date(year, monthIndex, day, 12, 0, 0, 0)
  if (!isValidDate(d)) throw new Error("Fecha inválida")
  return d
}

export function parseMonthOnlyToLocalNoon(value: string): Date {
  const match = /^([0-9]{4})-([0-9]{2})$/.exec(value)
  if (!match) {
    const d = new Date(value)
    if (!isValidDate(d)) throw new Error("Mes inválido")
    return d
  }

  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1

  const d = new Date(year, monthIndex, 1, 12, 0, 0, 0)
  if (!isValidDate(d)) throw new Error("Mes inválido")
  return d
}

export function parseCalendarStringToDate(value: string): Date {
  if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value)) return parseDateOnlyToLocalNoon(value)
  if (/^[0-9]{4}-[0-9]{2}$/.test(value)) return parseMonthOnlyToLocalNoon(value)
  const d = new Date(value)
  if (!isValidDate(d)) throw new Error("Fecha inválida")
  return d
}

export function toDateOnlyString(value: Date): string {
  const yyyy = String(value.getUTCFullYear())
  const mm = String(value.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(value.getUTCDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

export function toMonthOnlyString(value: Date): string {
  const yyyy = String(value.getUTCFullYear())
  const mm = String(value.getUTCMonth() + 1).padStart(2, "0")
  return `${yyyy}-${mm}`
}

export function formatDateOnly(value: Date | string, locale = "es-AR"): string {
  const date = value instanceof Date ? parseDateOnlyToLocalNoon(toDateOnlyString(value)) : parseCalendarStringToDate(value)
  if (!isValidDate(date)) return "-"
  return date.toLocaleDateString(locale)
}

export function formatDateTime(value: Date | string, locale = "es-AR"): string {
  const date = value instanceof Date ? value : new Date(value)
  if (!isValidDate(date)) return "-"
  return date.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })
}
