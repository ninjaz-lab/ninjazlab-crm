"use client";

import {format} from "date-fns";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {HugeIcon} from "@/components/huge-icon";
import {USER_ROLES} from "@/lib/enums";
import {formatAmount} from "@/lib/utils/amount";
import {cn} from "@/lib/utils/utils";

interface Props {
    data: any;
    effectivePricing: any[];
    onRoleToggle: () => void;
    onBanToggle: () => void;
}

export function UserTabProfile({data, effectivePricing, onRoleToggle, onBanToggle}: Props) {
    const isAdmin = data.profile.user.role === USER_ROLES.ADMIN;
    const isBanned = data.profile.user.banned;

    return (
        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 space-y-4 custom-scrollbar pb-8">

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border bg-card shadow-sm flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                        <HugeIcon name="UserGroupIcon" size={16}/>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest leading-none">Audience</p>
                        <p className="text-2xl font-black tracking-tight leading-none mt-1">
                            {data.stats.totalAudience?.toLocaleString() || "0"}
                        </p>
                    </div>
                </div>
                <div className="p-4 rounded-xl border bg-card shadow-sm flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-muted text-muted-foreground shrink-0">
                        <HugeIcon name="Activity01Icon" size={16}/>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest leading-none">
                            Last Login
                        </p>
                        <p className="text-xs font-bold leading-snug mt-1">
                            {data.stats.lastLoginAt
                                ? format(new Date(data.stats.lastLoginAt), "MMM d, yyyy HH:mm")
                                : "Never"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Admin Controls */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 border-b bg-muted/30 flex items-center gap-2">
                    <HugeIcon name="Settings02Icon" size={11} className="text-muted-foreground"/>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Administrative Controls
                    </h4>
                </div>
                <div className="p-4 grid grid-cols-2 gap-2">
                    <Button className={cn("h-9 font-bold text-xs gap-2 transition-all",
                        isAdmin
                            ? "bg-rose-600 hover:bg-rose-700"
                            : "bg-primary hover:bg-primary/90"
                    )}
                            onClick={onRoleToggle}
                    >
                        <HugeIcon name="Shield01Icon" size={14}/>
                        {isAdmin ? "Revoke Admin" : "Make Admin"}
                    </Button>
                    <Button className={cn("h-9 font-bold text-xs gap-2 transition-all",
                        isBanned
                            ? "bg-emerald-600 hover:bg-emerald-700"
                            : "bg-rose-600 hover:bg-rose-700"
                    )}
                            onClick={onBanToggle}
                    >
                        <HugeIcon name={isBanned ? "UserCheck01Icon" : "UserBlock01Icon"} size={14}/>
                        {isBanned ? "Unban User" : "Ban User"}
                    </Button>
                </div>
            </div>

            {/* Pricing Rules */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 border-b bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <HugeIcon name="Tag01Icon" size={11} className="text-muted-foreground"/>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Marketing Rates
                        </h4>
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                        {effectivePricing?.length || 0} rules
                    </span>
                </div>
                <div className="p-3 space-y-1.5">
                    {effectivePricing?.length > 0 ? (
                        effectivePricing.map((rule: any, idx: number) => (
                            <div key={rule.id || idx}
                                 className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-xs font-black uppercase tracking-tight">{rule.module}</span>
                                    <span className="text-[10px] text-muted-foreground shrink-0">{rule.action}</span>
                                    <Badge variant={rule.isOverride ? "default" : "secondary"}
                                           className={cn("text-[8px] h-4 px-1.5 shrink-0 font-black",
                                               rule.isOverride && "bg-emerald-600 hover:bg-emerald-600"
                                           )}
                                    >
                                        {rule.isOverride ? "Custom" : "Default"}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {rule.isOverride && rule.originalPrice && (
                                        <span className="text-[9px] line-through text-muted-foreground font-mono">
                                            {formatAmount(rule.originalPrice)}
                                        </span>
                                    )}
                                    <span
                                        className={cn("text-xs font-mono font-black", rule.isOverride ? "text-emerald-600" : "text-foreground")}>
                                        {formatAmount(rule.unitPrice)}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-6 text-center border border-dashed rounded-lg">
                            <p className="text-xs text-muted-foreground font-bold">No pricing configured</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Client Metadata */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 border-b bg-muted/30 flex items-center gap-2">
                    <HugeIcon name="InformationCircleIcon" size={11} className="text-muted-foreground"/>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Client Metadata
                    </h4>
                </div>
                <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span
                            className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Source</span>
                        <Badge variant="secondary" className="font-bold text-[10px]">
                            {data.profile.audience?.source || "Direct / System"}
                        </Badge>
                    </div>
                    <div className="border-t pt-3 flex items-center justify-between">
                        <span
                            className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Created</span>
                        <span className="text-[10px] font-mono font-bold">
                            {data.profile.user.createdAt
                                ? format(new Date(data.profile.user.createdAt), "PPP HH:mm")
                                : "Unknown"}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}