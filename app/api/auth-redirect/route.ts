import {NextResponse} from "next/server";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {USER_ROLES} from "@/lib/enums";

export async function GET() {
    const session = await auth.api.getSession({headers: await headers()});
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    if (session?.user?.role === USER_ROLES.ADMIN)
        return NextResponse.redirect(new URL("/admin", base));

    return NextResponse.redirect(new URL("/dashboard", base));
}
