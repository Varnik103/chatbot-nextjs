import { auth, currentUser } from "@clerk/nextjs/server"
import { getDb } from "@/lib/mongodb"

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })
    const db = await getDb()
    const cu = await currentUser()
    const email = cu?.emailAddresses?.[0]?.emailAddress
    await db.collection("users").updateOne({ id: userId }, { $set: { id: userId, email } }, { upsert: true })

    const chats = await db
      .collection("chats")
      .find({ userId })
      .project({ _id: 0 })
      .sort({ updatedAt: -1, createdAt: -1 })
      .toArray()
    return Response.json({ chats })
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string }
    return Response.json({ error: e?.message || "Failed to load chats" }, { status: 500 })
  }
}

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })
    const db = await getDb()
    const cu = await currentUser()
    const email = cu?.emailAddresses?.[0]?.emailAddress
    await db.collection("users").updateOne({ id: userId }, { $set: { id: userId, email } }, { upsert: true })

    const id = crypto.randomUUID()
    const now = Date.now()
    const doc = { id, title: "New chat", userId, createdAt: now, updatedAt: now, visibility: "private" }
    await db.collection("chats").insertOne(doc)
    return Response.json({ id })
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string }
    return Response.json({ error: e?.message || "Failed to create chat" }, { status: 500 })
  }
}
