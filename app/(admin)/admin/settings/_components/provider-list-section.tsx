"use client";

import React, {useCallback} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {Info, Star, Trash2, Plus, CheckCircle} from "lucide-react";

type Provider = {
    id: string;
    name: string;
    channel: string;
    config: unknown;
    isDefault: boolean;
    createdAt: Date;
};

interface ProviderListSectionProps {
    providers: Provider[];
    isPending: boolean;
    onDelete: (id: string) => void;
    onSetDefault: (id: string) => void;
    onAddClick: () => void;
    success: string;
}

export const ProviderListSection = React.memo(function ProviderListSection({
    providers,
    isPending,
    onDelete,
    onSetDefault,
    onAddClick,
    success,
}: ProviderListSectionProps) {
    const providerConfig = useCallback((p: Provider) => p.config as Record<string, string>, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Email Providers</CardTitle>
                <CardDescription>
                    Configure your outgoing email service. Only admins can manage this.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {providers.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        No providers configured. Add one below before users can send campaigns.
                    </p>
                )}

                {providers.map((p) => {
                    const cfg = providerConfig(p);
                    return (
                        <div
                            key={p.id}
                            className="flex items-center justify-between rounded-lg border p-3"
                        >
                            <div className="flex items-center gap-3">
                                <div className="size-4 text-muted-foreground"/>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium">{p.name}</p>
                                        <Badge variant="outline" className="text-xs uppercase">
                                            {cfg.type}
                                        </Badge>
                                        {cfg.type === "ses" && (
                                            <Badge variant="secondary" className="text-xs">{cfg.region}</Badge>
                                        )}
                                        {p.isDefault && (
                                            <Badge className="text-xs">
                                                <Star className="size-2.5 mr-1"/>
                                                Default
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Added {new Date(p.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {!p.isDefault && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onSetDefault(p.id)}
                                        disabled={isPending}
                                    >
                                        Set Default
                                    </Button>
                                )}
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="ghost"
                                                className="text-destructive hover:text-destructive">
                                            <Trash2 className="size-4"/>
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete provider?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                <strong>{p.name}</strong> will be removed. Any campaigns using this
                                                provider will fail to send.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                className="bg-destructive text-white hover:bg-destructive/90"
                                                onClick={() => onDelete(p.id)}
                                            >
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    );
                })}

                {success && (
                    <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                        <CheckCircle className="size-4 text-green-600"/>
                        <AlertDescription className="text-green-700 dark:text-green-400 text-sm">
                            {success}
                        </AlertDescription>
                    </Alert>
                )}

                {providers.length > 0 && !providers.some(p => p.isDefault) && (
                    <Alert>
                        <Info className="size-4"/>
                        <AlertDescription className="text-sm">
                            No default provider set. Add or promote a provider to use for campaigns.
                        </AlertDescription>
                    </Alert>
                )}

                <Button variant="outline" size="sm" onClick={onAddClick}>
                    <Plus className="size-4"/>
                    Add Provider
                </Button>
            </CardContent>
        </Card>
    );
});
