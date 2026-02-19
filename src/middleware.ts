import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  if (req.auth) {
    return NextResponse.next();
  }

  const callbackUrl = `${req.nextUrl.pathname}${req.nextUrl.search}`;
  const loginUrl = new URL("/login", req.nextUrl.origin);
  loginUrl.searchParams.set("callbackUrl", callbackUrl);

  return NextResponse.redirect(loginUrl);
});

export const config = {
  matcher: ["/quotes/:path*"],
};
