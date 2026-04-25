"use client";

import {useState, useTransition} from "react";
import {
    createMarketingProvider,
    deleteMarketingProvider,
    setMarketingProvider,
} from "@/lib/actions/admin/marketing-provider";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Separator} from "@/components/ui/separator";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
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
import {CheckCircle, Info, Plus, Star, Trash2, Zap} from "lucide-react";
import {SES_REGIONS} from "@/lib/config/aws";

type Provider = {
    id: string;
    name: string;
    channel: string;
    config: unknown;
    isDefault: boolean;
    createdAt: Date;
};
type ProviderType = "ses";

export function SystemProviderForm({providers}: { providers: Provider[] }) {
    const [isPending, startTransition] = useTransition();
    const [adding, setAdding] = useState(false);
    const [success, setSuccess] = useState("");

    const [providerType, setProviderType] = useState<ProviderType>("ses");
    const [name, setName] = useState("");
    const [isDefault, setIsDefault] = useState(providers.length === 0);

    // SES Config
    const [sesRegion, setSesRegion] = useState("ap-southeast-1");
    const [sesAccessKeyId, setSesAccessKeyId] = useState("");
    const [sesSecretAccessKey, setSesSecretAccessKey] = useState("");

    function isValid() {
        return !!(name && sesAccessKeyId && sesSecretAccessKey);
    }

    function buildConfig(): Record<string, string> {
        return {
            type: "ses",
            region: sesRegion,
            accessKeyId: sesAccessKeyId,
            secretAccessKey: sesSecretAccessKey
        };
    }

    function handleSave() {
        startTransition(async () => {
            await createMarketingProvider({
                channel: "email",
                name,
                type: providerType,
                config: buildConfig(),
                isDefault,
            });
            setAdding(false);
            setSuccess("Provider saved. All email campaigns will now use this provider.");
            setTimeout(() => setSuccess(""), 4000);

            // reset
            setName("");
            setSesAccessKeyId("");
            setSesSecretAccessKey("");
        });
    }

    function handleDelete(id: string) {
        startTransition(async () => {
            await deleteMarketingProvider(id);
        });
    }

    function handleSetDefault(id: string) {
        startTransition(async () => {
            await setMarketingProvider(id, "email");
            setSuccess("Default provider updated.");
            setTimeout(() => setSuccess(""), 3000);
        });
    }

    const providerConfig = (p: Provider) => p.config as Record<string, string>;

    return (
        <div className="space-y-6">
            <Alert>
                <Info className="size-4"/>
                <AlertDescription className="text-sm">
                    These providers are <strong>system-wide</strong>. Users cannot see or change them.
                    The <strong>default</strong> provider is used for all outgoing campaigns.
                </AlertDescription>
            </Alert>

            {/* Provider list */}
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
                                    <Zap className="size-4 text-muted-foreground"/>
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
                                            onClick={() => handleSetDefault(p.id)}
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
                                                    onClick={() => handleDelete(p.id)}
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

                    {!adding && (
                        <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
                            <Plus className="size-4"/>
                            Add Provider
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Add form */}
            {adding && (
                <Card>
                    <CardHeader>
                        <CardTitle>New Provider</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Provider Type</Label>
                                <Select value={providerType} onValueChange={(v) => setProviderType(v as ProviderType)}
                                        disabled>
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
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>

                        <Separator/>

                        {/* SES */}
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
                                <Select value={sesRegion} onValueChange={setSesRegion}>
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
                                       onChange={(e) => setSesAccessKeyId(e.target.value)}
                                       autoComplete="off"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Secret Access Key</Label>
                                <Input type="password"
                                       placeholder="••••••••••••••••••••"
                                       value={sesSecretAccessKey}
                                       onChange={(e) => setSesSecretAccessKey(e.target.value)}
                                       autoComplete="new-password"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input id="isDefault"
                                   type="checkbox"
                                   checked={isDefault}
                                   onChange={(e) => setIsDefault(e.target.checked)}
                                   className="rounded"
                            />
                            <Label htmlFor="isDefault" className="cursor-pointer font-normal">
                                Set as default provider
                            </Label>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
                            <Button onClick={handleSave} disabled={isPending || !isValid()}>
                                {isPending ? "Saving..." : "Save Provider"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}