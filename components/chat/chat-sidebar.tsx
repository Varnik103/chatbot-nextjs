"use client"

import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Plus, X, MoreVertical, Trash } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { useClerk, useUser, UserButton } from "@clerk/nextjs"

type Session = {
  id: string
  title: string
  createdAt: string | number
  updatedAt?: string | number
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function ChatSidebar({
  open,
  onClose,
  collapsed,
}: {
  open: boolean
  onClose: () => void
  collapsed?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()
  // const { signOut } = useClerk()
  const { data, mutate } = useSWR<{ chats: Session[] }>("/api/history", fetcher)
  const sessions = data?.chats || []
  const sorted = [...sessions].sort((a, b) => Number(b.updatedAt ?? b.createdAt) - Number(a.updatedAt ?? a.createdAt))

  const activeChatId = pathname.startsWith("/chat/") ? pathname.split("/")[2] : null

  async function newChat() {
    router.push("/chat")
    // onClose()
  }

  async function deleteChat(id: string) {
    const res = await fetch(`/api/chats/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const msg = await res.text().catch(() => "")
      toast.error(msg || "Unable to delete chat.")
      return
    }
    toast.success("Chat deleted")
    if (typeof window !== "undefined" && window.location.pathname === `/chat/${id}`) {
      router.push("/chat")
    }
    mutate()
  }

  function goToSession(id: string) {
    console.log("go to", id);
    router.push(`/chat/${id}`)
    onClose()
  }

  return (
    <>
      {/* Desktop rail */}
      <aside
        className={`hidden ${collapsed ? "md:hidden" : "md:flex md:w-55 md:shrink-0"} md:flex-col border-r bg-[#181818] text-sidebar-foreground`}
        aria-label="Chat sidebar"
      >
        <div className="px-4 py-2">
          <Button onClick={newChat} className="w-full text-white bg-[#181818] hover:bg-[#303030]">
            <Plus className="size-4 mr-2" />
            New chat
          </Button>
        </div>
        <Separator />
        <ScrollArea className="flex-1 min-h-0">
          <nav className="p-2 space-y-1">
            {sorted.length === 0 ? (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">No conversations yet</p>
            ) : (
              sorted.map((s) => (
                <div key={s.id} className={`flex items-center gap-1 px-1 group transition-colors ${
                      activeChatId === s.id ? "bg-[#242424]" : "hover:bg-sidebar-accent"
                    } rounded-md`}>
                  <button
                    onClick={() => goToSession(s.id)}
                    className={`flex-1 text-left px-3 py-2 rounded-md text-sm`}
                    title={s.title || "New chat"}
                  >
                    <span className="line-clamp-1">{s.title || "New chat"}</span>
                    {/* <span className="block text-xs text-muted-foreground">
                      {new Date(Number(s.updatedAt ?? s.createdAt)).toLocaleString()}
                    </span> */}
                  </button>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Chat options">
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          key={`delete-${s.id}`}
          className="text-red-600"
          onClick={() => deleteChat(s.id)}
        >
          <Trash className="size-4 mr-2" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
                </div>
              ))
            )}
          </nav>
        </ScrollArea>

        {/* Auth footer with user info and logout-on-avatar-click */}
        <div className="p-4 border-t mt-auto">
          <button className="w-full flex items-center gap-3 text-left" title="Sign out">
              <UserButton />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress || ""}</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
          <div
            className="absolute inset-y-0 left-0 w-5/6 max-w-80 bg-sidebar text-sidebar-foreground border-r p-3 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Chat sidebar"
          >
            
            <div className="mt-3">
              <Button onClick={newChat} className="w-full bg-blue-600 hover:bg-blue-600/90">
                <Plus className="size-4 mr-2" />
                New chat
              </Button>
            </div>
            <Separator className="my-3" />
            <ScrollArea className="flex-1 min-h-0">
              <nav className="p-1 space-y-1">
                {sorted.length === 0 ? (
                  <p className="px-2 py-1.5 text-xs text-muted-foreground">No conversations yet</p>
                ) : (
                  sorted.map((s) => (
                    <div key={s.id} className="flex items-center gap-1 px-1">
                      <button
                        onClick={() => goToSession(s.id)}
                        className={`flex-1 text-left px-3 py-2 rounded-md text-sm hover:bg-sidebar-accent transition-colors ${
                          activeChatId === s.id ? "bg-sidebar-accent border-l-2 border-blue-600" : ""
                        }`}
                      >
                        <span className="line-clamp-1">{s.title || "New chat"}</span>
                        <span className="block text-xs text-muted-foreground">
                          {new Date(Number(s.updatedAt ?? s.createdAt)).toLocaleString()}
                        </span>
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Chat options">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-red-600" onClick={() => deleteChat(s.id)}>
                            <Trash className="size-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))
                )}
              </nav>
            </ScrollArea>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserButton />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{user?.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress || ""}</p>
                </div>
              </div>
              {/* <Button variant="ghost" size="icon" aria-label="Close sidebar" onClick={onClose}>
                <X className="size-5" />
              </Button> */}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
