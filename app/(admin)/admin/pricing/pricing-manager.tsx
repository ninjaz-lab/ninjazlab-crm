"use client";

import {useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {createPricingRule, deletePricingRule} from "@/lib/actions/admin";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Badge} from "@/components/ui/badge";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
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
import {Globe, Info, Plus, Trash2, User} from "lucide-react";

const MODULES = [
  { value: "email_marketing", label: "Email Marketing" },
  { value: "sms_marketing", label: "SMS Marketing" },
  { value: "push_marketing", label: "Push Notifications" },
];

type Rule = {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  module: string;
  action: string;
  unitPrice: string;
  currency: string;
  effectiveFrom: Date;
  note: string | null;
  createdAt: Date;
};

type User = { id: string; name: string; email: string };

function formatPrice(price: string) {
  const n = Number(price);
  if (n === 0) return "$0.00";
  // Show up to 6 sig figs
  return `$${n.toFixed(6).replace(/\.?0+$/, "")}`;
}

function StatusBadge({ effectiveFrom }: { effectiveFrom: Date }) {
  const now = new Date();
  const d = new Date(effectiveFrom);
  if (d <= now) return <Badge variant="default">Active</Badge>;
  return <Badge variant="secondary">Scheduled</Badge>;
}

function RuleTable({
  rules,
  onDelete,
  isPending,
}: {
  rules: Rule[];
  onDelete: (id: string) => void;
  isPending: boolean;
}) {
  if (rules.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        No rules yet. Add one above.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Scope</TableHead>
            <TableHead>Module</TableHead>
            <TableHead>Unit Price</TableHead>
            <TableHead>Effective From</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Note</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                {r.userId ? (
                  <div>
                    <p className="font-medium text-sm">{r.userName}</p>
                    <p className="text-xs text-muted-foreground">{r.userEmail}</p>
                  </div>
                ) : (
                  <span className="flex items-center gap-1 text-sm font-medium text-primary">
                    <Globe className="size-3" /> Default
                  </span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {MODULES.find((m) => m.value === r.module)?.label ?? r.module}
                </Badge>
              </TableCell>
              <TableCell className="font-mono font-semibold">
                {formatPrice(r.unitPrice)}
                <span className="text-xs text-muted-foreground"> / {r.action}</span>
              </TableCell>
              <TableCell className="text-sm">
                {new Date(r.effectiveFrom).toLocaleString()}
              </TableCell>
              <TableCell>
                <StatusBadge effectiveFrom={new Date(r.effectiveFrom)} />
              </TableCell>
              <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                {r.note ?? "—"}
              </TableCell>
              <TableCell>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isPending}>
                      <Trash2 className="size-4 text-destructive" />
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
                      <AlertDialogAction onClick={() => onDelete(r.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function PricingManager({ rules, users }: { rules: Rule[]; users: User[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [scope, setScope] = useState<"default" | "user">("default");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [module, setModule] = useState("email_marketing");
  const [unitPrice, setUnitPrice] = useState("0.001000");
  const [effectiveFrom, setEffectiveFrom] = useState(
    () => new Date().toISOString().slice(0, 16)
  );
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  function resetForm() {
    setScope("default");
    setSelectedUserId("");
    setModule("email_marketing");
    setUnitPrice("0.001000");
    setEffectiveFrom(new Date().toISOString().slice(0, 16));
    setNote("");
    setError("");
  }

  function handleCreate() {
    const priceNum = Number(unitPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setError("Unit price must be a valid non-negative number.");
      return;
    }
    if (scope === "user" && !selectedUserId) {
      setError("Please select a user.");
      return;
    }

    setError("");
    startTransition(async () => {
      await createPricingRule({
        userId: scope === "user" ? selectedUserId : null,
        module,
        unitPrice: priceNum.toFixed(6),
        effectiveFrom: new Date(effectiveFrom),
        note: note || undefined,
      });
      setDialogOpen(false);
      resetForm();
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deletePricingRule(id);
      router.refresh();
    });
  }

  const defaultRules = rules.filter((r) => !r.userId);
  const userRules = rules.filter((r) => !!r.userId);

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
        <CardContent className="flex gap-3 py-4">
          <Info className="size-4 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <strong>How pricing works:</strong> When a campaign sends, the system charges the user's wallet.
            User-specific overrides take priority over default rates. The most recent rule where
            <em> Effective From</em> ≤ now is used — schedule future rules to plan price changes in advance.
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          Add Pricing Rule
        </Button>
      </div>

      <Tabs defaultValue="defaults">
        <TabsList>
          <TabsTrigger value="defaults">
            <Globe className="size-4 mr-1" />
            Default Rates ({defaultRules.length})
          </TabsTrigger>
          <TabsTrigger value="overrides">
            <User className="size-4 mr-1" />
            User Overrides ({userRules.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="defaults" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Default Pricing</CardTitle>
              <CardDescription>
                Applies to all users who don't have a custom override for that module.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <RuleTable
                rules={defaultRules}
                onDelete={handleDelete}
                isPending={isPending}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overrides" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">User-Specific Overrides</CardTitle>
              <CardDescription>
                Custom rates for individual users — higher-tier users typically get lower rates.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <RuleTable
                rules={userRules}
                onDelete={handleDelete}
                isPending={isPending}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add rule dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { setDialogOpen(false); resetForm(); } else setDialogOpen(true); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Pricing Rule</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Scope */}
            <div className="space-y-2">
              <Label>Applies To</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setScope("default")}
                  className={`rounded-lg border p-3 text-sm text-left transition-colors ${
                    scope === "default"
                      ? "border-primary bg-primary/5 font-medium"
                      : "hover:bg-muted"
                  }`}
                >
                  <Globe className="size-4 mb-1 text-primary" />
                  Default (all users)
                </button>
                <button
                  type="button"
                  onClick={() => setScope("user")}
                  className={`rounded-lg border p-3 text-sm text-left transition-colors ${
                    scope === "user"
                      ? "border-primary bg-primary/5 font-medium"
                      : "hover:bg-muted"
                  }`}
                >
                  <User className="size-4 mb-1 text-primary" />
                  Specific user
                </button>
              </div>
            </div>

            {/* User selector */}
            {scope === "user" && (
              <div className="space-y-2">
                <Label>User</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} — {u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Module */}
            <div className="space-y-2">
              <Label>Module</Label>
              <Select value={module} onValueChange={setModule}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODULES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Unit price */}
            <div className="space-y-2">
              <Label>Unit Price (MYR per send)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">RM</span>
                <Input
                  className="pl-9 font-mono"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="0.001000"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                e.g. RM0.001 = RM1.00 per 1,000 sends · RM0.05 = RM50 per 1,000 SMS
              </p>
            </div>

            {/* Effective from */}
            <div className="space-y-2">
              <Label>Effective From</Label>
              <Input
                type="datetime-local"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Set a future date to schedule a price change (e.g. first of next month).
              </p>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Enterprise tier — Q3 2026 rate"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isPending}>
              {isPending ? "Saving..." : "Add Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
