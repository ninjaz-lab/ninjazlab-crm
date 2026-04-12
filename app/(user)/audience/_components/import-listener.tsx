"use client";

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/utils/supabase/client";
import {toast} from "sonner";

export function ImportListener({userId}: { userId: string }) {
    const router = useRouter();
    const [supabase] = useState(() => createClient());

    useEffect(() => {
        // Only listen to the notification table for this specific user
        const channel = supabase
            .channel('realtime:notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notification',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    if (payload.new.type === "import_success") {
                        toast.success("Import finished! Updating table...");
                        router.refresh();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, router]);

    return null; // This component is invisible!
}