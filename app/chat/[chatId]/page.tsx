"use client"

import React, { useState, useEffect } from "react"
import ChatClient from "@/components/chat/chat-client"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function ChatByIdPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = React.use(params)
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { isSignedIn } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed")
    if (stored) setSidebarOpen(stored === "false")
    else setSidebarOpen(true) // default open
  }, [])

  useEffect(() => {
    if (isSignedIn === false) {
      toast.error("Please sign in to view this chat")
      router.replace("/")
    }
  }, [isSignedIn, router])

  const handleSidebarToggle = () => {
    const newState = !sidebarOpen
    setSidebarOpen(newState)
    localStorage.setItem("sidebar-collapsed", String(!newState))
  }


  return (
    <main className="min-h-[calc(100dvh)] bg-background text-foreground font-sans">
      <div className="mx-auto w-full max-w-[1920px] h-[100dvh] flex">
        <ChatSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={!sidebarOpen} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open sidebar"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="size-5" />
                </Button>
                {/* Desktop toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:inline-flex"
                  aria-pressed={sidebarOpen}
                  aria-label="Toggle sidebar"
                  onClick={handleSidebarToggle}
                  title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
                >
                  <Menu className="size-5" />
                </Button>
                <h1 className="text-lg md:text-xl font-semibold text-balance">Chat</h1>
              </div>
              {/* <ThemeToggle /> */}
            </div>
          </header>
          <div className="flex-1 flex flex-col">
            <ChatClient key={chatId} chatId={chatId} />
          </div>
        </div>
      </div>
    </main>
  )
}
