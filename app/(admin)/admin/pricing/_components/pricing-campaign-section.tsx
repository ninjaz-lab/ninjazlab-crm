"use client";

import React from "react";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Label} from "@/components/ui/label";
import {TRANSACTION_CAMPAIGN, TRANSACTION_MODULE_LABELS} from "@/lib/enums";

interface PricingCampaignSectionProps {
    campaign: string;
    onCampaignChange: (campaign: string) => void;
    isEditing: boolean;
}

export const PricingCampaignSection = React.memo(function PricingCampaignSection({
    campaign,
    onCampaignChange,
    isEditing,
}: PricingCampaignSectionProps) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Campaign</Label>
            <Select value={campaign} onValueChange={onCampaignChange} disabled={isEditing}>
                <SelectTrigger className="h-9 text-sm font-medium">
                    <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                    {Object.values(TRANSACTION_CAMPAIGN)
                        .filter((m) => m !== TRANSACTION_CAMPAIGN.SYSTEM)
                        .map((m) => (
                            <SelectItem key={m} value={m} className="text-sm font-medium">
                                {TRANSACTION_MODULE_LABELS[m] || m}
                            </SelectItem>
                        ))}
                </SelectContent>
            </Select>
        </div>
    );
});
