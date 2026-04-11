"use client";

import {useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {createPricingRule, deletePricingRule, updatePricingRule} from "@/lib/actions/admin";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Badge} from "@/components/ui/badge";
import {Card, CardContent} from "@/components/ui/card";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,} from "@/components/ui/dialog";
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
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Globe, Info, Pencil, Plus, Trash2, User} from "lucide-react";
import {TRANSACTION_MODULE_LABELS, TRANSACTION_MODULES, USER_ROLES, UserRole} from "@/lib/enums";
import {toast} from "sonner";

type Rule = {
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

function formatPricingAmount(price: string | number) {
    const num = typeof price === "string" ? parseFloat(price) : price;
    if (isNaN(num)) return "0.00";

    return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
    }).format(num);
}

function StatusBadge({effectiveFrom}: { effectiveFrom: Date }) {
    const now = new Date();
    const d = new Date(effectiveFrom);
    if (d <= now)
        return <Badge variant="outline"
                      className="text-emerald-600 border-emerald-200 bg-emerald-50 rounded-full font-bold">Active</Badge>;

    return <Badge variant="secondary" className="rounded-full font-bold">Scheduled</Badge>;
}

function RuleTable({
                       rules,
                       onEdit,
                       onDelete,
                       isPending,
                   }: {
    rules: Rule[];
    onEdit: (rule: Rule) => void;
    onDelete: (id: string) => void;
    isPending: boolean;
}) {
    if (rules.length === 0) {
        return (
            <div className="py-16 text-center text-sm font-bold text-muted-foreground border-t border-dashed">
                No pricing rules configured.
            </div>
        );
    }

    return (
        <div className="rounded-md border-t">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow>
                        <TableHead className="font-bold">Scope</TableHead>
                        <TableHead className="font-bold">Module</TableHead>
                        <TableHead className="font-bold">Unit Price</TableHead>
                        <TableHead className="font-bold">Effective From</TableHead>
                        <TableHead className="font-bold">Status</TableHead>
                        <TableHead className="font-bold">Note</TableHead>
                        <TableHead className="w-24"/>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rules.map((r) => (
                        <TableRow key={r.id} className="group hover:bg-muted/40 transition-colors">
                            <TableCell>
                                {r.userId ? (
                                    <div className="flex items-center gap-3">
                                        <Avatar className="size-8 border shadow-sm">
                                            <AvatarImage src={r.userImage || undefined}/>
                                            <AvatarFallback className="text-[10px] font-bold">
                                                {r.userName?.slice(0, 2).toUpperCase() || "US"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-bold text-sm leading-none mb-1">{r.userName}</p>
                                            <p className="text-xs text-muted-foreground">{r.userEmail}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <Avatar className="size-8 border shadow-sm bg-primary/5">
                                            <AvatarFallback className="bg-transparent text-primary">
                                                <Globe className="size-4"/>
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-bold text-primary">System Default</span>
                                    </div>
                                )}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="text-[10px] uppercase font-bold">
                                    {TRANSACTION_MODULE_LABELS[r.module] ?? r.module}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <span className="font-mono text-sm font-black text-foreground">
                                    {formatPricingAmount(r.unitPrice)} MYR
                                </span>
                                <span
                                    className="text-[10px] text-muted-foreground uppercase font-bold ml-1"> / {r.action}</span>
                            </TableCell>
                            <TableCell className="text-xs font-mono font-medium text-muted-foreground">
                                {new Date(r.effectiveFrom).toLocaleString(undefined, {
                                    dateStyle: 'medium',
                                    timeStyle: 'short'
                                })}
                            </TableCell>
                            <TableCell>
                                <StatusBadge effectiveFrom={new Date(r.effectiveFrom)}/>
                            </TableCell>
                            <TableCell className="text-xs font-medium text-muted-foreground max-w-[180px] truncate">
                                {r.note ?? "—"}
                            </TableCell>
                            <TableCell>
                                <div
                                    className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" disabled={isPending} onClick={() => onEdit(r)}>
                                        <Pencil className="size-4 text-muted-foreground"/>
                                    </Button>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" disabled={isPending}>
                                                <Trash2 className="size-4 text-destructive"/>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete this pricing rule?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    {r.userId
                                                        ? `This will remove the custom rate for ${r.userName}. They will fall back to the default pricing.`
                                                        : "This will remove this default rate. Users without a custom override will no longer be charged for this module."}
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => onDelete(r.id)}
                                                                   className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold">
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

export function PricingManager({rules, users}: { rules: Rule[]; users: DbUser[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [dialogOpen, setDialogOpen] = useState(false);

    // Form state
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
    const [scope, setScope] = useState<"default" | UserRole>("default");
    const [selectedUserId, setSelectedUserId] = useState("");
    const [module, setModule] = useState<string>(TRANSACTION_MODULES.EMAIL);
    const [unitPrice, setUnitPrice] = useState("0.001000");
    const [effectiveFrom, setEffectiveFrom] = useState(() => new Date().toISOString().slice(0, 16));
    const [note, setNote] = useState("");
    const [error, setError] = useState("");

    function resetForm() {
        setEditingRuleId(null);
        setScope("default");
        setSelectedUserId("");
        setModule(TRANSACTION_MODULES.EMAIL);
        setUnitPrice("0.001000");
        setEffectiveFrom(new Date().toISOString().slice(0, 16));
        setNote("");
        setError("");
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

    const defaultRules = rules.filter((r) => !r.userId);
    const userRules = rules.filter((r) => !!r.userId);

    return (
        <div className="space-y-4">
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900 shadow-sm">
                <CardContent className="flex gap-3 py-4">
                    <Info className="size-4 text-blue-600 mt-0.5 shrink-0"/>
                    <div className="text-sm text-blue-800 dark:text-blue-300">
                        <strong>How pricing works:</strong> When a campaign sends, the system charges the user's wallet.
                        User-specific overrides take priority over default rates. The most recent rule where
                        <em> Effective From</em> ≤ now is used.
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={() => {
                    resetForm();
                    setDialogOpen(true);
                }} className="font-bold shadow-sm">
                    <Plus className="size-4 mr-2"/>
                    Add Pricing Rule
                </Button>
            </div>

            <Tabs defaultValue="defaults" className="shadow-sm border rounded-xl overflow-hidden bg-card">
                <div className="px-6 pt-4 bg-muted/10 border-b">
                    <TabsList className="grid w-[400px] grid-cols-2 mb-[-1px]">
                        <TabsTrigger value="defaults" className="font-bold">
                            <Globe className="size-4 mr-2"/>
                            System Defaults
                        </TabsTrigger>
                        <TabsTrigger value="overrides" className="font-bold">
                            <User className="size-4 mr-2"/>
                            User Overrides
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="defaults" className="mt-0 outline-none">
                    <div className="p-6 pb-4">
                        <h3 className="text-lg font-bold tracking-tight">System Default Pricing</h3>
                        <p className="text-sm text-muted-foreground">Applies to all users unless they have a custom
                            override.</p>
                    </div>
                    <RuleTable rules={defaultRules} onEdit={handleEdit} onDelete={handleDelete} isPending={isPending}/>
                </TabsContent>

                <TabsContent value="overrides" className="mt-0 outline-none">
                    <div className="p-6 pb-4">
                        <h3 className="text-lg font-bold tracking-tight">User-Specific Overrides</h3>
                        <p className="text-sm text-muted-foreground">Custom enterprise rates or discounts for individual
                            users.</p>
                    </div>
                    <RuleTable rules={userRules} onEdit={handleEdit} onDelete={handleDelete} isPending={isPending}/>
                </TabsContent>
            </Tabs>

            <Dialog open={dialogOpen} onOpenChange={(o) => {
                if (!o) {
                    setDialogOpen(false);
                    resetForm();
                } else setDialogOpen(true);
            }}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{editingRuleId ? "Edit Pricing Rule" : "Add Pricing Rule"}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-5 pt-2">
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Applies
                                To</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    type="button"
                                    disabled={!!editingRuleId}
                                    onClick={() => setScope("default")}
                                    className={`rounded-lg border p-3 text-sm text-left transition-colors ${
                                        scope === "default"
                                            ? "border-primary bg-primary/5 font-bold shadow-sm"
                                            : "hover:bg-muted font-medium text-muted-foreground"
                                    } ${editingRuleId ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                    <Globe className="size-4 mb-2 text-primary"/>
                                    System Default
                                </Button>
                                <Button
                                    type="button"
                                    disabled={!!editingRuleId}
                                    onClick={() => setScope(USER_ROLES.USER)}
                                    className={`rounded-lg border p-3 text-sm text-left transition-colors ${
                                        scope === USER_ROLES.USER
                                            ? "border-primary bg-primary/5 font-bold shadow-sm"
                                            : "hover:bg-muted font-medium text-muted-foreground"
                                    } ${editingRuleId ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                    <User className="size-4 mb-2 text-primary"/>
                                    Specific User
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {scope === USER_ROLES.USER && (
                                <div className="space-y-2">
                                    <Label>User</Label>
                                    <Select value={selectedUserId} onValueChange={setSelectedUserId}
                                            disabled={!!editingRuleId}>
                                        <SelectTrigger className={editingRuleId ? "opacity-50" : ""}>
                                            <SelectValue placeholder="Select a user..."/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users.map((u) => (
                                                <SelectItem key={u.id} value={u.id}>
                                                    {u.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Module</Label>
                                <Select value={module} onValueChange={setModule} disabled={!!editingRuleId}>
                                    <SelectTrigger className={editingRuleId ? "opacity-50" : ""}>
                                        <SelectValue/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(TRANSACTION_MODULES)
                                            .filter((m) => m !== TRANSACTION_MODULES.SYSTEM)
                                            .map((m) => (
                                                <SelectItem key={m} value={m}>
                                                    {TRANSACTION_MODULE_LABELS[m] || m}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-xl bg-muted/10">
                            <div className="space-y-2">
                                <Label>Unit Price (MYR per action)</Label>
                                <div className="relative">
                                    <span
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">MYR</span>
                                    <Input
                                        className="pl-10 font-mono font-bold bg-background"
                                        value={unitPrice}
                                        onChange={(e) => setUnitPrice(e.target.value)}
                                        placeholder="0.001000"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Effective From</Label>
                                <Input
                                    type="datetime-local"
                                    className="bg-background"
                                    value={effectiveFrom}
                                    onChange={(e) => setEffectiveFrom(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Internal Note (Optional)</Label>
                            <Input
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="e.g. Enterprise Tier Discount"
                            />
                        </div>

                        {error && <p className="text-sm font-bold text-destructive">{error}</p>}
                    </div>

                    <DialogFooter className="mt-4 pt-4 border-t">
                        <Button variant="outline" onClick={() => {
                            setDialogOpen(false);
                            resetForm();
                        }}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isPending} className="font-bold w-32">
                            {isPending ? <span
                                className="animate-pulse">Saving...</span> : (editingRuleId ? "Save Changes" : "Create Rule")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}