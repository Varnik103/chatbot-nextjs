"use client"

import type React from "react"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Paperclip } from "lucide-react"

type Props = {
  value: string
  onChange: (v: string) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onStop?: () => void
  disabled?: boolean
  onFileSelect?: (file: File) => Promise<any>
  attachments?: string[] // new prop
  onRemoveAttachment?: (url: string) => void // new prop
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

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(e)
      }}
      className="flex flex-col gap-2" // was row; now column to show previews inside input box
      aria-label="Send a message"
    >
      {attachments.length > 0 ? (
        <div className="rounded-md border p-2">
          <p className="text-xs font-medium mb-2 text-muted-foreground">Attachments</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {attachments.map((u) => {
              const isImg = /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i.test(u)
              return isImg ? (
                <div key={u} className="relative aspect-square overflow-hidden rounded border">
                  <img
                    src={u || "/placeholder.svg"}
                    alt="Attachment preview"
                    className="object-cover w-full h-full"
                    crossOrigin="anonymous" // correct React attribute
                  />
                  {onRemoveAttachment ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute top-1 right-1 rounded-full"
                      onClick={() => onRemoveAttachment(u)}
                      aria-label="Remove attachment"
                    >
                      ×
                    </Button>
                  ) : null}
                </div>
              ) : (
                <div key={u} className="relative rounded border p-2 text-xs break-all">
                  {u.split("/").pop()}
                  {onRemoveAttachment ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute top-1 right-1 rounded-full"
                      onClick={() => onRemoveAttachment(u)}
                      aria-label="Remove attachment"
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
              for (const f of files) {
                await onFileSelect(f)
              }
              if (fileRef.current) fileRef.current.value = ""
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="px-2 bg-transparent"
          aria-label="Attach file"
          onClick={() => fileRef.current?.click()}
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
          placeholder="Send a message..."
          className="min-h-10 max-h-40 resize-y"
          rows={2}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              formRef.current?.requestSubmit()
            }
          }}
        />
        <div className="flex gap-2">
          {disabled && onStop ? (
            <Button type="button" variant="outline" onClick={onStop}>
              Stop
            </Button>
          ) : null}
          <Button type="submit" className="bg-blue-600 hover:bg-blue-600/90">
            <Send className="size-4 mr-1" />
            Send
          </Button>
        </div>
      </div>
    </form>
  )
}
