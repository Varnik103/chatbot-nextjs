"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Send, Paperclip, Loader2, X } from "lucide-react"
import TextareaAutosize from "react-textarea-autosize"

type Attachment = { url: string; name: string }

type Props = {
  value: string
  onChange: (v: string) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onStop?: () => void
  disabled?: boolean
  onFileSelect?: (file: File) => Promise<string> // returns uploaded URL
  attachments?: Attachment[]
  onRemoveAttachment?: (url: string) => void
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  disabled,
  onFileSelect,
  attachments = [],
  onRemoveAttachment,
}: Props) {
  const formRef = useRef<HTMLFormElement | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFiles(files: File[]) {
    if (!onFileSelect) return
    setUploading(true)
    try {
      for (const f of files) {
        if (attachments.length >= 2) break // 🚫 limit to 2
        const url = await onFileSelect(f)
        // Instead of just URL, we keep both
        attachments.push({ url, name: f.name })
      }
    } catch(e){
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault()
        if (!uploading) onSubmit(e)
      }}
      className="w-full flex flex-col gap-2"
      aria-label="Ask Anything"
    >
      {/* attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {attachments.map((att) => {
            const isImg = /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(att.name);
            const isPdf = /\.pdf$/i.test(att.name);

            if (!isImg && !isPdf) return null; // 🚫 skip unsupported files

            return (
              <div
                key={att.url}
                className="relative flex items-center gap-1 rounded-md border border-gray-600 px-2 py-1 text-xs max-w-[160px] truncate text-white"
              >
                {isImg ? (
                  <img
                    src={att.url}
                    alt={att.name}
                    className="w-6 h-6 object-cover rounded"
                  />
                ) : isPdf ? (
                  <span className="text-red-400">📄 PDF</span>
                ) : null}
                <span className="truncate">{att.name}</span>
                {onRemoveAttachment && (
                  <button
                    type="button"
                    onClick={() => onRemoveAttachment(att.url)}
                    className="ml-1 text-gray-300 hover:text-white"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Composer row */}
      <div className="flex items-end gap-2 rounded-4xl px-3 py-2 shadow-sm bg-[#303030] text-white">
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={async (e) => {
            const files = Array.from(e.target.files || [])
            if (files.length) {
              const allowed = files.slice(0, 2 - attachments.length)
              await handleFiles(allowed)
            }
          }}
        />

        {/* Attach button */}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="shrink-0 text-gray-300 hover:text-white "
          onClick={() => fileRef.current?.click()}
          disabled={uploading || attachments.length >= 2}
        >
          <Paperclip className="size-4" />
        </Button>

        {/* Textarea */}
        <TextareaAutosize
          minRows={1}
          maxRows={5}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={uploading ? "Uploading file…" : "Ask Anything..."}
          className="flex-1 resize-none bg-transparent text-sm text-white focus:outline-none disabled:opacity-50 px-1 py-2"
          disabled={disabled || uploading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !uploading) {
              e.preventDefault()
              formRef.current?.requestSubmit()
            }
          }}
        />

        {/* Send button */}
        <Button
          type="submit"
          size="icon"
          className="shrink-0 bg-[#303031] hover:bg-[#505050] text-white"
          disabled={disabled || uploading}
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </div>
    </form>
  )
}