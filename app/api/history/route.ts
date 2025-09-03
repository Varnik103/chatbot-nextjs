import { auth } from "@clerk/nextjs/server"
import { getDb } from "@/lib/mongodb"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return new Response("Unauthorized", { status: 401 })
  const db = await getDb()
  const chats = await db
    .collection("chats")
    .find({ userId })
    .project({ _id: 0 })
    .sort({ updatedAt: -1, createdAt: -1 })
    .toArray()
  return Response.json({ chats })
}
