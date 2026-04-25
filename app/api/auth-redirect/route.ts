import {NextResponse} from "next/server";
import {USER_ROLES} from "@/lib/enums";
import {authenticateUser} from "@/lib/actions/session";
import {Routes} from "@/lib/constants/routes";

export async function GET() {
    const session = await authenticateUser();
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    if (session?.user?.role === USER_ROLES.ADMIN)
        return NextResponse.redirect(new URL(Routes.HOME_ADMIN, base));

    return NextResponse.redirect(new URL(Routes.HOME, base));
}
