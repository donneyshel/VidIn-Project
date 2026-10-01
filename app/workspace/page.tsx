import Link from 'next/link'
import {
  ArrowRight,
  Clock3,
  FileAudio,
  FolderOpen,
  Sparkles,
  Upload,
} from 'lucide-react'

export default function WorkspacePage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
      <div className="mb-10">
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          Your workspace
        </p>

        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Welcome back
        </h1>

        <p className="mt-2 max-w-2xl text-muted-foreground">
          Turn your media into searchable transcripts, insights, and
          intelligence.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Link
          href="/workspace/insight-vault"
          className="glass-card group rounded-2xl p-5 transition-colors hover:border-white/15"
        >
          <div className="mb-6 flex size-10 items-center justify-center rounded-xl bg-secondary">
            <Upload className="size-5" />
          </div>

          <h2 className="font-semibold">New transcription</h2>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Upload audio or video and turn it into an interactive transcript.
          </p>

          <div className="mt-5 flex items-center gap-2 text-sm font-medium">
            Start now
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        <Link
          href="/workspace/library"
          className="glass-card group rounded-2xl p-5 transition-colors hover:border-white/15"
        >
          <div className="mb-6 flex size-10 items-center justify-center rounded-xl bg-secondary">
            <FolderOpen className="size-5" />
          </div>

          <h2 className="font-semibold">Your library</h2>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Find your saved recordings, transcripts, and media history.
          </p>

          <div className="mt-5 flex items-center gap-2 text-sm font-medium">
            Open library
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        <Link
          href="/workspace/insight-vault"
          className="glass-card group rounded-2xl p-5 transition-colors hover:border-white/15"
        >
          <div className="mb-6 flex size-10 items-center justify-center rounded-xl bg-secondary">
            <Sparkles className="size-5" />
          </div>

          <h2 className="font-semibold">Insight Vault</h2>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Chat with your recordings and extract useful insights from them.
          </p>

          <div className="mt-5 flex items-center gap-2 text-sm font-medium">
            Open Insight Vault
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Recent activity</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your latest media will appear here.
            </p>
          </div>

          <Clock3 className="size-5 text-muted-foreground" />
        </div>

        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary">
            <FileAudio className="size-5" />
          </div>

          <h3 className="mt-4 font-medium">Your workspace is ready</h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Once you transcribe your first recording, it will appear in your
            library and recent activity.
          </p>

          <Link
            href="/workspace/insight-vault"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Create your first recording
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
