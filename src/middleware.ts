import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.png|favicon\\.ico|api/auth|Group 30\\.png|Group 30\\.svg|public).*)"],
};
