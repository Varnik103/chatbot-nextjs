import { streamText } from "ai"
import { xai } from "@ai-sdk/xai"
import { auth, currentUser } from "@clerk/nextjs/server"
import { getDb } from "@/lib/mongodb"

export const dynamic = "force-dynamic"

function smartTitle(text: string) {
  const trimmed = (text || "").trim().replace(/\s+/g, " ")
  const firstSentence = trimmed.split(/[.!?]\s/)[0] || trimmed
  const slice = firstSentence.slice(0, 50)
  return slice
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const { chatId, messages, lastAttachments } = await req.json()
    const db = await getDb()

    // upsert user in DB
    const cu = await currentUser()
    const email = cu?.emailAddresses?.[0]?.emailAddress
    await db.collection("users").updateOne({ id: userId }, { $set: { id: userId, email } }, { upsert: true })

    let effectiveChatId: string | undefined = chatId

    if (effectiveChatId) {
      const chat = await db.collection("chats").findOne({ id: effectiveChatId, userId })
      if (!chat) return Response.json({ error: "Chat not found" }, { status: 404 })
    } else {
      const firstUser = [...(messages || [])].reverse().find((m: any) => m.role === "user")
      const title = smartTitle(firstUser?.content || "New chat")
      const id = crypto.randomUUID()
      const now = Date.now()
      await db.collection("chats").insertOne({
        id,
        title,
        userId,
        createdAt: now,
        updatedAt: now,
        visibility: "private",
      })
      if (firstUser?.content) {
        await db.collection("messages").insertOne({
          id: crypto.randomUUID(),
          chatId: id,
          role: "user",
          content: firstUser.content,
          parts: { text: firstUser.content },
          attachments: Array.isArray(lastAttachments) ? lastAttachments : [],
          createdAt: now,
        })
      }
      effectiveChatId = id
    }

    const result = await streamText({
      model: xai("grok-4"),
      system:
        "You are a helpful, concise AI assistant. Prefer clear step-by-step guidance, avoid hallucinations, and ask clarifying questions when needed.",
      messages,
    })

    // persist assistant final text and bump updatedAt
    result.text
      .then(async (text) => {
        const id = crypto.randomUUID()
        const createdAt = Date.now()
        await db.collection("messages").insertOne({
          id,
          chatId: effectiveChatId,
          role: "assistant",
          content: text,
          parts: { text },
          attachments: [],
          createdAt,
        })
        await db.collection("chats").updateOne({ id: effectiveChatId }, { $set: { updatedAt: createdAt } })
      })
      .catch(() => {})

    const response = result.toTextStreamResponse()
    response.headers.set("X-Chat-Id", effectiveChatId!)
    return response
  } catch (err: any) {
    const msg =
      err?.statusCode === 403
        ? "Access to the AI provider was forbidden. Check credits or API key."
        : err?.message || "Failed to generate response."
    return Response.json({ error: msg }, { status: Number(err?.statusCode) || 500 })
  }
}
