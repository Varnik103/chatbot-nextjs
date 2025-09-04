import { auth } from "@clerk/nextjs/server"
import { getDb } from "@/lib/mongodb"

export async function PATCH(req: Request, context: { params: Promise<{ messageId: string }> }) {
  const { userId } = await auth()
  if (!userId) return new Response("Unauthorized", { status: 401 })

  const { messageId } = await context.params
  const { content } = await req.json()

  const db = await getDb()
  const msg = await db.collection("messages").findOne({ id: messageId })
  if (!msg) return new Response("Not found", { status: 404 })

  // verify ownership through chat
  const chat = await db.collection("chats").findOne({ id: msg.chatId, userId })
  if (!chat) return new Response("Forbidden", { status: 403 })

  await db
    .collection("messages")
    .updateOne({ id: messageId }, { $set: { content, parts: { text: content }, archived: false } })

  await db.collection("messages").updateMany(
    { chatId: msg.chatId, createdAt: { $gt: msg.createdAt } },
    { $set: { archived: true } }
  )

  return new Response(null, { status: 204 })
}
