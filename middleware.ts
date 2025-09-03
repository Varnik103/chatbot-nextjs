// middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

// Protect all routes except static files and Next.js internals
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next (Next.js internals)
     * - static files (e.g. favicon.ico, robots.txt)
     * - public folder
     */
    "/((?!_next|.*\\..*|favicon.ico).*)",
  ],
};
