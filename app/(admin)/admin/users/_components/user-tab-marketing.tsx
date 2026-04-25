"use client";

import {Badge} from "@/components/ui/badge";
import {HugeIcon} from "@/components/huge-icon";
import {cn} from "@/lib/utils/utils";

const STATUS_STYLES: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700 border-emerald-200",
    paused: "bg-amber-100 text-amber-700 border-amber-200",
    completed: "bg-muted text-muted-foreground border-border",
    draft: "bg-blue-50 text-blue-600 border-blue-100",
};

export function UserTabMarketing({campaigns}: { campaigns: any[] }) {
    if (!campaigns?.length) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center pb-10 text-center">
                <div className="size-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                    <HugeIcon name="Calendar01Icon" size={22} className="text-muted-foreground/40"/>
                </div>
                <p className="text-sm font-bold text-muted-foreground">No active events</p>
                <p className="text-[11px] text-muted-foreground/60 mt-1">This user has no ongoing marketing campaigns</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar pb-6">
            <div className="space-y-2">
                {campaigns.map((cp: any) => (
                    <div key={cp.id}
                         className="flex items-center gap-3 p-4 rounded-xl border bg-card shadow-sm hover:border-muted-foreground/20 transition-colors">
                        <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <HugeIcon name="Megaphone01Icon" size={16} className="text-primary"/>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold leading-none truncate">{cp.name}</p>
                            <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mt-0.5">{cp.channel}</p>
                        </div>
                        <Badge
                            variant="outline"
                            className={cn("uppercase font-black text-[9px] h-5 px-2 shrink-0",
                                STATUS_STYLES[cp.status?.toLowerCase()] || ""
                            )}
                        >
                            {cp.status}
                        </Badge>
                    </div>
                ))}
            </div>
        </div>
    );
}
