"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Pencil } from "lucide-react"

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

  const isImageUrl = (u: string) =>
    /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i.test(u)

  return (
    <div
      className={cn("flex items-start gap-3", isUser ? "justify-end" : "justify-start")}
      role="listitem"
      aria-live={isAssistant ? "polite" : undefined}
    >
      {!isUser && (
        <Avatar className="size-8">
          <AvatarFallback aria-hidden="true">AI</AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "max-w-[85%] md:max-w-[70%] rounded-lg px-3 py-2 text-sm leading-relaxed",
          isUser ? "bg-blue-600 text-white" : "bg-muted",
        )}
      >
        {isEditing && isUser ? (
          <div className="space-y-2">
            <textarea
              className="w-full bg-background/70 text-foreground rounded-md p-2 text-sm resize-y min-h-10 max-h-40"
              value={editValue}
              onChange={(e) => onEditChange?.(e.target.value)}
              rows={3}
            />

            <div className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}>
              <button
                onClick={onEditSave}
                disabled={editValue?.trim() === content.trim() || editValue === ""}   // 👈 disable if unchanged
                className="px-2 py-1 rounded bg-primary text-primary-foreground text-xs disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={onEditCancel}
                className="px-2 py-1 rounded bg-secondary text-secondary-foreground text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="whitespace-pre-wrap">{isTyping ? "Thinking…" : content}</p>
            {attachments && attachments.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {attachments.map((a) => (
                  <li key={a.url}>
                    {isImageUrl(a.url) ? (
                      <img
                        src={a.url}
                        alt={a.name}
                        className="max-h-30 rounded border"
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
            ) : null}
          </>
        )}
      </div>
      {isUser && (
        <div className="flex items-start gap-2">
          <Avatar className="size-8">
            <AvatarFallback aria-hidden="true">U</AvatarFallback>
          </Avatar>
          {!isEditing && onEdit ? (
            <button
              onClick={onEdit}
              className="self-center text-xs text-muted-foreground hover:underline"
              aria-label="Edit message"
            >
              <Pencil className="size-4" />
            </button>
          ) : null}
        </div>
      )}
    </div>
  )
}
