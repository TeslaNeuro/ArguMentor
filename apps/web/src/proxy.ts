import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isProtected = createRouteMatcher([
  "/debate(.*)",
  "/dashboard(.*)",
  "/api/debates(.*)",
  "/api/profile(.*)",
  "/api/coach(.*)",
  "/api/research(.*)",
]);

function devAuthEnabled() {
  return (
    process.env.ARGUMENTOR_DEV_AUTH === "true" ||
    (!process.env.CLERK_SECRET_KEY && process.env.NODE_ENV !== "production")
  );
}

export default devAuthEnabled()
  ? function proxy(_req: NextRequest) {
      return NextResponse.next();
    }
  : clerkMiddleware(async (auth, req) => {
      if (isProtected(req)) {
        await auth.protect();
      }
    });

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
