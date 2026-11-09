import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LAUNCH_GATE_ACTIVE } from "@/lib/launch-gate";

// Pre-launch lockdown. While the launch gate is active, every surface that
// could collect or display personal data, or let someone browse content
// we're not ready to show — account areas (job seeker dashboard, employer
// tools, admin), auth entry points, the contact page, and job browsing —
// redirects to "/", which renders the coming-soon notice directly (see
// app/page.tsx). This is the authoritative enforcement point: it runs
// before any page component, so it also closes these off for anyone who
// still holds a signed-in session from before the gate went up, not just
// for new visitors. Individual pages also check LAUNCH_GATE_ACTIVE
// themselves as defense-in-depth, but this matcher is what actually
// guarantees nothing here is reachable.
export function proxy(request: NextRequest) {
  if (!LAUNCH_GATE_ACTIVE) return NextResponse.next();
  const { pathname } = request.nextUrl;
  if (pathname === "/") return NextResponse.next();
  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/employer/:path*",
    "/admin/:path*",
    "/contact",
    "/jobs/:path*",
    "/about",
    "/employers",
    "/faq",
    "/sign-up",
    "/log-in",
    "/forgot-password",
    "/coming-soon",
  ],
};
