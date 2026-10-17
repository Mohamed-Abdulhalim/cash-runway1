import { money, shortDate } from '../lib/format'

export default function BalanceChart({ series, buffer, currency, low }) {
  if (!series?.length) return null
  const W = 640
  const H = 200
  const pad = { l: 8, r: 8, t: 12, b: 22 }
  const values = series.map(p => p.balance)
  const max = Math.max(...values, buffer || 0, 0)
  const min = Math.min(...values, 0)
  const span = max - min || 1
  const x = i => pad.l + (i / (series.length - 1)) * (W - pad.l - pad.r)
  const y = v => pad.t + (1 - (v - min) / span) * (H - pad.t - pad.b)
  const path = series.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.balance).toFixed(1)}`).join(' ')
  const area = `${path} L${x(series.length - 1).toFixed(1)},${y(min).toFixed(1)} L${x(0).toFixed(1)},${y(min).toFixed(1)} Z`
  const lowIndex = series.findIndex(p => p.date === low?.date)
  const ticks = [0, 14, 29, 44, series.length - 1].filter(i => i < series.length)
  const negative = min < 0

  return (
    <figure className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`Projected bank balance over ${series.length} days`}>
        <defs>
          <linearGradient id="bal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1A1A1A" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#1A1A1A" stopOpacity="0" />
          </linearGradient>
        </defs>
        {negative && <rect x={pad.l} y={y(0)} width={W - pad.l - pad.r} height={y(min) - y(0)} fill="#FEE2E2" opacity="0.6" />}
        <line x1={pad.l} x2={W - pad.r} y1={y(0)} y2={y(0)} stroke="#DC2626" strokeWidth="1" strokeDasharray="3 3" opacity={negative ? 0.8 : 0.35} />
        {buffer > 0 && buffer < max && (
          <line x1={pad.l} x2={W - pad.r} y1={y(buffer)} y2={y(buffer)} stroke="#D97706" strokeWidth="1" strokeDasharray="2 4" opacity="0.7" />
        )}
        <path d={area} fill="url(#bal)" />
        <path d={path} fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinejoin="round" />
        {lowIndex >= 0 && (
          <circle cx={x(lowIndex)} cy={y(series[lowIndex].balance)} r="4.5" fill={series[lowIndex].balance < 0 ? '#DC2626' : '#D97706'} stroke="white" strokeWidth="2" />
        )}
        {ticks.map(i => (
          <text key={i} x={x(i)} y={H - 6} fontSize="12" fill="#9A9A9A" textAnchor={i === 0 ? 'start' : i === series.length - 1 ? 'end' : 'middle'}>
            {i === 0 ? 'Today' : shortDate(series[i].date)}
          </text>
        ))}
      </svg>
      <figcaption className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#6B6B6B] mt-2">
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#1A1A1A]" />Projected balance</span>
        {buffer > 0 && <span className="inline-flex items-center gap-1.5"><span className="w-3 border-t border-dashed border-[#D97706]" />2-week buffer ({money(buffer, currency)})</span>}
        <span className="inline-flex items-center gap-1.5"><span className="w-3 border-t border-dashed border-[#DC2626]" />Zero</span>
      </figcaption>
    </figure>
  )
}
