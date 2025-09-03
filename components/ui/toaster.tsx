"use client"

import type * as React from "react"
import { Toaster as SonnerToaster } from "sonner"

export function Toaster(props: React.ComponentProps<typeof SonnerToaster>) {
  return <SonnerToaster richColors closeButton position="top-right" {...props} />
}
