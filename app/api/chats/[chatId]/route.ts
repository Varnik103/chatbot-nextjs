import { auth } from "@clerk/nextjs/server"
import { getDb } from "@/lib/mongodb"

export async function DELETE(
  _: Request,
  context: { params: Promise<{ chatId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const { chatId } = await context.params;
    const db = await getDb()

    console.log(chatId, userId)

    const chat = await db.collection("chats").findOne({ id: chatId, userId })
    if (!chat) return Response.json({ error: "Not found" }, { status: 404 })

    await db.collection("messages").deleteMany({ chatId })
    await db.collection("chats").deleteOne({ id: chatId, userId })

    return new Response(null, { status: 204 })
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string }
    return Response.json({ error: e?.message || "Failed to delete chat" }, { status: 500 })
  }
}

