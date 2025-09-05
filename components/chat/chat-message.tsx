"use client"

import { cn } from "@/lib/utils"
import { Pencil, Copy } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

type Attachment = { url: string; name: string; type: string }

type Props = {
  role: "system" | "user" | "assistant" | "data" | "tool"
  content: string
  isTyping?: boolean
  onEdit?: () => void
  isEditing?: boolean
  editValue?: string
  onEditChange?: (v: string) => void
  onEditSave?: () => void
  onEditCancel?: () => void
  attachments?: Attachment[]
}

export function ChatMessage({
  role,
  content,
  isTyping,
  onEdit,
  isEditing,
  editValue,
  onEditChange,
  onEditSave,
  onEditCancel,
  attachments,
}: Props) {
  const isUser = role === "user"
  const isAssistant = role === "assistant" || role === "system"
  const [copied, setCopied] = useState(false)

  const isImageUrl = (u: string) =>
    /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i.test(u)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content || "")
      setCopied(true)
      toast.success("Copied to clipboard!", { duration: 1000 });
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      toast.error("Failed to copy clipboard!", { duration: 1000 });
      console.error("Failed to copy:", err)
    }
  }

  return (
    <div
      className={cn("flex flex-col group", isUser ? "items-end" : "items-start")}
      role="listitem"
      aria-live={isAssistant ? "polite" : undefined}
    >
      {/* message bubble */}
      <div
        className={cn(
          "relative max-w-[85%] md:max-w-[70%] rounded-lg px-3 py-2 text-sm leading-relaxed",
          isUser ? "bg-[#303030] text-white" : "bg-muted"
        )}
      >
        {isEditing && isUser ? (
          <div className="space-y-3">
            <textarea
              className="w-full rounded-md border border-border bg-background/70 text-foreground p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
              value={editValue}
              onChange={(e) => onEditChange?.(e.target.value)}
            />

            <div className="flex gap-2 justify-end">
              <button
                onClick={onEditSave}
                disabled={editValue?.trim() === content.trim() || !editValue?.trim()}
                className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-600/90 disabled:opacity-50"
              >
                Save & Regenerate
              </button>
              <button
                onClick={onEditCancel}
                className="px-3 py-1.5 rounded-md border text-xs font-medium hover:bg-accent"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="whitespace-pre-wrap">
              {isTyping ? "Thinking…" : content}
            </p>

            {/* attachments */}
            {attachments && attachments.length > 0 && (
              <ul className="mt-2 space-y-2">
                {attachments.map((a) => (
                  <li key={a.url}>
                    {isImageUrl(a.url) ? (
                      <img
                        src={a.url}
                        alt={a.name}
                        className="max-h-40 rounded border"
                      />
                    ) : (
                      <a
                        className="underline text-xs break-all"
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        📎 {a.name}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {/* actions */}
      {!isEditing && (
        <div
          className={cn(
            "mt-2 flex gap-3 text-muted-foreground",
            isUser
              ? "justify-end opacity-0 group-hover:opacity-100 transition-opacity"
              : "justify-start" // assistant always visible
          )}
        >
          {/* edit only for user messages without attachments */}
          {isUser && onEdit && (!attachments || attachments.length === 0) && (
            <button
              onClick={onEdit}
              className="hover:text-foreground"
              aria-label="Edit message"
            >
              <Pencil className="size-4" />
            </button>
          )}

          {/* copy for all */}
          <button
            onClick={handleCopy}
            className="hover:text-foreground"
            aria-label="Copy message"
          >
            <Copy className="size-4" />
            {/* {copied && (
              toast.success("Copied to clipboard!", { duration: 1000 });
            )} */}
          </button>
        </div>
      )}
    </div>
  )
}
