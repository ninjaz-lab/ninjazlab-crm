import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";
import {getSessionCookie} from "better-auth/cookies";
import {USER_ROLES} from "@/lib/enums";

const publicRoutes = ["/login", "/register", "/api/auth", "/api/auth-redirect"];
const adminRoutes = ["/admin"];

export async function proxy(request: NextRequest) {
    const {pathname} = request.nextUrl;

    const isPublicRoute = publicRoutes.some((route) =>
        pathname.startsWith(route)
    );

    const sessionCookie = getSessionCookie(request);

    // Not authenticated — redirect to login unless on a public route
    if (!sessionCookie && !isPublicRoute)
        return NextResponse.redirect(new URL("/login", request.url));

    // Already authenticated — skip auth pages, redirect admins to /admin
    if (sessionCookie && (pathname === "/login" || pathname === "/register")) {
        try {
            const sessionRes = await fetch(
                new URL("/api/auth/get-session", request.url),
                {headers: {cookie: request.headers.get("cookie") ?? ""}}
            );
            const session = await sessionRes.json();

            if (!session || !session.user)
                return NextResponse.next();

            const dest = session?.user?.role === USER_ROLES.ADMIN
                ? "/admin/accounts"
                : "/";
            return NextResponse.redirect(new URL(dest, request.url));
        } catch {
            return NextResponse.next();
        }
    }

    // Admin route guard — fetch session to read role
    const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
    if (isAdminRoute && sessionCookie) {
        try {
            const sessionRes = await fetch(
                new URL("/api/auth/get-session", request.url),
                {
                    headers: {cookie: request.headers.get("cookie") ?? ""},
                }
            );
            const session = await sessionRes.json();
            if (session?.user?.role !== USER_ROLES.ADMIN)
                return NextResponse.redirect(new URL("/", request.url));
        } catch {
            return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
