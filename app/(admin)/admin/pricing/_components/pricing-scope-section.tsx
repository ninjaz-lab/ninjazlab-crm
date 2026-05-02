"use client";

import React from "react";
import {HugeIcon} from "@/components/huge-icon";
import {cn} from "@/lib/utils/utils";
import {USER_ROLES} from "@/lib/enums";

interface PricingScopeSectionProps {
    scope: "default" | string;
    onScopeChange: (scope: "default" | string) => void;
    isEditing: boolean;
}

export const PricingScopeSection = React.memo(function PricingScopeSection({
    scope,
    onScopeChange,
    isEditing,
}: PricingScopeSectionProps) {
    return (
        <fieldset disabled={isEditing} className="space-y-2">
            <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Scope
            </legend>
            <div className="grid grid-cols-2 gap-2">
                {[
                    {
                        value: "default",
                        label: "Global Rate",
                        icon: "GlobalIcon",
                        desc: "Applies to all users"
                    },
                    {
                        value: USER_ROLES.USER,
                        label: "User Override",
                        icon: "UserIcon",
                        desc: "Applies to one user"
                    },
                ].map(({value, label, icon, desc}) => (
                    <button
                        key={value}
                        type="button"
                        onClick={() => onScopeChange(value)}
                        className={cn(
                            "relative flex items-center gap-3 rounded-lg border-2 px-3 py-3 text-left transition-all",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                            "disabled:pointer-events-none disabled:opacity-50",
                            scope === value
                                ? "border-primary bg-primary/5"
                                : "border-border bg-muted/30 hover:border-muted-foreground/40 hover:bg-muted/50"
                        )}
                    >
                        <div className={cn(
                            "flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center",
                            scope === value ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                            <HugeIcon name={icon as any} size={16}/>
                        </div>
                        <div className="min-w-0">
                            <p className={cn(
                                "text-xs font-semibold leading-none",
                                scope === value ? "text-primary" : "text-foreground"
                            )}>
                                {label}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-1 leading-none truncate">{desc}</p>
                        </div>
                        {scope === value && (
                            <div
                                className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                <HugeIcon name="Tick01Icon" size={10} className="text-primary-foreground"/>
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </fieldset>
    );
});
