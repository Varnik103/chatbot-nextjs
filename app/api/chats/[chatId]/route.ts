import { auth } from "@clerk/nextjs/server"
import { getDb } from "@/lib/mongodb"

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })
    const db = await getDb()
    const chat = await db.collection("chats").findOne({ id: params.id, userId })
    if (!chat) return Response.json({ error: "Not found" }, { status: 404 })
    await db.collection("messages").deleteMany({ chatId: params.id })
    await db.collection("chats").deleteOne({ id: params.id, userId })
    return new Response(null, { status: 204 })
  } catch (e: any) {
    return Response.json({ error: e?.message || "Failed to delete chat" }, { status: 500 })
  }
}
