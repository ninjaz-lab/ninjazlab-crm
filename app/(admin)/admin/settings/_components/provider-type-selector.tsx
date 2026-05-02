"use client";

import React from "react";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";

type ProviderType = "ses";

interface ProviderTypeSelectorProps {
    providerType: ProviderType;
    onProviderTypeChange: (type: ProviderType) => void;
    name: string;
    onNameChange: (name: string) => void;
}

export const ProviderTypeSelector = React.memo(function ProviderTypeSelector({
    providerType,
    onProviderTypeChange,
    name,
    onNameChange,
}: ProviderTypeSelectorProps) {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
                <Label>Provider Type</Label>
                <Select value={providerType} onValueChange={(v) => onProviderTypeChange(v as ProviderType)} disabled>
                    <SelectTrigger>
                        <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ses">Amazon SES</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Label</Label>
                <Input
                    placeholder="e.g. Production SES"
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                />
            </div>
        </div>
    );
});
