import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string }

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className = '', ...props }, ref) => <label className="flex flex-col gap-2 text-sm font-medium text-slate-300">{label && <span>{label}</span>}<input ref={ref} className={`rounded-xl border bg-slate-900/60 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${error ? 'border-red-400' : 'border-slate-700'} ${className}`} {...props} />{error && <span className="text-xs text-red-300">{error}</span>}</label>)

Input.displayName = 'Input'
export default Input
