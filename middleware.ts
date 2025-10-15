import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") || "";
  const isMobile =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      userAgent
    );

  const pathname = request.nextUrl.pathname;

  // Don't redirect API routes, static files, or Next.js internals
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // Redirect mobile users to /mobile if they're not already there
  if (isMobile && !pathname.startsWith("/mobile")) {
    const url = request.nextUrl.clone();
    url.pathname = "/mobile";
    return NextResponse.redirect(url);
  }

  // Redirect desktop users away from /mobile
  if (!isMobile && pathname.startsWith("/mobile")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, fonts, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).+)",
  ],
};

