"use client"
import { useState, useEffect } from "react"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import ChatClient from "@/components/chat/chat-client"

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    // Keep this index page as an empty composer; do not auto-create chats.
  }, [])

  return (
    <main className="min-h-[calc(100dvh)] bg-background text-foreground font-sans">
      <div className="mx-auto w-full max-w-6xl h-[100dvh] flex">
        {/* pass collapsed for desktop rail, and open for mobile drawer */}
        <ChatSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={!sidebarOpen} />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Mobile: hamburger */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open sidebar"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="size-5" />
                </Button>
                {/* Desktop: icon toggle instead of text */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:inline-flex"
                  aria-pressed={sidebarOpen}
                  aria-label="Toggle sidebar"
                  onClick={() => setSidebarOpen((v) => !v)}
                  title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
                >
                  <Menu className="size-5" />
                </Button>
                <h1 className="text-lg md:text-xl font-semibold text-balance">New chat</h1>
              </div>
              <ThemeToggle />
            </div>
          </header>
          <div className="flex-1 flex flex-col">
            {/* force clean state on index with a stable key */}
            <ChatClient key="new" />
          </div>
        </div>
      </div>
    </main>
  )
}
