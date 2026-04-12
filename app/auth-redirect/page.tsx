import {redirect} from "next/navigation";
import {USER_ROLES} from "@/lib/enums";
import {authenticateUser} from "@/lib/actions/session";

export default async function AuthRedirect() {
    const session = await authenticateUser();

    if (session?.user?.role === USER_ROLES.ADMIN)
        redirect("/admin");

    redirect("/");
}
