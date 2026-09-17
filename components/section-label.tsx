import { cn } from '@/lib/utils'

export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground',
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-chart-2" />
      {children}
    </div>
  )
}
