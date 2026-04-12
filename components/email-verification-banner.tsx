"use client";

import {useSession} from "@/lib/auth-client";
import {HugeIcon} from "@/components/huge-icon";

export function EmailVerificationBanner() {
    const {data: session, isPending} = useSession();

    // 1. Hide the banner while loading or if no user is found
    if (isPending || !session?.user)
        return null;

    // 2. Hide the banner if the user is already verified!
    if (session.user.emailVerified)
        return null;

    return (
        <div
            className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-center gap-3 text-sm font-medium text-amber-700 w-full z-50">
            <HugeIcon name="Alert02Icon" size={16} className="flex-shrink-0"/>
            <span>
                Please verify your email address (<strong>{session.user.email}</strong>) to unlock all platform features.
            </span>
            <button className="underline hover:text-amber-900 transition-colors ml-2 font-bold">
                Resend email
            </button>
        </div>
    );
}
