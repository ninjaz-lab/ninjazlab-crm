import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {USER_ROLES} from "@/lib/enums";

export async function authenticateAdmin() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || (session.user.role !== USER_ROLES.ADMIN && session.user.role !== USER_ROLES.SUPERADMIN)) throw new Error("Unauthorized");

    return session;
}

export async function authenticateUser() {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session || !session?.user?.id) throw new Error("Unauthorized");

    return session;
}
