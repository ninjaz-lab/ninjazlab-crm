"use client";

import React, {useMemo, useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {createPricingRule, deletePricingRule, updatePricingRule} from "@/lib/actions/admin/pricing";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {TRANSACTION_MODULE_LABELS, TRANSACTION_MODULES, USER_ROLES, UserRole} from "@/lib/enums";
import {toast} from "sonner";
import {cn} from "@/lib/utils/utils";
import {HugeIcon} from "@/components/huge-icon";
import {PricingDefaultsTab} from "./pricing-defaults-tab";
import {PricingOverridesTab} from "./pricing-overrides-tab";

export type Rule = {
    id: string;
    userId: string | null;
    userName: string | null;
    userEmail: string | null;
    userImage: string | null;
    module: string;
    action: string;
    unitPrice: string;
    currency: string;
    effectiveFrom: Date;
    note: string | null;
    createdAt: Date;
};

type DbUser = { id: string; name: string; email: string };

export function PricingManager({rules, users}: { rules: Rule[]; users: DbUser[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("defaults");
    const [comboboxOpen, setComboboxOpen] = useState(false);

    // Business Logic State
    const [ruleToDelete, setRuleToDelete] = useState<Rule | null>(null);

    // Form state
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
    const [scope, setScope] = useState<"default" | UserRole>("default");
    const [selectedUserId, setSelectedUserId] = useState("");
    const [module, setModule] = useState<string>(TRANSACTION_MODULES.EMAIL);
    const [unitPrice, setUnitPrice] = useState("0.10");
    const [effectiveFrom, setEffectiveFrom] = useState(() => new Date().toISOString().slice(0, 16));
    const [note, setNote] = useState("");
    const [error, setError] = useState("");

    function resetForm() {
        setEditingRuleId(null);
        setScope("default");
        setSelectedUserId("");
        setModule(TRANSACTION_MODULES.EMAIL);
        setUnitPrice("0.10");
        setEffectiveFrom(new Date().toISOString().slice(0, 16));
        setNote("");
        setError("");
        setComboboxOpen(false);
    }

    function handleEdit(rule: Rule) {
        setEditingRuleId(rule.id);
        setScope(rule.userId ? USER_ROLES.USER : "default");
        setSelectedUserId(rule.userId || "");
        setModule(rule.module);
        setUnitPrice(parseFloat(rule.unitPrice).toString());

        const localDate = new Date(rule.effectiveFrom);
        localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
        setEffectiveFrom(localDate.toISOString().slice(0, 16));

        setNote(rule.note || "");
        setDialogOpen(true);
    }

    function handleSave() {
        const priceNum = Number(unitPrice);
        if (isNaN(priceNum) || priceNum < 0) {
            setError("Unit price must be a valid non-negative number.");
            return;
        }
        if (scope === USER_ROLES.USER && !selectedUserId) {
            setError("Please select a user.");
            return;
        }

        const newEffectiveDate = new Date(effectiveFrom);
        newEffectiveDate.setSeconds(0, 0);

        const isDuplicate = rules.some(r => {
            if (editingRuleId && r.id === editingRuleId) return false;
            const isSameUser = scope === USER_ROLES.USER ? r.userId === selectedUserId : r.userId === null;
            const isSameModule = r.module === module;
            const existingDate = new Date(r.effectiveFrom);
            existingDate.setSeconds(0, 0);
            return isSameUser && isSameModule && newEffectiveDate.getTime() === existingDate.getTime();
        });

        if (isDuplicate) {
            setError("A rule for this module and exact effective date already exists for this scope.");
            return;
        }

        setError("");
        startTransition(async () => {
            try {
                if (editingRuleId) {
                    await updatePricingRule(editingRuleId, {
                        unitPrice: priceNum.toFixed(6),
                        effectiveFrom: new Date(effectiveFrom),
                        note: note || undefined,
                    });
                    toast.success("Pricing rule updated successfully!");
                } else {
                    await createPricingRule({
                        userId: scope === USER_ROLES.USER ? selectedUserId : null,
                        module,
                        unitPrice: priceNum.toFixed(6),
                        effectiveFrom: new Date(effectiveFrom),
                        note: note || undefined,
                    });
                    toast.success("Pricing rule created successfully!");
                }
                setDialogOpen(false);
                resetForm();
                router.refresh();
            } catch (err) {
                toast.error("An error occurred while saving the pricing rule.");
            }
        });
    }

    function handleDelete(id: string) {
        startTransition(async () => {
            try {
                await deletePricingRule(id);
                toast.success("Pricing rule deleted.");
                router.refresh();
            } catch (err) {
                toast.error("Failed to delete pricing rule.");
            }
        });
    }

    // Split Data for Tabs
    const defaultRules = useMemo(() => rules.filter((r) => !r.userId), [rules]);
    const overridesRules = useMemo(() => rules.filter((r) => !!r.userId), [rules]);

    const CreateRuleAction = (
        <Button
            onClick={() => {
                resetForm();
                setDialogOpen(true);
            }}
            className="w-full sm:w-auto font-black uppercase tracking-tighter shadow-lg shadow-primary/20"
        >
            <HugeIcon name="PlusSignIcon" size={16} className="mr-2"/>
            Create Rule
        </Button>
    );

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">

            <TabsList className="bg-muted/50 p-0 rounded-xl w-fit h-11 overflow-hidden">
                <TabsTrigger
                    value="defaults"
                    className="font-bold rounded-none px-6 h-full transition-all">
                    <HugeIcon name="GlobalIcon" size={14} className="mr-2"/> Global Rates
                </TabsTrigger>
                <TabsTrigger
                    value="overrides"
                    className="font-bold rounded-none px-6 h-full transition-all">
                    <HugeIcon name="UserIcon" size={14} className="mr-2"/> Custom Overrides
                </TabsTrigger>
            </TabsList>

            <TabsContent value="defaults" className="m-0 outline-none">
                <PricingDefaultsTab
                    data={defaultRules}
                    isPending={isPending}
                    onEdit={handleEdit}
                    onDelete={setRuleToDelete}
                    actionSlot={CreateRuleAction}
                />
            </TabsContent>

            <TabsContent value="overrides" className="m-0 outline-none">
                <PricingOverridesTab
                    data={overridesRules}
                    isPending={isPending}
                    onEdit={handleEdit}
                    onDelete={setRuleToDelete}
                    actionSlot={CreateRuleAction}
                />
            </TabsContent>

            {/* --- Modals --- */}
            <Dialog open={dialogOpen} onOpenChange={(o) => {
                if (!o) {
                    setDialogOpen(false);
                    resetForm();
                } else {
                    setDialogOpen(true);
                }
            }}>
                <DialogContent className="sm:max-w-xl p-0 overflow-hidden gap-0">
                    <DialogHeader className="p-6 bg-muted/20 border-b">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <HugeIcon name="ArrowUpRight01Icon" size={24}/>
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black tracking-tighter">
                                    {editingRuleId ? "Update Pricing Rule" : "New Pricing Rule"}
                                </DialogTitle>
                                <p className="text-sm text-muted-foreground font-medium">
                                    Configure a new billing rate for the platform.
                                </p>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6 space-y-8">
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                Select Application Scope
                            </Label>
                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={!!editingRuleId}
                                    onClick={() => setScope("default")}
                                    className={cn(
                                        "h-28 flex flex-col items-center justify-center gap-2 transition-all border-2",
                                        scope === "default"
                                            ? "border-primary bg-primary/5 text-primary shadow-inner"
                                            : "text-muted-foreground hover:border-muted-foreground/50",
                                        editingRuleId && "opacity-50"
                                    )}
                                >
                                    <HugeIcon name="GlobalIcon" size={32}/>
                                    <span className="font-black uppercase text-xs">Global Rate</span>
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={!!editingRuleId}
                                    onClick={() => setScope(USER_ROLES.USER)}
                                    className={cn(
                                        "h-28 flex flex-col items-center justify-center gap-2 transition-all border-2",
                                        scope === USER_ROLES.USER
                                            ? "border-primary bg-primary/5 text-primary shadow-inner"
                                            : "text-muted-foreground hover:border-muted-foreground/50",
                                        editingRuleId && "opacity-50"
                                    )}
                                >
                                    <HugeIcon name="UserIcon" size={32}/>
                                    <span className="font-black uppercase text-xs">User Override</span>
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {scope === USER_ROLES.USER && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <Label className="text-xs font-bold">Target Account</Label>
                                    <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                disabled={!!editingRuleId}
                                                className="w-full justify-between font-bold bg-muted/20 border-none h-11"
                                            >
                                                {selectedUserId
                                                    ? users.find((user) => user.id === selectedUserId)?.name
                                                    : "Search users..."}
                                                <HugeIcon name="Sorting05Icon" size={14} className="ml-2 opacity-50"/>
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[300px] p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Type name..."/>
                                                <CommandList>
                                                    <CommandEmpty>No results found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {users.map((user) => (
                                                            <CommandItem
                                                                key={user.id}
                                                                value={user.name}
                                                                onSelect={() => {
                                                                    setSelectedUserId(user.id);
                                                                    setComboboxOpen(false);
                                                                }}
                                                            >
                                                                <HugeIcon
                                                                    name="Tick01Icon"
                                                                    size={14}
                                                                    className={cn("mr-2", selectedUserId === user.id ? "opacity-100" : "opacity-0")}
                                                                />
                                                                {user.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label className="text-xs font-bold">Marketing Module</Label>
                                <Select value={module} onValueChange={setModule} disabled={!!editingRuleId}>
                                    <SelectTrigger className="font-bold bg-muted/20 border-none h-11">
                                        <SelectValue/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(TRANSACTION_MODULES)
                                            .filter((m) => m !== TRANSACTION_MODULES.SYSTEM)
                                            .map((m) => (
                                                <SelectItem key={m} value={m} className="font-medium">
                                                    {TRANSACTION_MODULE_LABELS[m] || m}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div
                            className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 rounded-2xl bg-muted/30 border-2 border-dashed border-muted-foreground/20">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-primary">Unit Price (MYR)</Label>
                                <div className="relative">
                                    <Input
                                        className="pl-3 font-mono font-black text-lg bg-background h-12"
                                        value={unitPrice}
                                        onChange={(e) => setUnitPrice(e.target.value)}
                                        placeholder="0.10"
                                    />
                                    <span
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground bg-muted px-1.5 py-0.5 rounded">MYR</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold">Activation Date</Label>
                                <Input
                                    type="datetime-local"
                                    className="bg-background font-bold h-12"
                                    value={effectiveFrom}
                                    onChange={(e) => setEffectiveFrom(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold">Administrative Note</Label>
                            <Input
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="e.g. Q4 Promotional Rate"
                                className="bg-muted/20 border-none h-11 font-medium"
                            />
                        </div>

                        {error &&
                            <p className="text-xs font-black text-destructive bg-destructive/10 p-3 rounded-lg flex items-center gap-2">
                                <HugeIcon name="InformationCircleIcon" size={14}/> {error}
                            </p>
                        }
                    </div>

                    <DialogFooter className="p-6 bg-muted/20 border-t gap-3">
                        <Button variant="ghost" onClick={() => {
                            setDialogOpen(false);
                            resetForm();
                        }} className="font-bold">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isPending}
                                className="font-black uppercase tracking-tighter px-8">
                            {isPending ? "Syncing..." : (editingRuleId ? "Apply Changes" : "Confirm Rule")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!ruleToDelete} onOpenChange={(o) => {
                if (!o) setRuleToDelete(null);
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this pricing rule?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {ruleToDelete?.userId
                                ? `This will remove the custom rate for ${ruleToDelete.userName}. They will fall back to the default pricing.`
                                : "This will remove this default rate. Users without a custom override will no longer be charged for this module."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="font-bold">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            if (ruleToDelete) {
                                handleDelete(ruleToDelete.id);
                                setRuleToDelete(null);
                            }
                        }} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold">
                            Confirm Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Tabs>
    );
}
