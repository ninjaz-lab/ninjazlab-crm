import {redirect} from "next/navigation";
import {USER_ROLES} from "@/lib/enums";
import {authenticateUser} from "@/lib/actions/session";
import {Routes} from "@/lib/constants/routes";

export default async function AuthRedirect() {
    const session = await authenticateUser();

    if (session?.user?.role === USER_ROLES.ADMIN || session?.user?.role === USER_ROLES.SUPERADMIN)
        redirect(Routes.HOME_ADMIN);

    redirect(Routes.HOME);
}
