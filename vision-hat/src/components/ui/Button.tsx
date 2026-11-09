import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: ButtonVariant; children: ReactNode }

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-950/30',
  secondary: 'border border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700',
  danger: 'bg-red-500 text-white hover:bg-red-400',
  ghost: 'text-slate-300 hover:bg-slate-700/70 hover:text-white',
}

export default function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  return <button className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`} {...props}>{children}</button>
}
