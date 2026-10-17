export function money(value, currency) {
  const n = Number(value) || 0
  if (currency) {
    try {
      return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(n)
    } catch {}
  }
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(n)
}

export function shortDate(day) {
  if (!day) return ''
  return new Date(day + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

export function longDate(day) {
  if (!day) return ''
  return new Date(day + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
}
