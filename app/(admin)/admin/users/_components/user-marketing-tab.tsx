"use client";

import {Badge} from "@/components/ui/badge";

export function UserMarketingTab({campaigns}: { campaigns: any[] }) {
    return (
        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar pr-2 pb-6">
            <div className="space-y-3">
                {campaigns?.length === 0 ? (
                    <div className="py-10 text-center border-2 border-dashed rounded-xl bg-background/50">
                        <p className="text-xs text-muted-foreground font-bold">No active marketing events.</p>
                    </div>
                ) : campaigns?.map((cp: any) => (
                    <div key={cp.id}
                         className="p-4 border-2 rounded-xl bg-background flex justify-between items-center shadow-sm hover:border-muted-foreground/20 transition-colors">
                        <div>
                            <p className="text-sm font-bold">{cp.name}</p>
                            <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">{cp.channel}</p>
                        </div>
                        <Badge variant="secondary" className="uppercase font-black text-[10px]">{cp.status}</Badge>
                    </div>
                ))}
            </div>
        </div>
    );
}
