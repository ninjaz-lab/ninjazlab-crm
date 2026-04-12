"use client";

import React, {useMemo, useState, useTransition} from "react";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Check, ChevronsUpDown, Globe, Info, MoreHorizontal, Pencil, Plus, Search, Trash2, User} from "lucide-react";
import {TRANSACTION_MODULE_LABELS, TRANSACTION_MODULES, USER_ROLES, UserRole} from "@/lib/enums";
import {TablePagination} from "@/components/table-pagination";
import {toast} from "sonner";
import {cn} from "@/lib/utils";

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
        return <Badge
            variant="outline"
            className="text-emerald-600 border-emerald-200 bg-emerald-50 rounded-full font-bold">
            Active
        </Badge>;

    return <Badge variant="secondary" className="rounded-full font-bold">Scheduled</Badge>;
}

function RuleTable({
                       title,
                       description,
                       rules,
                       total,
                       page,
                       pageSize,
                       onPageChange,
                       onPageSizeChange,
                       onEdit,
                       onDelete,
                       isPending,
                       headerAction,
                       firstColumnHeader = "Scope"
                   }: {
    title: string;
    description: string;
    rules: Rule[];
    total: number;
    page: number;
    pageSize: number;
    onPageChange: (p: number) => void;
    onPageSizeChange: (s: number) => void;
    onEdit: (rule: Rule) => void;
    onDelete: (id: string) => void;
    isPending: boolean;
    headerAction?: React.ReactNode;
    firstColumnHeader?: string;
}) {
    const [ruleToDelete, setRuleToDelete] = useState<Rule | null>(null);

    return (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div
                className="p-6 pb-4 border-b bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold tracking-tight">{title}</h3>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                {headerAction && (
                    <div className="w-full sm:w-auto">
                        {headerAction}
                    </div>
                )}
            </div>

            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow>
                        <TableHead className="w-[60px] text-center font-bold">#</TableHead>
                        <TableHead className="font-bold">{firstColumnHeader}</TableHead>
                        <TableHead className="font-bold">Module</TableHead>
                        <TableHead className="font-bold">Unit Price</TableHead>
                        <TableHead className="font-bold">Effective From</TableHead>
                        <TableHead className="font-bold">Status</TableHead>
                        <TableHead className="font-bold">Note</TableHead>
                        <TableHead className="w-12"/>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rules.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                No pricing rules found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        rules.map((r, index) => {
                            const rowNumber = (page - 1) * pageSize + index + 1;

                            return (
                                <TableRow key={r.id} className="hover:bg-muted/40 transition-colors group">
                                    <TableCell className="text-center text-xs font-mono text-muted-foreground">
                                        {rowNumber}
                                    </TableCell>
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
                                    <TableCell
                                        className="text-xs font-medium text-muted-foreground max-w-[180px] truncate">
                                        {r.note ?? "—"}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="size-8">
                                                    <MoreHorizontal className="size-4"/>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onEdit(r)} disabled={isPending}>
                                                    <Pencil className="size-4 mr-2"/> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator/>
                                                <DropdownMenuItem
                                                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                    onClick={() => setRuleToDelete(r)}
                                                    disabled={isPending}
                                                >
                                                    <Trash2 className="size-4 mr-2"/> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>

            <TablePagination
                total={total}
                page={page}
                pageSize={pageSize}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
            />

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
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            if (ruleToDelete) {
                                onDelete(ruleToDelete.id);
                                setRuleToDelete(null);
                            }
                        }} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

export function PricingManager({rules, users}: { rules: Rule[]; users: DbUser[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [dialogOpen, setDialogOpen] = useState(false);

    const [activeTab, setActiveTab] = useState("defaults");
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [comboboxOpen, setComboboxOpen] = useState(false);

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
        newEffectiveDate.setSeconds(0, 0); // Ignore seconds for a perfect comparison

        const isDuplicate = rules.some(r => {
            // If editing, ignore the rule we are currently updating
            if (editingRuleId && r.id === editingRuleId)
                return false;

            const isSameUser = scope === USER_ROLES.USER ? r.userId === selectedUserId : r.userId === null;
            const isSameModule = r.module === module;

            const existingDate = new Date(r.effectiveFrom);
            existingDate.setSeconds(0, 0); // Ignore seconds on existing rule

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

    const defaultRules = rules.filter((r) => !r.userId);

    const filteredUserRules = useMemo(() => {
        const overrides = rules.filter((r) => !!r.userId);

        // 1. Filter by search query
        const filtered = searchQuery
            ? overrides.filter((r) => {
                const q = searchQuery.toLowerCase();
                return r.userName?.toLowerCase().includes(q) ||
                    r.userEmail?.toLowerCase().includes(q) ||
                    r.note?.toLowerCase().includes(q);
            })
            : overrides;

        // 2. Sort Alphabetically by User Name
        return filtered.sort((a, b) => {
            const nameA = a.userName || "";
            const nameB = b.userName || "";
            return nameA.localeCompare(nameB);
        });
    }, [rules, searchQuery]);

    const paginatedDefaultRules = defaultRules.slice((page - 1) * pageSize, page * pageSize);
    const paginatedUserRules = filteredUserRules.slice((page - 1) * pageSize, page * pageSize);

    function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
        setSearchQuery(e.target.value);
        setPage(1);
    }

    function handleTabChange(val: string) {
        setActiveTab(val);
        setPage(1);
    }

    return (
        <div className="space-y-6">
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

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
                <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                    <TabsTrigger value="defaults" className="font-bold">
                        <Globe className="size-4 mr-2"/>
                        System Defaults
                    </TabsTrigger>
                    <TabsTrigger value="overrides" className="font-bold">
                        <User className="size-4 mr-2"/>
                        User Overrides
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="defaults" className="mt-0 outline-none">
                    <RuleTable
                        title="System Default Pricing"
                        description="Applies to all users unless they have a custom override."
                        rules={paginatedDefaultRules}
                        total={defaultRules.length}
                        page={page}
                        pageSize={pageSize}
                        onPageChange={setPage}
                        onPageSizeChange={(s) => {
                            setPageSize(s);
                            setPage(1);
                        }}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        isPending={isPending}
                        firstColumnHeader="Scope"
                    />
                </TabsContent>

                <TabsContent value="overrides" className="mt-0 outline-none">
                    <RuleTable
                        title="User-Specific Overrides"
                        description="Custom enterprise rates or discounts for individual users."
                        rules={paginatedUserRules}
                        total={filteredUserRules.length}
                        page={page}
                        pageSize={pageSize}
                        onPageChange={setPage}
                        onPageSizeChange={(s) => {
                            setPageSize(s);
                            setPage(1);
                        }}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        isPending={isPending}
                        firstColumnHeader="User"
                        headerAction={
                            <div className="relative w-full sm:w-[300px]">
                                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground"/>
                                <Input
                                    placeholder="Search by name, email, or note..."
                                    className="pl-8 bg-background"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                />
                            </div>
                        }
                    />
                </TabsContent>
            </Tabs>

            <Dialog open={dialogOpen} onOpenChange={(o) => {
                if (!o) {
                    setDialogOpen(false);
                    resetForm();
                } else {
                    setDialogOpen(true);
                }
            }}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{editingRuleId ? "Edit Pricing Rule" : "Add Pricing Rule"}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 pt-2">
                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Applies
                                To</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={!!editingRuleId}
                                    onClick={() => setScope("default")}
                                    className={cn(
                                        "h-24 flex flex-col items-center justify-center gap-2 transition-all",
                                        scope === "default"
                                            ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20 shadow-sm"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                                        editingRuleId && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <Globe className="size-6"/>
                                    <span className="font-bold">System Default</span>
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={!!editingRuleId}
                                    onClick={() => setScope(USER_ROLES.USER)}
                                    className={cn(
                                        "h-24 flex flex-col items-center justify-center gap-2 transition-all",
                                        scope === USER_ROLES.USER
                                            ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20 shadow-sm"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                                        editingRuleId && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <User className="size-6"/>
                                    <span className="font-bold">Specific User</span>
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {scope === USER_ROLES.USER && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                                    <Label>User</Label>
                                    <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={comboboxOpen}
                                                disabled={!!editingRuleId}
                                                className={cn(
                                                    "w-full justify-between font-normal bg-background shadow-sm",
                                                    !selectedUserId && "text-muted-foreground",
                                                    editingRuleId && "opacity-50 cursor-not-allowed"
                                                )}
                                            >
                                                {selectedUserId
                                                    ? users.find((user) => user.id === selectedUserId)?.name
                                                    : "Search for a user..."}
                                                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50"/>
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[400px] p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Search user by name..."/>
                                                <CommandList>
                                                    <CommandEmpty>No user found.</CommandEmpty>
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
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 size-4",
                                                                        selectedUserId === user.id ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                <span className="font-medium">{user.name}</span>
                                                                <span
                                                                    className="text-muted-foreground ml-2 text-xs">({user.email})</span>
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5 border rounded-xl bg-muted/10">
                            <div className="space-y-2">
                                <Label>Unit Price (MYR per action)</Label>
                                <div className="relative">
                                    <span
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">MYR</span>
                                    <Input
                                        className="pl-10 font-mono font-bold bg-background shadow-sm"
                                        value={unitPrice}
                                        onChange={(e) => setUnitPrice(e.target.value)}
                                        placeholder="0.10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Effective From</Label>
                                <Input
                                    type="datetime-local"
                                    className="bg-background shadow-sm"
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
                                className="shadow-sm"
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
                        <Button onClick={handleSave} disabled={isPending} className="font-bold min-w-[120px]">
                            {isPending ? <span
                                className="animate-pulse">Saving...</span> : (editingRuleId ? "Save Changes" : "Create Rule")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}