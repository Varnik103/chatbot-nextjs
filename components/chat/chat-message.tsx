"use client";

import { cn } from "@/lib/utils";
import { Pencil, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import TextareaAutosize from "react-textarea-autosize";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

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
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  const isImageUrl = (u: string) =>
    /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i.test(u);

  async function handleCopy(textToCopy?: string) {
    try {
      await navigator.clipboard.writeText(textToCopy || content || "");
      setCopied(true);
      toast.success("Copied to clipboard!", { duration: 1000 });
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      toast.error("Failed to copy clipboard!", { duration: 1000 });
      console.error("Failed to copy:", err);
    }
  }

  // 👉 Detect code blocks with ```lang ... ```
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts: (string | { lang: string; code: string })[] = [];
  let lastIndex = 0;
  let match;
  while ((match = codeBlockRegex.exec(content))) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    parts.push({ lang: match[1] || "plaintext", code: match[2].trim() });
    lastIndex = codeBlockRegex.lastIndex;
  }
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
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
        <>
          <ul className="py-2 space-y-2">
            {attachments.map((a) => {
              const isImg = isImageUrl(a.url);
              const isPdf = /\.pdf$/i.test(a.name);

              return (
                <li key={a.url}>
                  {isImg ? (
                    <img
                      src={a.url}
                      alt={a.name}
                      onClick={() => setPreviewImg(a.url)}
                      className="max-h-40 rounded-md cursor-pointer transition duration-200 hover:opacity-90"
                    />
                  ) : isPdf ? (
                    <div className="flex items-center gap-2 rounded-md border p-2 text-xs shadow-sm">
                      <span className="text-red-600">📄</span>
                      <span className="truncate max-w-[160px]">{a.name}</span>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-auto text-blue-400 hover:underline"
                      >
                        View
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-md border p-2 text-xs shadow-sm">
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

          {/* Image Preview Modal */}
          {previewImg && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
              onClick={() => setPreviewImg(null)}
            >
              <img
                src={previewImg}
                alt="Preview"
                className="max-h-[90%] max-w-[90%] rounded-lg shadow-lg"
              />
            </div>
          )}
        </>
      )}

      {/* message bubble (only for text) */}
      {(isTyping || content.trim()) && (
        <>
          {isEditing && isUser ? (
            <div className="w-full max-w-3xl border rounded-md">
              <TextareaAutosize
                minRows={3}
                maxRows={12}
                className="w-full rounded-md text-foreground p-4 text-sm resize-none focus:outline-none min-h-[80px] bg-background"
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
            <div
              className={cn(
                "relative max-w-[85%] md:max-w-[70%] rounded-lg px-3 py-2 text-sm leading-relaxed overflow-hidden break-words",
                isUser ? "bg-[#303030] text-white" : ""
              )}
            >
              {parts.map((part, i) =>
                typeof part === "string" ? (
                  <p
                    key={i}
                    className="whitespace-pre-wrap break-words break-all"
                  >
                    {part}
                  </p>
                ) : (
                  <div key={i} className="relative my-3">
                    <div className="absolute top-2 right-2">
                      <button
                        onClick={() => handleCopy(part.code)}
                        className="text-xs px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
                      >
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <SyntaxHighlighter
                      language={part.lang}
                      style={oneDark}
                      customStyle={{
                        borderRadius: "0.5rem",
                        padding: "1rem",
                        fontSize: "0.85rem",
                      }}
                    >
                      {part.code}
                    </SyntaxHighlighter>
                  </div>
                )
              )}
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
          {isUser && onEdit && (!attachments || attachments.length === 0) && (
            <button
              onClick={onEdit}
              className="hover:text-foreground"
              aria-label="Edit message"
            >
              <Pencil className="size-4" />
            </button>
          )}
          {!isLoading && (
            <button
              onClick={() => handleCopy()}
              className="hover:text-foreground"
              aria-label="Copy message"
            >
              <Copy className="size-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
