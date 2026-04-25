import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";
import {getSessionCookie} from "better-auth/cookies";
import {USER_ROLES} from "@/lib/enums";
import {Routes} from "@/lib/constants/routes";

const publicRoutes = [Routes.LOGIN, Routes.REGISTER, "/api/auth", "/api/auth-redirect"];
const adminRoutes = [Routes.HOME_ADMIN];

export async function proxy(request: NextRequest) {
    const {pathname} = request.nextUrl;

    const isPublicRoute = publicRoutes.some((route) =>
        pathname.startsWith(route)
    );

    const sessionCookie = getSessionCookie(request);

    // Not authenticated — redirect to login unless on a public route
    if (!sessionCookie && !isPublicRoute)
        return NextResponse.redirect(new URL(Routes.LOGIN, request.url));

    // Already authenticated — skip auth pages, redirect admins to /admin
    if (sessionCookie && (pathname === Routes.LOGIN || pathname === Routes.REGISTER)) {
        try {
            const sessionRes = await fetch(
                new URL("/api/auth/get-session", request.url),
                {headers: {cookie: request.headers.get("cookie") ?? ""}}
            );
            const session = await sessionRes.json();

            if (!session || !session.user)
                return NextResponse.next();

            const dest = session?.user?.role === USER_ROLES.ADMIN
                ? Routes.HOME_ADMIN
                : Routes.HOME;
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
                return NextResponse.redirect(new URL(Routes.HOME_ADMIN, request.url));
        } catch {
            return NextResponse.redirect(new URL(Routes.LOGIN, request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
