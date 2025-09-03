import { auth } from "@clerk/nextjs/server"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })
    const db = await getDb()
    const oid = new ObjectId(params.id)
    const chat = await db.collection("chats").findOne({ _id: oid, userId })
    if (!chat) return Response.json({ error: "Not found" }, { status: 404 })
    await db.collection("messages").deleteMany({ $or: [{ chatId: oid }, { chatId: params.id }] })
    await db.collection("chats").deleteOne({ _id: oid, userId })
    return new Response(null, { status: 204 })
  } catch (e: any) {
    return Response.json({ error: e?.message || "Failed to delete chat" }, { status: 500 })
  }
}
