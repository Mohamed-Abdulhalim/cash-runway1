export default function RiskItems({ items }) {
  if (!items?.length) return null

  const overdueItems = items.filter(i => i.type === 'overdue_invoice')
  const shortfallItems = items.filter(i => i.type === 'shortfall')

  return (
    <div className="bg-white rounded-2xl border border-[#E8E6E0] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#F0EEE8]">
        <p className="text-sm font-medium text-[#1A1A1A]">What's causing the risk</p>
      </div>
      <div className="divide-y divide-[#F0EEE8]">
        {overdueItems.map((item, i) => (
          <div key={i} className="px-5 py-4 flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-[#EA580C] mt-1.5 shrink-0" />
            <div>
              <p className="text-sm text-[#1A1A1A]">{item.message}</p>
              <p className="text-xs text-[#6B6B6B] mt-0.5">Overdue — collect this now</p>
            </div>
          </div>
        ))}
        {shortfallItems.map((item, i) => (
          <div key={i} className="px-5 py-4 flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-[#DC2626] mt-1.5 shrink-0" />
            <div>
              <p className="text-sm text-[#1A1A1A]">{item.message}</p>
              {item.date && <p className="text-xs text-[#6B6B6B] mt-0.5">Due {item.date}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}