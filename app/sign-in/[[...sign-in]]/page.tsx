import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <SignIn routing="hash" />
    </main>
  )
}
