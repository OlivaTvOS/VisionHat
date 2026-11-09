interface IconProps { className?: string }
type IconName = 'dashboard' | 'vision' | 'voice' | 'history' | 'device' | 'info' | 'menu' | 'moon' | 'alert'

export function Icon({ name, className = 'h-5 w-5' }: IconProps & { name: IconName }) {
  const common = { className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (name) {
    case 'dashboard': return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
    case 'vision': return <svg {...common}><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></svg>
    case 'voice': return <svg {...common}><rect x="8" y="3" width="8" height="12" rx="4" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" /></svg>
    case 'history': return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2M4 5v4h4" /></svg>
    case 'device': return <svg {...common}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 7h6M9 17h6" /></svg>
    case 'info': return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 10v6M12 7h.01" /></svg>
    case 'menu': return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
    case 'moon': return <svg {...common}><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" /></svg>
    case 'alert': return <svg {...common}><path d="m12 3 9 17H3L12 3Z" /><path d="M12 9v4M12 16h.01" /></svg>
  }
}
