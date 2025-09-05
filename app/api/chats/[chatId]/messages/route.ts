import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/mongodb";
import { createMem0, addMemories, retrieveMemories } from "@mem0/vercel-ai-provider";

// Initialize mem0 wrapper
const mem0 = createMem0({
  provider: "openai",
  mem0ApiKey: process.env.MEM0_API_KEY!,
});

export async function GET(_: Request, context: { params: Promise<{ chatId: string }> }) {
  const { userId } = await auth()
  if (!userId) return new Response("Unauthorized", { status: 401 })

  const { chatId } = await context.params // ✅ await it
  const db = await getDb()
  const chat = await db.collection("chats").findOne({ id: chatId, userId })

  if (!chat) return new Response("Not found", { status: 404 })

  const msgs = await db
    .collection("messages")
    .find({ chatId, archived: { $ne: true } })
    .project({ _id: 0 })
    .sort({ createdAt: 1 })
    .toArray()

  const messages = msgs.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content ?? m.parts?.text ?? "",
    attachments: m.attachments,
  }))

  return Response.json({ messages })
}


export async function POST(req: Request, context: { params: Promise<{ chatId: string }> }) {
  const { userId } = await auth()
  if (!userId) return new Response("Unauthorized", { status: 401 })

  const { chatId } = await context.params // ✅ await it
  const body = await req.json()

  const db = await getDb()
  const chat = await db.collection("chats").findOne({ id: chatId, userId })
  if (!chat) return new Response("Not found", { status: 404 })

  const id = crypto.randomUUID()
  const createdAt = Date.now()
  const doc = {
    id,
    chatId,
    role: body.role,
    content: body.content,
    parts: { text: body.content },
    attachments: body.attachments ?? [],
    createdAt,
    archived: false
  }

  await db.collection("messages").insertOne(doc)
  await db.collection("chats").updateOne({ id: chatId }, { $set: { updatedAt: createdAt } })

  // 👉 save memory to mem0
  await addMemories([{ role: body.role, content: body.content }], { user_id: userId });

  return Response.json({ id })
}
