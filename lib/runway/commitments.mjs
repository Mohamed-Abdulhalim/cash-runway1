import { FREQUENCIES } from './engine.mjs'
import { toDay } from './dates.mjs'

export const MAX_COMMITMENTS = 20

export function cleanCommitments(input) {
  if (!Array.isArray(input)) throw new Error('commitments must be a list')
  if (input.length > MAX_COMMITMENTS) throw new Error(`at most ${MAX_COMMITMENTS} commitments`)
  return input.map((c, i) => {
    const label = String(c?.label ?? '').trim().slice(0, 60)
    const amount = Math.round(Number(c?.amount) * 100) / 100
    const frequency = String(c?.frequency ?? '')
    const next_date = toDay(c?.next_date)
    if (!label) throw new Error(`commitment ${i + 1}: name is required`)
    if (!(amount > 0 && amount < 1e9)) throw new Error(`commitment ${i + 1}: amount must be positive`)
    if (!FREQUENCIES[frequency]) throw new Error(`commitment ${i + 1}: unknown frequency`)
    if (!next_date) throw new Error(`commitment ${i + 1}: next date is required`)
    return { id: String(c?.id || `c${Date.now()}${i}`).slice(0, 40), label, amount, frequency, next_date }
  })
}
