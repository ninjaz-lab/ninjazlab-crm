"use client";

import {useEffect, useTransition} from "react";
import {useRouter} from "next/navigation";
import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command";
import {CAMPAIGN_TYPE, EMAIL_PROVIDER, USER_ROLES} from "@/lib/enums";
import {cn} from "@/lib/utils/utils";
import {HugeIcon} from "@/components/huge-icon";
import {createProviderConfig, updateProviderConfig} from "@/lib/actions/admin/providers";
import {SES_REGIONS} from "@/lib/config/aws";
import {ProviderConfig} from "./provider-dashboard";

const providerSchema = z.object({
    scope: z.enum(["default", USER_ROLES.USER]),
    userId: z.string().optional(),
    region: z.string().min(1, "AWS Region is required."),
    accessKeyId: z.string().min(1, "Access Key ID is required."),
    secretAccessKey: z.string().min(1, "Secret Access Key is required."),
}).superRefine((data, ctx) => {
    if (data.scope === USER_ROLES.USER && !data.userId) {
        ctx.addIssue({code: z.ZodIssueCode.custom, message: "Please select a target account.", path: ["userId"]});
    }
});

type ProviderFormValues = z.infer<typeof providerSchema>;
type DbUser = { id: string; name: string; email: string };

export function ProviderFormDialog({
                                       open,
                                       onOpenChange,
                                       editingProvider,
                                       users
                                   }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingProvider: ProviderConfig | null;
    users: DbUser[];
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const form = useForm<ProviderFormValues>({
        resolver: zodResolver(providerSchema),
        defaultValues: {scope: "default", userId: "", region: "ap-southeast-1", accessKeyId: "", secretAccessKey: ""}
    });

    const {register, handleSubmit, watch, setValue, reset, formState: {errors}} = form;
    const scope = watch("scope");
    const selectedUserId = watch("userId");
    const region = watch("region");
    const firstErrorMessage = Object.values(errors)[0]?.message;

    // Reset form when opening or changing the editing target
    useEffect(() => {
        if (open) {
            if (editingProvider) {
                const c = editingProvider.config || {};
                reset({
                    scope: editingProvider.userId ? USER_ROLES.USER : "default",
                    userId: editingProvider.userId || "",
                    region: c.region || "ap-southeast-1",
                    accessKeyId: c.accessKeyId || "",
                    secretAccessKey: c.secretAccessKey || "",
                });
            } else {
                reset({scope: "default", userId: "", region: "ap-southeast-1", accessKeyId: "", secretAccessKey: ""});
            }
        }
    }, [open, editingProvider, reset]);

    const onSubmit = (data: ProviderFormValues) => {
        startTransition(async () => {
            try {
                const payload = {
                    userId: data.scope === USER_ROLES.USER ? data.userId || null : null,
                    channel: CAMPAIGN_TYPE.EMAIL,
                    name: "Amazon SES",
                    config: {
                        type: EMAIL_PROVIDER.SES,
                        region: data.region,
                        accessKeyId: data.accessKeyId,
                        secretAccessKey: data.secretAccessKey
                    }
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* Slimmer max-w-md instead of max-w-lg */}
            <DialogContent className="sm:max-w-md p-0 gap-0">
                <DialogHeader className="p-5 border-b">
                    <DialogTitle
                        className="text-lg font-semibold">{editingProvider ? "Update Configuration" : "New Configuration"}</DialogTitle>
                    <DialogDescription>Setup API credentials for delivery infrastructure.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)}
                      className="p-5 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">

                    <div className="space-y-2">
                        <Label className="text-xs font-medium">Application Scope</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <Button type="button" variant="outline" disabled={!!editingProvider}
                                    onClick={() => setValue("scope", "default")}
                                    className={cn("h-14 justify-start px-3 transition-all", scope === "default" ? "border-primary bg-primary/5 ring-1 ring-primary" : "text-muted-foreground", editingProvider && "opacity-50")}>
                                <HugeIcon name="GlobalIcon" size={16} className="mr-2 shrink-0 text-foreground"/>
                                <div className="text-left leading-tight">
                                    <p className="text-sm font-semibold text-foreground">Global</p>
                                </div>
                            </Button>
                            <Button type="button" variant="outline" disabled={!!editingProvider}
                                    onClick={() => setValue("scope", USER_ROLES.USER)}
                                    className={cn("h-14 justify-start px-3 transition-all", scope === USER_ROLES.USER ? "border-primary bg-primary/5 ring-1 ring-primary" : "text-muted-foreground", editingProvider && "opacity-50")}>
                                <HugeIcon name="UserIcon" size={16} className="mr-2 shrink-0 text-foreground"/>
                                <div className="text-left leading-tight">
                                    <p className="text-sm font-semibold text-foreground">Tenant</p>
                                </div>
                            </Button>
                        </div>
                    </div>

                    {scope === USER_ROLES.USER && (
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                            <Label className="text-xs font-medium">Target Account</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" disabled={!!editingProvider}
                                            className="w-full justify-between font-normal text-sm">
                                        {selectedUserId ? users.find((u) => u.id === selectedUserId)?.name : "Select a user..."}
                                        <HugeIcon name="Sorting05Icon" size={14} className="opacity-50"/>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[380px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search name or email..." className="h-9 text-sm"/>
                                        <CommandList>
                                            <CommandEmpty className="py-4 text-center text-sm font-medium">No users
                                                found.</CommandEmpty>
                                            <CommandGroup>
                                                {users.map((u) => (
                                                    <CommandItem key={u.id} value={u.name}
                                                                 className="py-2 text-sm cursor-pointer"
                                                                 onSelect={() => setValue("userId", u.id)}>
                                                        <HugeIcon name="Tick01Icon" size={14}
                                                                  className={cn("mr-2 text-primary", selectedUserId === u.id ? "opacity-100" : "opacity-0")}/>
                                                        {u.name} <span
                                                        className="text-muted-foreground ml-2 text-xs">({u.email})</span>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}

                    <div className="space-y-4 animate-in fade-in">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium">AWS Region</Label>
                            <Select value={region} onValueChange={(val) => setValue("region", val)}>
                                <SelectTrigger className="text-sm">
                                    <SelectValue placeholder="Select AWS Region"/>
                                </SelectTrigger>
                                <SelectContent className="h-[250px]">
                                    {SES_REGIONS.map((r) => (
                                        <SelectItem key={r.value} value={r.value} className="text-sm">
                                            {r.label} <span className="text-muted-foreground ml-1">({r.value})</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Access Key ID</Label>
                            <Input {...register("accessKeyId")} placeholder="AKIA..." className="font-mono text-sm"/>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Secret Access Key</Label>
                            <Input type="password" {...register("secretAccessKey")} placeholder="••••••••••••••••"
                                   className="font-mono text-sm"/>
                        </div>
                    </div>

                    {firstErrorMessage && (
                        <div
                            className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                            <HugeIcon name="Alert01Icon" size={16} className="shrink-0"/>
                            {String(firstErrorMessage)}
                        </div>
                    )}
                    <button id="rhf-submit-btn" type="submit" className="hidden"/>
                </form>

                <DialogFooter className="p-4 border-t flex sm:justify-end gap-2 bg-muted/10">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={() => document.getElementById("rhf-submit-btn")?.click()} disabled={isPending}>
                        {isPending ? "Saving..." : "Save Configuration"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}