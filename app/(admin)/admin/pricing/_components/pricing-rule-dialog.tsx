"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {HugeIcon} from "@/components/huge-icon";
import {PricingScopeSection} from "./pricing-scope-section";
import {PricingCampaignSection} from "./pricing-campaign-section";
import {PricingUserSection} from "./pricing-user-section";
import {PricingPricingSection} from "./pricing-pricing-section";
import {USER_ROLES} from "@/lib/enums";
import {cn} from "@/lib/utils/utils";

interface User {
    id: string;
    name: string;
    email: string;
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isEditing: boolean;
    isPending: boolean;
    scope: "default" | string;
    onScopeChange: (scope: "default" | string) => void;
    selectedUserId: string;
    onUserChange: (userId: string) => void;
    campaign: string;
    onCampaignChange: (campaign: string) => void;
    unitPrice: string;
    onPriceChange: (price: string) => void;
    effectiveFrom: string;
    onEffectiveFromChange: (date: string) => void;
    note: string;
    onNoteChange: (note: string) => void;
    error: string;
    onSave: () => void;
    onCancel: () => void;
    users: User[];
    comboboxOpen: boolean;
    onComboboxOpenChange: (open: boolean) => void;
}

export function PricingRuleDialog({
    open, onOpenChange,
    isEditing,
    isPending,
    scope, onScopeChange,
    selectedUserId,
    onUserChange,
    campaign, onCampaignChange,
    unitPrice, onPriceChange,
    effectiveFrom, onEffectiveFromChange,
    note, onNoteChange,
    error,
    onSave,
    onCancel,
    users,
    comboboxOpen,
    onComboboxOpenChange,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl p-0 overflow-hidden gap-0">
                <DialogHeader className="px-6 pt-6 pb-5 border-b">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <HugeIcon name="ArrowUpRight01Icon" size={18} className="text-primary"/>
                        </div>
                        <div>
                            <DialogTitle className="text-base font-semibold">
                                {isEditing ? "Edit Pricing Rule" : "New Pricing Rule"}
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                                {isEditing
                                    ? "Update the rate, date, or notes for this rule."
                                    : "Set a billing rate for a campaign and scope."}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
                    <PricingScopeSection scope={scope} onScopeChange={onScopeChange} isEditing={isEditing}/>

                    <div className={cn("grid gap-4", scope === USER_ROLES.USER ? "grid-cols-2" : "grid-cols-1")}>
                        <PricingCampaignSection campaign={campaign} onCampaignChange={onCampaignChange}
                                                isEditing={isEditing}/>
                        <PricingUserSection scope={scope} selectedUserId={selectedUserId}
                                            onUserChange={onUserChange} users={users}
                                            comboboxOpen={comboboxOpen}
                                            onComboboxOpenChange={onComboboxOpenChange}
                                            isEditing={isEditing}/>
                    </div>

                    <PricingPricingSection unitPrice={unitPrice} onPriceChange={onPriceChange}
                                           effectiveFrom={effectiveFrom}
                                           onEffectiveFromChange={onEffectiveFromChange}
                                           note={note} onNoteChange={onNoteChange}/>

                    {error && (
                        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2.5">
                            <HugeIcon name="InformationCircleIcon" size={14}
                                      className="mt-0.5 flex-shrink-0 text-destructive"/>
                            <p className="text-xs font-medium text-destructive leading-snug">{error}</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-muted/10 flex-row justify-end gap-2">
                    <Button variant="ghost" size="lg" onClick={onCancel} className="font-medium">
                        Cancel
                    </Button>
                    <Button size="lg" onClick={onSave} disabled={isPending} className="font-semibold min-w-[110px]">
                        {isPending
                            ? <><HugeIcon name="Loading03Icon" size={14} className="mr-1.5 animate-spin"/> Saving…</>
                            : isEditing ? "Save Changes" : "Create"
                        }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}