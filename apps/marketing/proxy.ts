import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LAUNCH_GATE_ACTIVE } from "@/lib/launch-gate";

// Pre-launch lockdown. While the launch gate is active, every surface that
// could collect or display personal data — account areas (job seeker
// dashboard, employer tools, admin) and the contact page — redirects to
// /coming-soon. This closes them even for anyone who still holds a signed-in
// session from before the gate went up, not just for new visitors.
export function proxy(request: NextRequest) {
  if (!LAUNCH_GATE_ACTIVE) return NextResponse.next();
  return NextResponse.redirect(new URL("/coming-soon", request.url));
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/employer/:path*",
    "/admin/:path*",
    "/contact",
  ],
};
