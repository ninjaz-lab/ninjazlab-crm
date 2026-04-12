"use client";

import {format} from "date-fns";
import {cn} from "@/lib/utils/utils";
import {formatAmount} from "@/lib/utils/transactions";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {HugeIcon} from "@/components/huge-icon";
import {USER_ROLES} from "@/lib/enums";

interface UserProfileTabProps {
    data: any;
    effectivePricing: any[];
    onRoleToggle: () => void;
    onBanToggle: () => void;
}

export function UserProfileTab({data, effectivePricing, onRoleToggle, onBanToggle}: UserProfileTabProps) {
    return (
        <div className="flex-1 overflow-y-auto min-h-0 space-y-4 custom-scrollbar pr-2 pb-6">
            <div className="grid grid-cols-2 gap-3 shrink-0">
                <div className="p-4 border-2 rounded-xl bg-background flex flex-col justify-center shadow-sm">
                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1 flex items-center gap-1.5">
                        <HugeIcon name="UserMultiple01Icon" size={12}/> Total Audience
                    </p>
                    <p className="text-2xl font-black">{data.stats.totalAudience?.toLocaleString() || "0"}</p>
                </div>
                <div className="p-4 border-2 rounded-xl bg-background flex flex-col justify-center shadow-sm">
                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1 flex items-center gap-1.5">
                        <HugeIcon name="Activity01Icon" size={12}/> Last Login
                    </p>
                    <p className="text-sm font-bold text-foreground">
                        {data.stats.lastLoginAt ? format(new Date(data.stats.lastLoginAt), "MMM d, yyyy HH:mm") : "Never / Unknown"}
                    </p>
                </div>
            </div>

            <div className="p-5 rounded-xl border-2 bg-background space-y-4 shrink-0 shadow-sm">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    Administrative Controls
                </h4>
                <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline"
                            className="h-9 font-bold text-xs gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all"
                            onClick={onRoleToggle}>
                        <HugeIcon name="ShieldWarning01Icon" size={16}/>
                        {data.profile.user.role === USER_ROLES.ADMIN ? 'Revoke Admin' : 'Make Admin'}
                    </Button>

                    {data.profile.user.banned ? (
                        <Button variant="outline"
                                className="h-9 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 font-bold text-xs gap-2 transition-all"
                                onClick={onBanToggle}>
                            <HugeIcon name="UserTick01Icon" size={16}/> Unban User
                        </Button>
                    ) : (
                        <Button variant="outline"
                                className="h-9 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 font-bold text-xs gap-2 transition-all"
                                onClick={onBanToggle}>
                            <HugeIcon name="UserBlock01Icon" size={16}/> Ban User
                        </Button>
                    )}
                </div>
            </div>

            <div className="p-5 rounded-xl border-2 bg-background space-y-4 shrink-0 shadow-sm">
                <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        Marketing Rates
                    </h4>
                </div>
                {effectivePricing?.length > 0 ? (
                    <div className="space-y-2">
                        {effectivePricing.map((rule: any, idx: number) => (
                            <div key={rule.id || idx}
                                 className="flex justify-between items-center p-3 rounded-lg border bg-muted/10 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold uppercase">
                                        {rule.module} <span
                                        className="text-muted-foreground font-medium lowercase ml-1">({rule.action})</span>
                                    </span>
                                    {rule.isOverride ? (
                                        <Badge
                                            className="text-[8px] h-4 px-1 uppercase bg-emerald-600 hover:bg-emerald-600 tracking-tighter">Custom</Badge>
                                    ) : (
                                        <Badge variant="secondary"
                                               className="text-[8px] h-4 px-1 uppercase text-muted-foreground tracking-tighter">Standard</Badge>
                                    )}
                                </div>
                                <div className="text-right flex items-center gap-2">
                                    {rule.isOverride && rule.originalPrice && (
                                        <span className="text-[9px] line-through text-muted-foreground">
                                             {formatAmount(rule.originalPrice)} MYR
                                        </span>
                                    )}
                                    <span
                                        className={cn("text-xs font-mono font-black", rule.isOverride ? "text-emerald-600" : "text-foreground")}>
                                            {formatAmount(rule.unitPrice)} MYR
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-4 text-center border-2 border-dashed rounded-lg bg-background/50">
                        <p className="text-xs text-muted-foreground font-bold">No system pricing configured.</p>
                    </div>
                )}
            </div>

            <section className="space-y-3 shrink-0">
                <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Client
                    Metadata</h4>
                <div className="text-sm font-medium bg-background p-5 rounded-xl border-2 shadow-sm space-y-4">
                    <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Source</p>
                        <Badge variant="secondary"
                               className="font-bold text-[10px]"
                        >
                            {data.profile.audience?.source || "Direct / System"}
                        </Badge>
                    </div>
                    <div className="pt-3 border-t border-muted/50">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Account
                            Created</p>
                        <p className="text-xs font-mono font-bold bg-muted/30 inline-flex px-2 py-1 rounded border shadow-sm">
                            {data.profile.user.createdAt
                                ? format(new Date(data.profile.user.createdAt), "PPP HH:mm:ss")
                                : "Unknown"
                            }
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}