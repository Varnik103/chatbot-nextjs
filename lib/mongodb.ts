import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI
if (!uri) {
  throw new Error("Missing MONGODB_URI")
}

declare global {
  // eslint-disable-next-line no-var
  var __mongoClient: MongoClient | undefined
}

export function getMongoClient() {
  if (!globalThis.__mongoClient) {
    globalThis.__mongoClient = new MongoClient(uri as string)
  }
  return globalThis.__mongoClient
}

export async function getDb() {
  const client = getMongoClient()
  await client.connect()
  return client.db() // default DB from URI
}

export type ChatDoc = {
  _id?: string
  id: string
  title: string
  userId: string
  createdAt: number
  visibility?: "private" | "public"
  updatedAt?: number
}
export type MessageDoc = {
  _id?: string
  id: string
  chatId: string
  role: "system" | "user" | "assistant" | "data" | "tool"
  // parts?: any
  attachments?: string[]
  content?: string
  // jk
  createdAt: number
}
export type UserDoc = {
  _id?: string
  id: string
  email: string
  password?: string | null
}
