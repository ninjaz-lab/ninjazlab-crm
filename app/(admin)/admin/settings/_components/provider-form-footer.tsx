"use client";

import React from "react";
import {Button} from "@/components/ui/button";
import {Label} from "@/components/ui/label";

interface ProviderFormFooterProps {
    isDefault: boolean;
    onIsDefaultChange: (isDefault: boolean) => void;
    isPending: boolean;
    isValid: boolean;
    onCancel: () => void;
    onSave: () => void;
}

export const ProviderFormFooter = React.memo(function ProviderFormFooter({
    isDefault,
    onIsDefaultChange,
    isPending,
    isValid,
    onCancel,
    onSave,
}: ProviderFormFooterProps) {
    return (
        <>
            <div className="flex items-center gap-2">
                <input id="isDefault"
                       type="checkbox"
                       checked={isDefault}
                       onChange={(e) => onIsDefaultChange(e.target.checked)}
                       className="rounded"
                />
                <Label htmlFor="isDefault" className="cursor-pointer font-normal">
                    Set as default provider
                </Label>
            </div>

            <div className="flex gap-2">
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                <Button onClick={onSave} disabled={isPending || !isValid}>
                    {isPending ? "Saving..." : "Save Provider"}
                </Button>
            </div>
        </>
    );
});
