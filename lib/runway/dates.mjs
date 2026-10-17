export function toDay(value) {
  if (!value) return null
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  const s = String(value)
  const ms = s.match(/\/Date\((-?\d+)/)
  if (ms) return new Date(Number(ms[1])).toISOString().slice(0, 10)
  const iso = s.match(/^(\d{4}-\d{2}-\d{2})/)
  return iso ? iso[1] : null
}

export function addDays(day, n) {
  const d = new Date(day + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function addMonths(day, n) {
  const d = new Date(day + 'T00:00:00Z')
  const target = d.getUTCDate()
  d.setUTCDate(1)
  d.setUTCMonth(d.getUTCMonth() + n)
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
  d.setUTCDate(Math.min(target, last))
  return d.toISOString().slice(0, 10)
}

export function daysBetween(a, b) {
  return Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 86400000)
}

export function todayUtc() {
  return new Date().toISOString().slice(0, 10)
}
