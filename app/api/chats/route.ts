import { auth, currentUser } from "@clerk/nextjs/server"
import { getDb } from "@/lib/mongodb"

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })
    const db = await getDb()
    const cu = await currentUser()
    const email = cu?.emailAddresses?.[0]?.emailAddress || null
    const name = cu ? `${cu.firstName ?? ""} ${cu.lastName ?? ""}`.trim() : null
    const imageUrl = cu?.imageUrl || null
    await db
      .collection("users")
      .updateOne({ clerkId: userId }, { $set: { clerkId: userId, email, name, imageUrl } }, { upsert: true })

    const raw = await db.collection("chats").find({ userId }).sort({ updatedAt: -1, createdAt: -1 }).toArray()

    const chats = raw.map((c: any) => ({
      id: c._id.toString(),
      title: c.title,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      visibility: c.visibility,
    }))

    return Response.json({ chats })
  } catch (e: any) {
    return Response.json({ error: e?.message || "Failed to load chats" }, { status: 500 })
  }
}

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })
    const db = await getDb()
    const now = Date.now()
    const insert = await db.collection("chats").insertOne({
      title: "New chat",
      userId,
      createdAt: now,
      updatedAt: now,
      visibility: "private",
    })
    return Response.json({ id: insert.insertedId.toString() })
  } catch (e: any) {
    return Response.json({ error: e?.message || "Failed to create chat" }, { status: 500 })
  }
}
