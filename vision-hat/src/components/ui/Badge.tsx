import type { ReactNode } from 'react'

type BadgeVariant = 'success' | 'warning' | 'neutral' | 'danger'
const variants: Record<BadgeVariant, string> = { success: 'bg-emerald-400/15 text-emerald-300', warning: 'bg-amber-400/15 text-amber-300', neutral: 'bg-slate-400/15 text-slate-300', danger: 'bg-red-400/15 text-red-300' }

export default function Badge({ children, variant = 'neutral' }: { children: ReactNode; variant?: BadgeVariant }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${variants[variant]}`}>{children}</span>
}
