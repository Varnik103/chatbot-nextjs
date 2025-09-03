import { auth } from "@clerk/nextjs/server"
import { getDb } from "@/lib/mongodb"

export async function GET(
  _req: Request,
  context: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await context.params;
  const { userId } = await auth()
  if (!userId) return new Response("Unauthorized", { status: 401 })

  const db = await getDb()
  console.log("chatId", chatId)
  console.log("userId", userId)
  const chat = await db.collection("chats").findOne({ id: chatId, userId })
  console.log("response", chat)
  if (!chat) return new Response("Not found", { status: 404 })

  const msgs = await db
    .collection("messages")
    .find({ chatId })
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

export async function POST(
  req: Request,
  context: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await context.params;
  const { userId } = await auth()
  if (!userId) return new Response("Unauthorized", { status: 401 })

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
  }

  await db.collection("messages").insertOne(doc)
  await db.collection("chats").updateOne(
    { id: chatId },
    { $set: { updatedAt: createdAt } }
  )

  return Response.json({ id })
}
