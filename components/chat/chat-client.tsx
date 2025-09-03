"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import useSWR from "swr"
import { ChatMessage } from "./chat-message"
import { ChatInput } from "./chat-input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"

type Role = "system" | "user" | "assistant" | "data" | "tool"
type Message = { id: string; role: Role; content: string; attachments?: string[] }

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ChatClient({ chatId }: { chatId?: string }) {
  const router = useRouter()
  // const { toast } = useToast()
  const [localChatId, setLocalChatId] = useState<string | undefined>(chatId)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [pendingAttachments, setPendingAttachments] = useState<string[]>([])
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const { data, mutate } = useSWR<{ messages: Message[] }>(
    localChatId ? `/api/chats/${localChatId}/messages` : null,
    fetcher,
  )

  useEffect(() => {
    if (data?.messages) setMessages(data.messages)
  }, [data?.messages])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages.length, isLoading])

  async function streamCompletion(
    baseMessages: { role: Role; content: string }[],
    assistantId: string,
    controller: AbortController,
    opts?: { chatId?: string; lastAttachments?: string[] },
  ) {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId: opts?.chatId, messages: baseMessages, lastAttachments: opts?.lastAttachments }),
      signal: controller.signal,
    })

    if (!res.ok || !res.body) {
      let detail = "Request failed"
      try {
        const j = await res.json()
        if (j?.error) detail = j.error
      } catch {}
      toast.error("Chat error", { description: detail })
      throw new Error(`Request failed: ${res.status}`)
    }

    const newChatId = res.headers.get("x-chat-id")
    if (newChatId && !localChatId) {
      setLocalChatId(newChatId)
      router.replace(`/chat/${newChatId}`)
      setTimeout(() => mutate(), 0)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      const events = buffer.split("\n\n")
      buffer = events.pop() || ""

      for (const evt of events) {
        const line = evt.split("\n").find((l) => l.startsWith("data:"))
        if (!line) continue
        const data = line.slice(5).trim()
        if (!data || data === "[DONE]") continue

        try {
          const json = JSON.parse(data)
          if (json.type === "text-delta" && typeof json.text === "string") {
            const delta = json.text as string
            setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + delta } : m)))
          } else if (json.type === "message" && json.message?.role === "assistant") {
            const chunk = String(json.message?.content ?? "")
            if (chunk) {
              setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)))
            }
          } else if (typeof json === "string") {
            setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + json } : m)))
          }
        } catch {
          setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + data } : m)))
        }
      }
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      attachments: pendingAttachments.length ? [...pendingAttachments] : undefined,
    }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setPendingAttachments([])

    setIsLoading(true)
    const controller = new AbortController()
    abortRef.current = controller

    const assistantId = crypto.randomUUID()
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }])

    try {
      // persist user message if we already have a chat
      if (localChatId) {
        const r = await fetch(`/api/chats/${localChatId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "user", content: userMsg.content, attachments: userMsg.attachments }),
        })
        if (!r.ok) {
          const err = await r.text().catch(() => "")
          toast.error("Failed to save message", { description: err || "Try again." })
        }
      }

      await streamCompletion(
        [...messages, userMsg].map(({ role, content }) => ({ role, content })),
        assistantId,
        controller,
        { chatId: localChatId, lastAttachments: userMsg.attachments },
      )
      mutate()
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: (m.content || "") + "\n[Error streaming response]" } : m,
        ),
      )
    } finally {
      setIsLoading(false)
      abortRef.current = null
    }
  }

  function onStop() {
    abortRef.current?.abort()
    abortRef.current = null
    setIsLoading(false)
  }

  // Edit support: PATCH message and regenerate
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState<string>("")

  async function saveEdit() {
    if (!editingId) return
    const idx = messages.findIndex((m) => m.id === editingId)
    if (idx < 0) return
    const edited = { ...messages[idx], content: editingText }
    // Persist edit
    await fetch(`/api/messages/${edited.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: edited.content }),
    })
    // Remove following messages and regenerate
    const next = messages.slice(0, idx + 1)
    next[idx] = edited
    setMessages(next)
    setEditingId(null)
    setEditingText("")
    const controller = new AbortController()
    abortRef.current = controller
    setIsLoading(true)
    const assistantId = crypto.randomUUID()
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }])
    try {
      await streamCompletion(
        next.map(({ role, content }) => ({ role, content })),
        assistantId,
        controller,
        { chatId: localChatId },
      )
      mutate()
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: (m.content || "") + "\n[Error streaming response]" } : m,
        ),
      )
    } finally {
      setIsLoading(false)
      abortRef.current = null
    }
  }

  async function handleFileSelect(file: File) {
    const form = new FormData()
    form.append("file", file)
    const res = await fetch("/api/files/upload", { method: "POST", body: form })
    if (!res.ok) {
      const msg = await res.text().catch(() => "")
      return toast.error("Upload failed", { description: msg || "Unable to upload file." })
    }
    const { url } = await res.json()
    setPendingAttachments((prev) => [...prev, url])
  }

  const isImageUrl = (u: string) => /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i.test(u)

  return (
    <section className="flex flex-col flex-1">
      <div className="flex-1">
        <ScrollArea className="h-[calc(100dvh-56px-88px)] md:h-[calc(100dvh-64px-96px)]" ref={scrollRef}>
          <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6 md:py-8 space-y-4">
            {messages.length === 0 && (
              <div className="border rounded-lg p-6 md:p-8 text-center text-sm md:text-base text-muted-foreground">
                Start a conversation. Try: {"“Explain React Server Components in simple terms.”"}
              </div>
            )}
            {messages.map((m) => (
              <ChatMessage
                key={m.id}
                role={m.role}
                content={m.content}
                attachments={m.attachments}
                onEdit={
                  m.role === "user"
                    ? () => {
                        setEditingId(m.id)
                        setEditingText(m.content)
                      }
                    : undefined
                }
                isEditing={editingId === m.id}
                editValue={editingText}
                onEditChange={setEditingText}
                onEditSave={saveEdit}
                onEditCancel={() => {
                  setEditingId(null)
                  setEditingText("")
                }}
              />
            ))}
            {isLoading && <ChatMessage role="assistant" content="..." isTyping />}
          </div>
        </ScrollArea>
      </div>

      <div className="sticky bottom-0 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
        <div className="px-4 py-3 md:px-6 md:py-4">
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={onSubmit}
            disabled={isLoading}
            onStop={onStop}
            onFileSelect={handleFileSelect}
            attachments={pendingAttachments}
            onRemoveAttachment={(u) => setPendingAttachments((prev) => prev.filter((x) => x !== u))}
          />
          <p className="mt-2 text-xs text-muted-foreground text-center">
            AI responses may be inaccurate. Verify important information.
          </p>
        </div>
      </div>
    </section>
  )
}
