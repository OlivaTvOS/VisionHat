import type { ReactNode } from 'react'

export default function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-slate-700/80 bg-[#1b2638] p-6 ${className}`}>{children}</section>
}
