import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  if (session?.user?.role === "admin") {
    return NextResponse.redirect(new URL("/admin", base));
  }
  return NextResponse.redirect(new URL("/dashboard", base));
}
