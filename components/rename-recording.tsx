"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function RenameRecording({ id, title }: { id: string; title: string }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(title)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function save() {
    const nextTitle = value.trim()
    if (!nextTitle || nextTitle.length > 120) {
      setError("Title must be 1–120 characters.")
      return
    }

    setSaving(true)
    setError("")

    try {
      const response = await fetch("/api/recordings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, title: nextTitle }),
      })

      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.error || "Rename failed.")
      }

      setEditing(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rename failed.")
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)}
        className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary">
        Rename
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <input aria-label="Recording title" value={value} maxLength={120}
        onChange={(event) => setValue(event.target.value)}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
      {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button type="button" disabled={saving} onClick={save}
          className="rounded-lg border border-border px-3 py-2 text-sm">
          {saving ? "Saving..." : "Save"}
        </button>
        <button type="button" disabled={saving}
          onClick={() => { setValue(title); setError(""); setEditing(false) }}
          className="rounded-lg px-3 py-2 text-sm">
          Cancel
        </button>
      </div>
    </div>
  )
}
