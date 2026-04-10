import {redirect} from "next/navigation";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {USER_ROLES} from "@/lib/enums";

export default async function AuthRedirect() {
    const session = await auth.api.getSession({headers: await headers()});

    if (session?.user?.role === USER_ROLES.ADMIN)
        redirect("/admin");

    redirect("/dashboard");
}
