import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <SignUp routing="hash" />
    </main>
  )
}
