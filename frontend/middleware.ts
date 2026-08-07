import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Belt-and-suspenders: force-dynamic on individual pages already skips
// Next's Data Cache, but this makes sure the actual HTML document is never
// cached by the browser, Vercel's edge, or any CDN sitting in front of it.
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store, must-revalidate");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};