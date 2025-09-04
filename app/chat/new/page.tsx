"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function NewChatPage() {
  const router = useRouter()
  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await fetch("/api/chats", { method: "POST" })
      if (!res.ok) {
        router.replace("/")
        return
      }
      const data = await res.json()
      if (!alive) return
      router.replace(`/chat/${data.id}`)
    })()
    return () => {
      alive = false
    }
  }, [router])
  return null
}
