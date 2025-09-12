import { streamText } from "ai"
import { xai } from "@ai-sdk/xai"
import { auth, currentUser } from "@clerk/nextjs/server"
import { getDb } from "@/lib/mongodb"
import { createMem0, retrieveMemories } from "@mem0/vercel-ai-provider"
import { LanguageModelV2Prompt } from "@ai-sdk/provider";

export const dynamic = "force-dynamic"

type Role = "system" | "user" | "assistant" | "data" | "tool"
type Message = { id?: string; role: Role; content: string; attachments?: string[] }
type Attachment = { url: string; name: string; type: string; extractedText?: string }

const mem0 = createMem0({
  provider: "openai",
  mem0ApiKey: process.env.MEM0_API_KEY!,
});

function smartTitle(text: string) {
  const trimmed = (text || "").trim().replace(/\s+/g, " ");
  const firstSentence = trimmed.split(/[.!?]\s/)[0] || trimmed;
  const slice = firstSentence.slice(0, 50);

  // Capitalize the first letter of the first word
  if (slice.length > 0) {
    return slice.charAt(0).toUpperCase() + slice.slice(1);
  }
  return slice; // Return empty string as-is if no content
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

    const memoryPrompt: LanguageModelV2Prompt = messages.map((m: Message) => { return { role: m.role, content: [{ type: "text", text: m.content }] } })

    let memories = await retrieveMemories(memoryPrompt, { user_id: userId })

    let effectiveChatId: string | undefined = chatId

    if (effectiveChatId) {
      const chat = await db.collection("chats").findOne({ id: effectiveChatId, userId })
      if (!chat) return Response.json({ error: "Chat not found" }, { status: 404 })
    } else {
      const firstUser = [...(messages as Message[] | [])]
        .reverse()
        .find((m: Message) => m.role === "user")

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
        memories = await retrieveMemories(firstUser?.content, { user_id: userId })

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

    const enrichedMessages = enrichMessages(messages, lastAttachments)
    const result = await streamText({
      model: xai("grok-4"),
      system: memories,
      messages: enrichedMessages as LanguageModelV2Prompt,
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
      .catch(() => { })

    const response = result.toTextStreamResponse()
    response.headers.set("X-Chat-Id", effectiveChatId!)
    return response
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string }
    const msg =
      e?.statusCode === 403
        ? "Access to the AI provider was forbidden. Check credits or API key."
        : e?.message || "Failed to generate response."
    return Response.json({ error: msg }, { status: e?.statusCode || 500 })
  }
}


function enrichMessages(messages: Message[], lastAttachments?: Attachment[]) {
  const mapped = messages.map((m) => ({
    role: m.role as "system" | "user" | "assistant" | "tool", // "data" is not supported by ModelMessage
    content: [{ type: "text", text: m.content }],
  }))

  if (lastAttachments?.length) {
    const attachmentContent = lastAttachments.flatMap((att) => {
      const base: { type: "text"; text: string }[] = [
        {
          type: "text",
          text: `Attachment: ${att.name} (${att.type})\nURL: ${att.url}`,
        },
      ]
      if (att.extractedText) {
        base.push({
          type: "text",
          text: `Extracted Text:\n${att.extractedText}`,
        })
      }
      return base
    })

    mapped.push({
      role: "user",
      content: attachmentContent,
    })
  }

  return mapped
}