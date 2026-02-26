import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const authMiddleware = auth((req) => {
  if (req.auth) {
    return NextResponse.next();
  }

  const callbackUrl = `${req.nextUrl.pathname}${req.nextUrl.search}`;
  const loginUrl = new URL("/login", req.nextUrl.origin);
  loginUrl.searchParams.set("callbackUrl", callbackUrl);

  return NextResponse.redirect(loginUrl);
});

export default function middleware(req: NextRequest) {
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }
  return (authMiddleware as (req: NextRequest) => Response)(req);
}

export const config = {
  matcher: ["/quotes/:path*"],
};
