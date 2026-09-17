import { SectionLabel } from '@/components/section-label'

export function PageHeader({
  eyebrow,
  title,
  description,
  price,
  audience,
}: {
  eyebrow: string
  title: string
  description: string
  price: string
  audience: string
}) {
  return (
    <section className="relative overflow-hidden px-4 pb-14 pt-36 sm:pt-44">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_55%_55%_at_50%_0%,rgba(255,255,255,0.07),transparent)]" />
      <div className="mx-auto max-w-3xl text-center">
        <SectionLabel>{eyebrow}</SectionLabel>
        <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-pretty leading-relaxed text-muted-foreground">
          {description}
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <span className="rounded-full border border-border bg-secondary px-4 py-1.5 text-sm font-medium">
            {price}
          </span>
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {audience}
          </span>
        </div>
      </div>
    </section>
  )
}
