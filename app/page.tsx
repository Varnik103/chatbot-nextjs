import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs"

export default function HomePage() {
  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-balance">ChatGPT Interface</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          A minimal, mobile-first chat UI powered by Grok-4 with streaming responses.
        </p>

        <SignedOut>
          <div className="flex items-center justify-center gap-2">
            <SignInButton mode="modal">
              <Button variant="outline">Sign in</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button className="bg-blue-600 hover:bg-blue-600/90">Sign up</Button>
            </SignUpButton>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="flex items-center justify-center gap-3">
            <Button asChild className="bg-blue-600 hover:bg-blue-600/90">
              <Link href="/chat">Open Chat</Link>
            </Button>
            <UserButton />
          </div>
        </SignedIn>
      </div>
    </main>
  )
}
