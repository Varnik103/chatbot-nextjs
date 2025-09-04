"use client"

import type React from "react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Paperclip, Loader2 } from "lucide-react"

type Props = {
  value: string
  onChange: (v: string) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onStop?: () => void
  disabled?: boolean
  onFileSelect?: (file: File) => Promise<any>
  attachments?: string[]
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

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault()
        if (!uploading) onSubmit(e) // 🚫 block while uploading
      }}
      className="flex flex-col gap-2"
      aria-label="Send a message"
    >
      {attachments.length > 0 ? (
        <div className="rounded-md border p-2">
          <p className="text-xs font-medium mb-2 text-muted-foreground">Attachments</p>
          <div className="flex flex-wrap gap-2">
            {attachments.map((u) => {
              const isImg = /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i.test(u)
              return isImg ? (
                <div
                  key={u}
                  className="relative w-16 h-16 overflow-hidden rounded border flex items-center justify-center"
                >
                  <img
                    src={u || "/placeholder.svg"}
                    alt="Attachment preview"
                    className="object-cover w-full h-full"
                    crossOrigin="anonymous"
                  />
                  {uploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="size-4 animate-spin text-white" />
                    </div>
                  )}
                  {onRemoveAttachment ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute -top-1 -right-1 rounded-full w-5 h-5 p-0 text-xs"
                      onClick={() => onRemoveAttachment(u)}
                      aria-label="Remove attachment"
                      disabled={uploading}
                    >
                      ×
                    </Button>
                  ) : null}
                </div>
              ) : (
                <div
                  key={u}
                  className="relative px-2 py-1 text-xs rounded border bg-muted max-w-[120px] truncate"
                >
                  {u.split("/").pop()}
                  {uploading && (
                    <Loader2 className="size-3 ml-1 inline animate-spin text-muted-foreground" />
                  )}
                  {onRemoveAttachment ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute -top-1 -right-1 rounded-full w-5 h-5 p-0 text-xs"
                      onClick={() => onRemoveAttachment(u)}
                      aria-label="Remove attachment"
                      disabled={uploading}
                    >
                      ×
                    </Button>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      {/* composer row */}
      <div className="flex items-end gap-2">
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={async (e) => {
            const files = Array.from(e.target.files || [])
            if (files.length && onFileSelect) {
              setUploading(true)
              try {
                for (const f of files) {
                  await onFileSelect(f)
                }
              } finally {
                setUploading(false)
                if (fileRef.current) fileRef.current.value = ""
              }
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="px-2 bg-transparent"
          aria-label="Attach file"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          <Paperclip className="size-4" />
        </Button>
        <label htmlFor="chat-input" className="sr-only">
          Message
        </label>
        <Textarea
          id="chat-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={uploading ? "Uploading file…" : "Send a message..."}
          className="min-h-10 max-h-40 resize-y"
          rows={2}
          disabled={disabled || uploading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !uploading) {
              e.preventDefault()
              formRef.current?.requestSubmit()
            }
          }}
        />
        <div className="flex gap-2">
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-600/90"
            disabled={disabled || uploading}
          >
            {uploading ? (
              <Loader2 className="size-4 mr-1 animate-spin" />
            ) : (
              <Send className="size-4 mr-1" />
            )}
            {uploading ? "Uploading…" : "Send"}
          </Button>
        </div>
      </div>
    </form>
  )
}
