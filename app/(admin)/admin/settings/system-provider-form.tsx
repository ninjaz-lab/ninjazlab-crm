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

type Provider = {
    id: string;
    name: string;
    channel: string;
    config: unknown;
    isDefault: boolean;
    createdAt: Date;
};
type ProviderType = "ses" | "smtp" | "resend";

const SES_REGIONS = [
    {value: "us-east-1", label: "US East (N. Virginia)"},
    {value: "us-east-2", label: "US East (Ohio)"},
    {value: "us-west-1", label: "US West (N. California)"},
    {value: "us-west-2", label: "US West (Oregon)"},
    {value: "ap-southeast-1", label: "Asia Pacific (Singapore)"},
    {value: "ap-southeast-2", label: "Asia Pacific (Sydney)"},
    {value: "ap-northeast-1", label: "Asia Pacific (Tokyo)"},
    {value: "eu-west-1", label: "Europe (Ireland)"},
    {value: "eu-central-1", label: "Europe (Frankfurt)"},
    {value: "eu-west-2", label: "Europe (London)"},
    {value: "ca-central-1", label: "Canada (Central)"},
    {value: "sa-east-1", label: "South America (São Paulo)"},
];

export function SystemProviderForm({providers}: { providers: Provider[] }) {
    const [isPending, startTransition] = useTransition();
    const [adding, setAdding] = useState(false);
    const [success, setSuccess] = useState("");

    const [providerType, setProviderType] = useState<ProviderType>("ses");
    const [name, setName] = useState("");
    const [isDefault, setIsDefault] = useState(providers.length === 0);

    // SES
    const [sesRegion, setSesRegion] = useState("ap-southeast-1");
    const [sesAccessKeyId, setSesAccessKeyId] = useState("");
    const [sesSecretAccessKey, setSesSecretAccessKey] = useState("");

    // SMTP
    const [smtpHost, setSmtpHost] = useState("");
    const [smtpPort, setSmtpPort] = useState("587");
    const [smtpUser, setSmtpUser] = useState("");
    const [smtpPass, setSmtpPass] = useState("");

    // Resend
    const [resendApiKey, setResendApiKey] = useState("");

    function isValid() {
        if (!name) return false;
        if (providerType === "ses") return !!(sesAccessKeyId && sesSecretAccessKey);
        if (providerType === "smtp") return !!(smtpHost && smtpUser && smtpPass);
        if (providerType === "resend") return !!resendApiKey;
        return false;
    }

    function buildConfig(): Record<string, string> {
        if (providerType === "ses")
            return {type: "ses", region: sesRegion, accessKeyId: sesAccessKeyId, secretAccessKey: sesSecretAccessKey};
        if (providerType === "smtp")
            return {type: "smtp", host: smtpHost, port: smtpPort, user: smtpUser, pass: smtpPass};
        return {type: "resend", apiKey: resendApiKey};
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
            setSmtpHost("");
            setSmtpUser("");
            setSmtpPass("");
            setResendApiKey("");
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
                                <Select value={providerType} onValueChange={(v) => setProviderType(v as ProviderType)}>
                                    <SelectTrigger>
                                        <SelectValue/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ses">Amazon SES</SelectItem>
                                        <SelectItem value="smtp">SMTP</SelectItem>
                                        <SelectItem value="resend">Resend</SelectItem>
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
                        {providerType === "ses" && (
                            <div className="space-y-4">
                                <Alert>
                                    <AlertDescription className="text-xs">
                                        Create an IAM user with <strong>AmazonSESFullAccess</strong> and paste its
                                        credentials.
                                        Your sending domain must be verified in the SES console.
                                    </AlertDescription>
                                </Alert>
                                <div className="space-y-2">
                                    <Label>AWS Region</Label>
                                    <Select value={sesRegion} onValueChange={setSesRegion}>
                                        <SelectTrigger>
                                            <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SES_REGIONS.map((r) => (
                                                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Access Key ID</Label>
                                    <Input
                                        placeholder="AKIAIOSFODNN7EXAMPLE"
                                        value={sesAccessKeyId}
                                        onChange={(e) => setSesAccessKeyId(e.target.value)}
                                        autoComplete="off"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Secret Access Key</Label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••••••••••••••"
                                        value={sesSecretAccessKey}
                                        onChange={(e) => setSesSecretAccessKey(e.target.value)}
                                        autoComplete="new-password"
                                    />
                                </div>
                            </div>
                        )}

                        {/* SMTP */}
                        {providerType === "smtp" && (
                            <div className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="space-y-2 sm:col-span-2">
                                        <Label>SMTP Host</Label>
                                        <Input placeholder="smtp.yourdomain.com" value={smtpHost}
                                               onChange={(e) => setSmtpHost(e.target.value)}/>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Port</Label>
                                        <Select value={smtpPort} onValueChange={setSmtpPort}>
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="25">25</SelectItem>
                                                <SelectItem value="465">465 (SSL)</SelectItem>
                                                <SelectItem value="587">587 (TLS)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Username</Label>
                                        <Input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)}/>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Password</Label>
                                        <Input type="password" value={smtpPass}
                                               onChange={(e) => setSmtpPass(e.target.value)}/>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Resend */}
                        {providerType === "resend" && (
                            <div className="space-y-2">
                                <Label>API Key</Label>
                                <Input
                                    type="password"
                                    placeholder="re_xxxxxxxxxxxx"
                                    value={resendApiKey}
                                    onChange={(e) => setResendApiKey(e.target.value)}
                                />
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <input
                                id="isDefault"
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
