export default function Verdict({ verdict, cash_at_end, has_projected }) {
  const isFine = verdict === 'fine'

  return (
    <div className={`rounded-2xl p-8 ${isFine ? 'bg-[#F0FAF4] border border-[#BBF7D0]' : 'bg-[#FFF5F5] border border-[#FECACA]'}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full mb-4 ${isFine ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FEE2E2] text-[#DC2626]'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isFine ? 'bg-[#16A34A]' : 'bg-[#DC2626]'}`} />
            {isFine ? 'On track' : 'Attention needed'}
          </div>
          <h2 className={`text-3xl font-semibold tracking-tight ${isFine ? 'text-[#15803D]' : 'text-[#B91C1C]'}`}>
            {isFine ? "You're Fine" : "You're At Risk"}
          </h2>
          <p className={`mt-1 text-sm ${isFine ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
            {isFine
              ? `Projected cash in 60 days: $${cash_at_end.toFixed(2)}`
              : `Projected shortfall in 60 days: $${Math.abs(cash_at_end).toFixed(2)}`
            }
          </p>
        </div>
        <div className={`text-4xl ${isFine ? '' : ''}`}>
          {isFine ? '✓' : '⚠'}
        </div>
      </div>

      {has_projected && (
        <p className="text-xs text-[#6B6B6B] mt-4 pt-4 border-t border-black/5">
          Includes conservative income forecast based on your last 90 days of transactions
        </p>
      )}
    </div>
  )
}