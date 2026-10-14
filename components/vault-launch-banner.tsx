type VaultLaunchBannerProps = {
  name: string
  date: string
  description: string
}

export function VaultLaunchBanner({
  name,
  date,
  description,
}: VaultLaunchBannerProps) {
  return (
    <section className="relative mx-auto my-8 max-w-6xl overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-background to-background px-6 py-12 text-center shadow-xl sm:px-12 sm:py-16">
      <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative z-10">
        <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Coming Soon
        </span>

        <h2 className="mt-7 text-balance text-3xl font-bold tracking-tight sm:text-5xl">
          {name}
        </h2>

        <p className="mt-4 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Official Launch Date
        </p>

        <p className="mt-3 text-3xl font-bold text-primary sm:text-4xl">
          {date}
        </p>

        <p className="mx-auto mt-6 max-w-xl text-pretty leading-relaxed text-muted-foreground">
          {description}
        </p>

        <p className="mt-8 text-sm font-medium">
          The next chapter of VidIn is on its way.
        </p>
      </div>
    </section>
  )
}
