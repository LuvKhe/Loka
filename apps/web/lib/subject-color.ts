export interface SubjectColor {
  bar: string
  chip: string
  tint: string
  hero: string
  text: string
}

const PALETTE: SubjectColor[] = [
  { bar: 'bg-blue-500', chip: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200', tint: 'bg-blue-50 dark:bg-blue-900/25', hero: 'from-blue-700 to-blue-900', text: 'text-blue-800 dark:text-blue-200' },
  { bar: 'bg-emerald-500', chip: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-200', tint: 'bg-emerald-50 dark:bg-emerald-900/25', hero: 'from-emerald-700 to-emerald-900', text: 'text-emerald-900 dark:text-emerald-200' },
  { bar: 'bg-violet-500', chip: 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200', tint: 'bg-violet-50 dark:bg-violet-900/25', hero: 'from-violet-700 to-violet-900', text: 'text-violet-800 dark:text-violet-200' },
  { bar: 'bg-amber-500', chip: 'bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200', tint: 'bg-amber-50 dark:bg-amber-900/25', hero: 'from-amber-700 to-amber-900', text: 'text-amber-900 dark:text-amber-200' },
  { bar: 'bg-rose-500', chip: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200', tint: 'bg-rose-50 dark:bg-rose-900/25', hero: 'from-rose-700 to-rose-900', text: 'text-rose-800 dark:text-rose-200' },
  { bar: 'bg-cyan-500', chip: 'bg-cyan-100 text-cyan-900 dark:bg-cyan-900/50 dark:text-cyan-200', tint: 'bg-cyan-50 dark:bg-cyan-900/25', hero: 'from-cyan-700 to-cyan-900', text: 'text-cyan-900 dark:text-cyan-200' },
  { bar: 'bg-orange-500', chip: 'bg-orange-100 text-orange-900 dark:bg-orange-900/50 dark:text-orange-200', tint: 'bg-orange-50 dark:bg-orange-900/25', hero: 'from-orange-700 to-orange-900', text: 'text-orange-900 dark:text-orange-200' },
  { bar: 'bg-fuchsia-500', chip: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/50 dark:text-fuchsia-200', tint: 'bg-fuchsia-50 dark:bg-fuchsia-900/25', hero: 'from-fuchsia-700 to-fuchsia-900', text: 'text-fuchsia-800 dark:text-fuchsia-200' },
]

export function subjectColor(code: string): SubjectColor {
  let h = 0
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]!
}
