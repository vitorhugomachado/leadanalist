import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/cargas/:path*",
    "/api/batches/:path*",
    "/api/dashboard/:path*",
  ],
};
