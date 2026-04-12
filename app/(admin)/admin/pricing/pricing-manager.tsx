"use client";

import React, {useMemo, useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {createPricingRule, deletePricingRule, updatePricingRule} from "@/lib/actions/admin";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Badge} from "@/components/ui/badge";
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
import {
    ArrowUpRight,
    Calendar,
    Check,
    ChevronsUpDown,
    CircleDollarSign,
    Globe,
    Info,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    Trash2,
    User
} from "lucide-react";
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
        return (
            <Badge
                variant="outline"
                className="text-[10px] uppercase font-bold text-emerald-600 border-emerald-200 bg-emerald-50 rounded-full"
            >
                <Check className="size-3 mr-1"/> Active
            </Badge>
        );

    return (
        <Badge variant="secondary" className="text-[10px] uppercase font-bold rounded-full">
            <Calendar className="size-3 mr-1"/> Scheduled
        </Badge>
    );
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
        <div className="rounded-xl border bg-card shadow-md overflow-hidden transition-all">
            <div
                className="p-6 pb-4 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-black tracking-tight">{title}</h3>
                    <p className="text-sm font-medium text-muted-foreground">{description}</p>
                </div>
                {headerAction && (
                    <div className="w-full sm:w-auto">
                        {headerAction}
                    </div>
                )}
            </div>

            <Table>
                <TableHeader className="bg-muted/40">
                    <TableRow className="hover:bg-transparent">
                        <TableHead
                            className="w-[60px] text-center font-bold text-xs uppercase tracking-tighter">#</TableHead>
                        <TableHead
                            className="font-bold text-xs uppercase tracking-tighter">{firstColumnHeader}</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-tighter">Module</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-tighter">Unit Price</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-tighter">Status</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-tighter">Effective From</TableHead>
                        <TableHead className="w-12"/>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rules.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="py-20">
                                <div className="flex flex-col items-center justify-center text-center">
                                    <div className="p-4 bg-muted/50 rounded-full mb-4">
                                        <CircleDollarSign className="size-10 text-muted-foreground/40"/>
                                    </div>
                                    <h3 className="text-lg font-bold">No pricing rules found</h3>
                                    <p className="text-sm text-muted-foreground">Add a new rule to override system
                                        defaults.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        rules.map((r, index) => {
                            const rowNumber = (page - 1) * pageSize + index + 1;

                            return (
                                <TableRow key={r.id} className="group transition-colors hover:bg-muted/30">
                                    <TableCell className="text-center text-xs font-mono text-muted-foreground">
                                        {rowNumber}
                                    </TableCell>
                                    <TableCell>
                                        {r.userId ? (
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    className="size-9 border-2 border-background shadow-sm group-hover:border-primary/20 transition-all">
                                                    <AvatarImage src={r.userImage || undefined}/>
                                                    <AvatarFallback
                                                        className="text-[10px] font-bold bg-primary/5 text-primary">
                                                        {r.userName?.slice(0, 2).toUpperCase() || "US"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-bold text-sm tracking-tight leading-none mb-1">{r.userName}</p>
                                                    <p className="text-[11px] text-muted-foreground font-medium">{r.userEmail}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="size-9 rounded-full border-2 border-background bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                                                    <Globe className="size-4"/>
                                                </div>
                                                <span className="text-sm font-black tracking-tight text-primary">System Global</span>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline"
                                               className="text-[10px] uppercase font-black bg-background/50 border-muted-foreground/20">
                                            {TRANSACTION_MODULE_LABELS[r.module] ?? r.module}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1">
                                                <span className="font-mono text-sm font-black text-foreground">
                                                    {formatPricingAmount(r.unitPrice)}
                                                </span>
                                                <span className="text-[10px] font-bold text-muted-foreground">MYR</span>
                                            </div>
                                            <span
                                                className="text-[10px] text-muted-foreground font-medium lowercase italic">per {r.action}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge effectiveFrom={new Date(r.effectiveFrom)}/>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-foreground">
                                                {new Date(r.effectiveFrom).toLocaleDateString(undefined, {dateStyle: 'medium'})}
                                            </span>
                                            <span className="text-[10px] font-mono text-muted-foreground">
                                                {new Date(r.effectiveFrom).toLocaleTimeString(undefined, {timeStyle: 'short'})}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="size-8 rounded-full">
                                                    <MoreHorizontal className="size-4"/>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuItem onClick={() => onEdit(r)} disabled={isPending}
                                                                  className="font-bold">
                                                    <Pencil className="size-4 mr-2 text-primary"/> Edit Rule
                                                </DropdownMenuItem>
                                                {r.note && (
                                                    <>
                                                        <DropdownMenuSeparator/>
                                                        <div
                                                            className="px-2 py-1.5 text-[10px] text-muted-foreground italic">
                                                            Note: {r.note}
                                                        </div>
                                                    </>
                                                )}
                                                <DropdownMenuSeparator/>
                                                <DropdownMenuItem
                                                    className="text-destructive font-bold focus:bg-destructive/10 focus:text-destructive"
                                                    onClick={() => setRuleToDelete(r)}
                                                    disabled={isPending}
                                                >
                                                    <Trash2 className="size-4 mr-2"/> Delete Rule
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
                        <AlertDialogCancel className="font-bold">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            if (ruleToDelete) {
                                onDelete(ruleToDelete.id);
                                setRuleToDelete(null);
                            }
                        }} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold">
                            Confirm Delete
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
        newEffectiveDate.setSeconds(0, 0);

        const isDuplicate = rules.some(r => {
            if (editingRuleId && r.id === editingRuleId)
                return false;

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

    const defaultRules = rules.filter((r) => !r.userId);

    const filteredUserRules = useMemo(() => {
        const overrides = rules.filter((r) => !!r.userId);

        const filtered = searchQuery
            ? overrides.filter((r) => {
                const q = searchQuery.toLowerCase();
                return r.userName?.toLowerCase().includes(q) ||
                    r.userEmail?.toLowerCase().includes(q) ||
                    r.note?.toLowerCase().includes(q);
            })
            : overrides;

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
            <div
                className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl border shadow-sm min-h-[72px]">
                <div className="flex-1 w-full sm:max-w-md flex items-center">
                    {activeTab === "overrides" ? (
                        /* 🔍 Search Bar for Overrides */
                        <div className="relative w-full animate-in fade-in slide-in-from-left-2 duration-300">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"/>
                            <Input
                                placeholder="Filter overrides by name or email..."
                                className="pl-9 bg-background border-muted-foreground/20 focus-visible:ring-primary/30 h-10"
                                value={searchQuery}
                                onChange={handleSearchChange}
                            />
                        </div>
                    ) : (
                        /* 📊 Stats Summary for Global Rates */
                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2 duration-300">
                            <div className="p-2 bg-primary/5 rounded-lg border border-primary/10">
                                <CircleDollarSign className="size-5 text-primary"/>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-black tracking-tight">Active Global Rates</span>
                                <span className="text-[11px] text-muted-foreground font-medium italic">
                                    System-wide defaults for {defaultRules.length} modules
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {activeTab === "defaults" && (
                        <div
                            className="hidden lg:flex items-center gap-2 text-[10px] font-bold text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg border border-dashed">
                            <Info className="size-3"/>
                            <span>Global rates apply to everyone</span>
                        </div>
                    )}
                    <Button onClick={() => {
                        resetForm();
                        setDialogOpen(true);
                    }} className="w-full sm:w-auto font-black uppercase tracking-tighter shadow-lg shadow-primary/20">
                        <Plus className="size-4 mr-2"/>
                        Create Rule
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
                <TabsList className="bg-muted/50 p-1 rounded-xl w-fit">
                    <TabsTrigger value="defaults"
                                 className="font-bold rounded-lg px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Globe className="size-4 mr-2"/> Global Rates
                    </TabsTrigger>
                    <TabsTrigger value="overrides"
                                 className="font-bold rounded-lg px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <User className="size-4 mr-2"/> Custom Overrides
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="defaults" className="mt-0 outline-none">
                    <RuleTable
                        title="Global Pricing"
                        description="Default unit rates applied to all standard accounts."
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
                        title="User Overrides"
                        description="Bespoke pricing for enterprise or high-volume partners."
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
                <DialogContent className="sm:max-w-xl p-0 overflow-hidden gap-0">
                    <DialogHeader className="p-6 bg-muted/20 border-b">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <ArrowUpRight className="size-6 text-primary"/>
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black tracking-tighter">
                                    {editingRuleId ? "Update Pricing Rule" : "New Pricing Rule"}
                                </DialogTitle>
                                <p className="text-sm text-muted-foreground font-medium">Configure a new billing rate
                                    for the platform.</p>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6 space-y-8">
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select
                                Application Scope</Label>
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
                                    <Globe className="size-8"/>
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
                                    <User className="size-8"/>
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
                                                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50"/>
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
                                                                <Check
                                                                    className={cn("mr-2 size-4", selectedUserId === user.id ? "opacity-100" : "opacity-0")}/>
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
                                <Info className="size-4"/> {error}
                            </p>}
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
        </div>
    );
}