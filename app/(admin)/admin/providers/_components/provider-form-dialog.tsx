"use client";

import {useEffect, useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Separator} from "@/components/ui/separator";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from "@/components/ui/dialog";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command";
import {USER_ROLES} from "@/lib/enums";
import {cn} from "@/lib/utils/utils";
import {HugeIcon} from "@/components/huge-icon";
import {createProviderConfig, updateProviderConfig} from "@/lib/actions/admin/providers";
import {SES_REGIONS} from "@/lib/config/aws";
import {ProviderConfig} from "./provider-dashboard";

// ── Types ──────────────────────────────────────────────────────────────────────

type EmailProviderType = "ses" | "smtp" | "resend";
type SmsProviderType = "macrokiosk";
type ProviderType = EmailProviderType | SmsProviderType;
type Channel = "email" | "sms";

const EMAIL_PROVIDERS: { value: EmailProviderType; label: string; icon: string; description: string }[] = [
    {value: "ses", label: "Amazon SES", icon: "CloudIcon", description: "AWS email delivery"},
    {value: "smtp", label: "SMTP", icon: "ServerIcon", description: "Generic mail server"},
    {value: "resend", label: "Resend", icon: "Send01Icon", description: "Resend.com API"},
];

const SMS_PROVIDERS: { value: SmsProviderType; label: string; icon: string; description: string }[] = [
    {value: "macrokiosk", label: "MacroKiosk", icon: "SmartPhone01Icon", description: "SMS gateway"},
];

const CHANNEL_TO_DEFAULT: Record<Channel, ProviderType> = {
    email: "ses",
    sms: "macrokiosk",
};

// ── Zod schemas ────────────────────────────────────────────────────────────────

const scopeFields = {
    scope: z.enum(["default", USER_ROLES.USER]),
    userId: z.string().optional(),
};

const scopeRefine = (data: { scope: string; userId?: string }, ctx: z.RefinementCtx) => {
    if (data.scope === USER_ROLES.USER && !data.userId) {
        ctx.addIssue({code: z.ZodIssueCode.custom, message: "Please select a target account.", path: ["userId"]});
    }
};

const sesSchema = z.object({...scopeFields, providerType: z.literal("ses"), region: z.string().min(1, "Region is required."), accessKeyId: z.string().min(1, "Access Key ID is required."), secretAccessKey: z.string().min(1, "Secret Access Key is required.")}).superRefine(scopeRefine);
const smtpSchema = z.object({...scopeFields, providerType: z.literal("smtp"), host: z.string().min(1, "Host is required."), port: z.string().min(1, "Port is required."), smtpUser: z.string().min(1, "Username is required."), smtpPass: z.string().min(1, "Password is required.")}).superRefine(scopeRefine);
const resendSchema = z.object({...scopeFields, providerType: z.literal("resend"), apiKey: z.string().min(1, "API Key is required.")}).superRefine(scopeRefine);
const macrokioskSchema = z.object({...scopeFields, providerType: z.literal("macrokiosk"), mkUser: z.string().min(1, "Username is required."), mkPassword: z.string().min(1, "Password is required.")}).superRefine(scopeRefine);

const providerSchema = z.discriminatedUnion("providerType", [sesSchema, smtpSchema, resendSchema, macrokioskSchema]);
type ProviderFormValues = z.infer<typeof providerSchema>;
type DbUser = { id: string; name: string; email: string };

// ── Helpers ────────────────────────────────────────────────────────────────────

function channelOf(pt: ProviderType): Channel {
    return pt === "macrokiosk" ? "sms" : "email";
}

function providerLabel(pt: ProviderType) {
    return [...EMAIL_PROVIDERS, ...SMS_PROVIDERS].find(p => p.value === pt)?.label ?? pt;
}

function buildConfig(data: ProviderFormValues): Record<string, string> {
    switch (data.providerType) {
        case "ses":        return {type: "ses", region: data.region, accessKeyId: data.accessKeyId, secretAccessKey: data.secretAccessKey};
        case "smtp":       return {type: "smtp", host: data.host, port: data.port, user: data.smtpUser, pass: data.smtpPass};
        case "resend":     return {type: "resend", apiKey: data.apiKey};
        case "macrokiosk": return {type: "macrokiosk", user: data.mkUser, password: data.mkPassword};
    }
}

function makeDefaults(pt: ProviderType, scope = "default", userId = ""): ProviderFormValues {
    const base = {scope: scope as "default", userId};
    switch (pt) {
        case "ses":        return {...base, providerType: "ses", region: "ap-southeast-1", accessKeyId: "", secretAccessKey: ""};
        case "smtp":       return {...base, providerType: "smtp", host: "", port: "587", smtpUser: "", smtpPass: ""};
        case "resend":     return {...base, providerType: "resend", apiKey: ""};
        case "macrokiosk": return {...base, providerType: "macrokiosk", mkUser: "", mkPassword: ""};
    }
}

function valuesFromEdit(p: ProviderConfig): ProviderFormValues {
    const c = p.config || {};
    const scope = p.userId ? USER_ROLES.USER : "default";
    const userId = p.userId || "";
    const pt: ProviderType = c.type ?? "ses";
    switch (pt) {
        case "ses":        return {scope, userId, providerType: "ses", region: c.region || "ap-southeast-1", accessKeyId: c.accessKeyId || "", secretAccessKey: c.secretAccessKey || ""};
        case "smtp":       return {scope, userId, providerType: "smtp", host: c.host || "", port: c.port || "587", smtpUser: c.user || "", smtpPass: c.pass || ""};
        case "resend":     return {scope, userId, providerType: "resend", apiKey: c.apiKey || ""};
        case "macrokiosk": return {scope, userId, providerType: "macrokiosk", mkUser: c.user || "", mkPassword: c.password || ""};
        default:           return makeDefaults("ses", scope, userId);
    }
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function FieldRow({label, icon, children}: { label: string; icon: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                <HugeIcon name={icon as any} size={12}/>
                {label}
            </Label>
            {children}
        </div>
    );
}

function ProviderNavItem({
    opt,
    selected,
    disabled,
    onClick,
}: {
    opt: { value: string; label: string; icon: string; description: string };
    selected: boolean;
    disabled?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all group",
                selected
                    ? "bg-primary/8 text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                disabled && "pointer-events-none opacity-50"
            )}
        >
            <div className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-md border transition-colors",
                selected ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-muted/30 group-hover:border-border/80"
            )}>
                <HugeIcon name={opt.icon as any} size={13}/>
            </div>
            <div className="min-w-0">
                <p className={cn("text-xs font-semibold leading-tight truncate", selected ? "text-foreground" : "")}>{opt.label}</p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 truncate">{opt.description}</p>
            </div>
            {selected && <div className="ml-auto shrink-0 w-1 h-5 rounded-full bg-primary"/>}
        </button>
    );
}

// ── Main dialog ────────────────────────────────────────────────────────────────

export function ProviderFormDialog({
    open,
    onOpenChange,
    editingProvider,
    users,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingProvider: ProviderConfig | null;
    users: DbUser[];
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [activeTab, setActiveTab] = useState<Channel>("email");

    const form = useForm<ProviderFormValues>({
        resolver: zodResolver(providerSchema),
        defaultValues: makeDefaults("ses"),
    });

    const {register, handleSubmit, watch, setValue, reset, formState: {errors}} = form;
    const scope = watch("scope");
    const providerType = watch("providerType") as ProviderType;
    const selectedUserId = watch("userId");
    const region = watch("region" as any) ?? "ap-southeast-1";
    const firstErrorMessage = Object.values(errors)[0]?.message as string | undefined;

    useEffect(() => {
        if (!open) return;
        if (editingProvider) {
            const vals = valuesFromEdit(editingProvider);
            reset(vals);
            setActiveTab(channelOf(vals.providerType));
        } else {
            reset(makeDefaults(CHANNEL_TO_DEFAULT[activeTab]));
        }
    }, [open, editingProvider]); // eslint-disable-line react-hooks/exhaustive-deps

    function handleTabChange(tab: string) {
        if (editingProvider) return;
        const ch = tab as Channel;
        setActiveTab(ch);
        reset(makeDefaults(CHANNEL_TO_DEFAULT[ch]));
    }

    function handleProviderChange(pt: ProviderType) {
        if (editingProvider) return;
        const {scope: s, userId: u} = form.getValues();
        reset(makeDefaults(pt, s, u));
    }

    const onSubmit = (data: ProviderFormValues) => {
        startTransition(async () => {
            try {
                const payload = {
                    userId: data.scope === USER_ROLES.USER ? data.userId || null : null,
                    channel: channelOf(data.providerType),
                    name: providerLabel(data.providerType),
                    config: buildConfig(data),
                };
                if (editingProvider) {
                    await updateProviderConfig(editingProvider.id, payload);
                    toast.success("Provider updated successfully");
                } else {
                    await createProviderConfig(payload);
                    toast.success("Provider created successfully");
                }
                onOpenChange(false);
                router.refresh();
            } catch (err: any) {
                toast.error(err.message || "Failed to save provider");
            }
        });
    };

    const activeProviders = activeTab === "email" ? EMAIL_PROVIDERS : SMS_PROVIDERS;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] p-0 gap-0">

                {/* Header */}
                <DialogHeader className="px-6 pt-5 pb-4 border-b">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <DialogTitle className="text-base font-semibold">
                                {editingProvider ? "Edit Provider" : "New Provider"}
                            </DialogTitle>
                            <DialogDescription className="text-xs mt-0.5">
                                Configure delivery credentials for a system or tenant provider.
                            </DialogDescription>
                        </div>

                        {/* Scope toggle — top right */}
                        <div className={cn("flex rounded-lg border overflow-hidden shrink-0", editingProvider && "opacity-50 pointer-events-none")}>
                            {[
                                {value: "default", icon: "GlobalIcon", label: "Global"},
                                {value: USER_ROLES.USER, icon: "UserIcon", label: "Tenant"},
                            ].map((opt, i) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    disabled={!!editingProvider}
                                    onClick={() => setValue("scope", opt.value as any)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                                        i > 0 && "border-l",
                                        scope === opt.value
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <HugeIcon name={opt.icon as any} size={12}/>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Tabs value={activeTab} onValueChange={handleTabChange}>

                        {/* Channel tabs */}
                        <div className="px-6 pt-4">
                            <TabsList className={cn("h-8 w-auto", editingProvider && "pointer-events-none opacity-60")}>
                                <TabsTrigger value="email" className="text-xs px-4 gap-1.5 h-7">
                                    <HugeIcon name="Mail01Icon" size={12}/>
                                    Email
                                </TabsTrigger>
                                <TabsTrigger value="sms" className="text-xs px-4 gap-1.5 h-7">
                                    <HugeIcon name="SmartPhone01Icon" size={12}/>
                                    SMS
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Two-pane content */}
                        {(["email", "sms"] as Channel[]).map((ch) => (
                            <TabsContent key={ch} value={ch} className="mt-0">
                                <div className="flex min-h-[320px]">

                                    {/* Left pane — provider list */}
                                    <div className="w-[185px] shrink-0 border-r px-3 py-4 space-y-0.5">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 mb-2">
                                            Providers
                                        </p>
                                        {activeProviders.map((opt) => (
                                            <ProviderNavItem
                                                key={opt.value}
                                                opt={opt}
                                                selected={providerType === opt.value}
                                                disabled={!!editingProvider}
                                                onClick={() => handleProviderChange(opt.value as ProviderType)}
                                            />
                                        ))}
                                    </div>

                                    {/* Right pane — credentials */}
                                    <div className="flex-1 px-6 py-4 space-y-4 overflow-y-auto max-h-[380px] custom-scrollbar">

                                        {/* Tenant user picker */}
                                        {scope === USER_ROLES.USER && (
                                            <div className="space-y-1.5 pb-2 border-b animate-in fade-in duration-150">
                                                <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                                                    <HugeIcon name="UserCircleIcon" size={12}/>
                                                    Target Account
                                                </Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="outline" role="combobox"
                                                                disabled={!!editingProvider}
                                                                className="w-full justify-between font-normal text-sm h-9">
                                                            {selectedUserId
                                                                ? users.find((u) => u.id === selectedUserId)?.name
                                                                : <span className="text-muted-foreground">Select a user...</span>}
                                                            <HugeIcon name="Sorting05Icon" size={13} className="opacity-40 shrink-0"/>
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[340px] p-0" align="start">
                                                        <Command>
                                                            <CommandInput placeholder="Search..." className="h-9 text-sm"/>
                                                            <CommandList>
                                                                <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">No users found.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {users.map((u) => (
                                                                        <CommandItem key={u.id} value={u.name}
                                                                                     className="py-2 text-sm cursor-pointer"
                                                                                     onSelect={() => setValue("userId", u.id)}>
                                                                            <HugeIcon name="Tick01Icon" size={13}
                                                                                      className={cn("mr-2 text-primary shrink-0", selectedUserId === u.id ? "opacity-100" : "opacity-0")}/>
                                                                            <span className="font-medium">{u.name}</span>
                                                                            <span className="text-muted-foreground ml-2 text-xs">({u.email})</span>
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        )}

                                        {/* Credential fields */}
                                        <div className="space-y-1 mb-1">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                                Credentials
                                            </p>
                                        </div>

                                        {providerType === "ses" && (
                                            <div className="space-y-4 animate-in fade-in duration-150">
                                                <FieldRow label="AWS Region" icon="Location04Icon">
                                                    <Select value={region} onValueChange={(v) => setValue("region" as any, v)}>
                                                        <SelectTrigger className="text-sm h-9 w-full">
                                                            <SelectValue placeholder="Select region"/>
                                                        </SelectTrigger>
                                                        <SelectContent position="popper" className="max-h-[250px]">
                                                            {SES_REGIONS.map((r) => (
                                                                <SelectItem key={r.value} value={r.value} className="text-sm">
                                                                    {r.label}
                                                                    <span className="text-muted-foreground font-mono text-xs ml-1.5">({r.value})</span>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </FieldRow>
                                                <FieldRow label="Access Key ID" icon="Key01Icon">
                                                    <Input {...register("accessKeyId" as any)} placeholder="AKIA..." className="font-mono text-sm h-9"/>
                                                </FieldRow>
                                                <FieldRow label="Secret Access Key" icon="LockIcon">
                                                    <Input type="password" {...register("secretAccessKey" as any)} placeholder="••••••••••••••••" className="font-mono text-sm h-9"/>
                                                </FieldRow>
                                            </div>
                                        )}

                                        {providerType === "smtp" && (
                                            <div className="space-y-4 animate-in fade-in duration-150">
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="col-span-2">
                                                        <FieldRow label="Host" icon="ServerIcon">
                                                            <Input {...register("host" as any)} placeholder="smtp.example.com" className="text-sm h-9"/>
                                                        </FieldRow>
                                                    </div>
                                                    <FieldRow label="Port" icon="NetworkIcon">
                                                        <Input {...register("port" as any)} placeholder="587" className="text-sm h-9"/>
                                                    </FieldRow>
                                                </div>
                                                <FieldRow label="Username" icon="UserIcon">
                                                    <Input {...register("smtpUser" as any)} placeholder="user@example.com" className="text-sm h-9" autoComplete="off"/>
                                                </FieldRow>
                                                <FieldRow label="Password" icon="LockIcon">
                                                    <Input type="password" {...register("smtpPass" as any)} placeholder="••••••••••••••••" className="text-sm h-9" autoComplete="new-password"/>
                                                </FieldRow>
                                            </div>
                                        )}

                                        {providerType === "resend" && (
                                            <div className="space-y-4 animate-in fade-in duration-150">
                                                <FieldRow label="API Key" icon="Key01Icon">
                                                    <Input {...register("apiKey" as any)} placeholder="re_••••••••••••••••" className="font-mono text-sm h-9" autoComplete="off"/>
                                                </FieldRow>
                                            </div>
                                        )}

                                        {providerType === "macrokiosk" && (
                                            <div className="space-y-4 animate-in fade-in duration-150">
                                                <FieldRow label="Username" icon="UserIcon">
                                                    <Input {...register("mkUser" as any)} placeholder="MacroKiosk username" className="text-sm h-9" autoComplete="off"/>
                                                </FieldRow>
                                                <FieldRow label="Password" icon="LockIcon">
                                                    <Input type="password" {...register("mkPassword" as any)} placeholder="••••••••••••••••" className="text-sm h-9" autoComplete="new-password"/>
                                                </FieldRow>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>

                    {/* Error */}
                    {firstErrorMessage && (
                        <div className="mx-6 mb-2 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-destructive/8 border border-destructive/20 text-destructive text-sm">
                            <HugeIcon name="Alert01Icon" size={15} className="shrink-0"/>
                            <span className="font-medium">{firstErrorMessage}</span>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="px-6 py-4 border-t flex items-center justify-between bg-muted/10">
                        <p className="text-xs text-muted-foreground">
                            {scope === "default" ? "Applied globally to all users" : "Override for selected tenant only"}
                        </p>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" size="sm" disabled={isPending}>
                                {isPending
                                    ? <><HugeIcon name="Loading03Icon" size={14} className="mr-1.5 animate-spin"/>Saving...</>
                                    : <><HugeIcon name="FloppyDiskIcon" size={14} className="mr-1.5"/>Save Provider</>}
                            </Button>
                        </div>
                    </div>
                </form>

            </DialogContent>
        </Dialog>
    );
}
