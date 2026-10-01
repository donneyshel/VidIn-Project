'use client'

import { usePathname } from 'next/navigation'
import { SiteNav } from '@/components/site-nav'
import { SiteFooter } from '@/components/site-footer'

export function AppShell({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isWorkspace = pathname.startsWith('/workspace')

  if (isWorkspace) {
    return <>{children}</>
  }

  return (
    <>
      <SiteNav />
      <main className="min-h-screen">{children}</main>
      <SiteFooter />
    </>
  )
}
