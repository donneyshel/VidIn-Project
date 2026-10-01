import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import InsightVaultDemo from '@/components/insight-vault-demo'

type PageProps = {
  searchParams: Promise<{
    recording?: string
  }>
}

export default async function WorkspaceInsightVaultPage({
  searchParams,
}: PageProps) {
  const params = await searchParams
  const recordingId = params.recording?.trim()

  let initialRecording = null

  if (recordingId) {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/auth')
    }

    const { data, error } = await supabase
      .from('recordings')
      .select(
        'id, title, source_type, source_url, transcript, segments, duration_seconds, analysis, created_at, updated_at'
      )
      .eq('id', recordingId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!error && data) {
      initialRecording = data
    }
  }

  return (
    <InsightVaultDemo initialRecording={initialRecording} />
  )
}
