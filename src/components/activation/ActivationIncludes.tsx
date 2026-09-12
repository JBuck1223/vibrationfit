import { ACTIVATION_ASSET_GROUPS } from '@/lib/activation/assets'

export function ActivationIncludes({
  stacked = false,
}: {
  stacked?: boolean
} = {}) {
  return (
    <div className={stacked ? 'grid gap-4' : 'grid gap-4 md:grid-cols-2'}>
      {ACTIVATION_ASSET_GROUPS.map((group) => (
        <div
          key={group.heading}
          className="h-full rounded-2xl border bg-[#0A0A0A] p-5 md:p-6"
          style={{
            borderColor: `${group.color}40`,
            boxShadow: `0 0 32px ${group.color}14`,
          }}
        >
          <p
            className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: group.color }}
          >
            {group.heading}
          </p>
          <div className="space-y-4">
            {group.items.map(({ icon: Icon, title, detail }) => (
              <div key={title} className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${group.color}1A`, color: group.color }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold leading-tight text-white">{title}</span>
                  <span className="mt-0.5 block text-sm leading-snug text-neutral-400">
                    {detail}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
