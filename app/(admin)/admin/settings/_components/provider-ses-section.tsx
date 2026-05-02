"use client";

import React, {useCallback} from "react";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {Separator} from "@/components/ui/separator";
import {SES_REGIONS} from "@/lib/config/aws";

interface ProviderSesSectionProps {
    sesRegion: string;
    onSesRegionChange: (region: string) => void;
    sesAccessKeyId: string;
    onSesAccessKeyIdChange: (keyId: string) => void;
    sesSecretAccessKey: string;
    onSesSecretAccessKeyChange: (key: string) => void;
}

export const ProviderSesSection = React.memo(function ProviderSesSection({
    sesRegion,
    onSesRegionChange,
    sesAccessKeyId,
    onSesAccessKeyIdChange,
    sesSecretAccessKey,
    onSesSecretAccessKeyChange,
}: ProviderSesSectionProps) {
    return (
        <>
            <Separator/>

            <div className="space-y-4">
                <Alert>
                    <AlertDescription className="text-xs">
                        Create an IAM user with <strong>AmazonSESFullAccess</strong> and paste its
                        credentials.
                        Your sending domain must be verified in the SES console.
                    </AlertDescription>
                </Alert>
                <div className="space-y-2">
                    <Label className="text-xs font-bold">AWS Region</Label>
                    <Select value={sesRegion} onValueChange={onSesRegionChange}>
                        <SelectTrigger className="font-bold bg-muted/20 border-none h-11">
                            <SelectValue placeholder="Select AWS Region"/>
                        </SelectTrigger>
                        <SelectContent className="h-[300px]">
                            {SES_REGIONS.map((region) => (
                                <SelectItem key={region.value}
                                            value={region.value}
                                            className="font-medium">
                                    {region.label} - {region.value}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Access Key ID</Label>
                    <Input placeholder="AKIAIOSFODNN7EXAMPLE"
                           value={sesAccessKeyId}
                           onChange={(e) => onSesAccessKeyIdChange(e.target.value)}
                           autoComplete="off"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Secret Access Key</Label>
                    <Input type="password"
                           placeholder="••••••••••••••••••••"
                           value={sesSecretAccessKey}
                           onChange={(e) => onSesSecretAccessKeyChange(e.target.value)}
                           autoComplete="new-password"
                    />
                </div>
            </div>
        </>
    );
});
