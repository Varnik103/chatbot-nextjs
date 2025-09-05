"use client";

import { cn } from "@/lib/utils";
import { Pencil, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import TextareaAutosize from "react-textarea-autosize";

type Attachment = { url: string; name: string; type: string };

type Props = {
  role: "system" | "user" | "assistant" | "data" | "tool";
  content: string;
  isTyping?: boolean;
  onEdit?: () => void;
  isEditing?: boolean;
  editValue?: string;
  onEditChange?: (v: string) => void;
  onEditSave?: () => void;
  onEditCancel?: () => void;
  attachments?: Attachment[];
  isLoading?: boolean;
};

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
  isLoading,
}: Props) {
  const isUser = role === "user";
  const isAssistant = role === "assistant" || role === "system";
  const [copied, setCopied] = useState(false);

  const isImageUrl = (u: string) =>
    /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i.test(u);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content || "");
      setCopied(true);
      toast.success("Copied to clipboard!", { duration: 1000 });
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      toast.error("Failed to copy clipboard!", { duration: 1000 });
      console.error("Failed to copy:", err);
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col group",
        isUser ? "items-end" : "items-start"
      )}
      role="listitem"
      aria-live={isAssistant ? "polite" : undefined}
    >
      {/* attachments outside bubble */}
      {attachments && attachments.length > 0 && (
        <ul className="mt-2 space-y-2">
          {attachments.map((a) => {
            const isImg = isImageUrl(a.url);
            const isPdf = /\.pdf$/i.test(a.name);
            return (
              <li key={a.url}>
                {isImg ? (
                  <img
                    src={a.url}
                    alt={a.name}
                    className="max-h-40 rounded-md "
                  />
                ) : isPdf ? (
                  <div className="flex items-center gap-2 rounded-md border p-2 text-xs shadow-sm">
                    <span className="text-red-600">📄</span>
                    <span className="truncate max-w-[160px]">{a.name}</span>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-auto text-blue-600 hover:underline"
                    >
                      View
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-md border bg-white p-2 text-xs shadow-sm">
                    <span>📎</span>
                    <span className="truncate max-w-[160px]">{a.name}</span>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-auto text-blue-600 hover:underline"
                    >
                      Open
                    </a>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* message bubble (only for text) */}
      {(isTyping || content.trim()) && (
        <>
          {isEditing && isUser ? (
            // full-width edit box
            <div className="w-full max-w-3xl border rounded-2xl bg-[#424242] text-white">
              <TextareaAutosize
                minRows={2}
                maxRows={8}
                className="w-full rounded-md text-foreground p-4 text-sm resize-none focus:outline-none min-h-[80px] bg-[#424242] text-white mt-4"
                value={editValue}
                onChange={(e) => onEditChange?.(e.target.value)}
              />
              <div className="flex gap-2 justify-end mt-2 mb-2 mr-4">
                <button
                  onClick={onEditCancel}
                  className="px-3 py-2 rounded-4xl border text-xs font-medium hover:bg-accent bg-[rgba(33,33,33,255)]"
                >
                  Cancel
                </button>
                <button
                  onClick={onEditSave}
                  disabled={
                    isLoading ||
                    editValue?.trim() === content.trim() ||
                    !editValue?.trim()
                  }
                  className="px-3 py-2 rounded-4xl bg-[#ffffff] text-black text-xs font-medium hover:bg-[#c5c9c9] disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          ) : (
            // normal message bubble
            <div
              className={cn(
                "relative max-w-[85%] md:max-w-[70%] rounded-lg px-3 py-2 text-sm leading-relaxed overflow-hidden break-words",
                isUser ? "bg-[#303030] text-white" : ""
              )}
            >
              <p className="whitespace-pre-wrap break-words break-all">
                {isTyping ? "Thinking…" : content}
              </p>
            </div>
          )}
        </>
      )}

      {/* actions (edit + copy) */}
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
          </button>
        </div>
      )}
    </div>
  );
}
