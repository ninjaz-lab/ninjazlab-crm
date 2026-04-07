"use client";

import { useState } from "react";
import { adjustBalance } from "@/lib/actions/admin";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, MinusCircle } from "lucide-react";

type Account = {
  id: string | null;
  userId: string;
  balance: string | null;
  currency: string | null;
  updatedAt: Date | null;
  name: string;
  email: string;
  image: string | null;
};

type AdjustDialog = {
  open: boolean;
  userId: string;
  name: string;
  type: "credit" | "debit";
};

export function AccountsTable({ accounts }: { accounts: Account[] }) {
  const [dialog, setDialog] = useState<AdjustDialog>({
    open: false,
    userId: "",
    name: "",
    type: "credit",
  });
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  function openDialog(userId: string, name: string, type: "credit" | "debit") {
    setDialog({ open: true, userId, name, type });
    setAmount("");
    setNote("");
  }

  async function handleAdjust() {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;
    setLoading(true);
    await adjustBalance(dialog.userId, parsed, dialog.type, note);
    setLoading(false);
    setDialog((d) => ({ ...d, open: false }));
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No accounts yet. Accounts are created on first balance adjustment.
                </TableCell>
              </TableRow>
            )}
            {accounts.map((a) => {
              const initials = a.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
              const balance = parseFloat(a.balance ?? "0");

              return (
                <TableRow key={a.userId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarImage src={a.image ?? ""} alt={a.name} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{a.name}</p>
                        <p className="text-xs text-muted-foreground">{a.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        balance < 0
                          ? "text-destructive font-semibold"
                          : "font-semibold"
                      }
                    >
                      {balance < 0 ? "-" : ""}${Math.abs(balance).toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{a.currency ?? "USD"}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {a.updatedAt ? new Date(a.updatedAt).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-600 hover:bg-green-50"
                        onClick={() => openDialog(a.userId, a.name, "credit")}
                      >
                        <PlusCircle className="size-4" />
                        Credit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive hover:bg-red-50"
                        onClick={() => openDialog(a.userId, a.name, "debit")}
                      >
                        <MinusCircle className="size-4" />
                        Debit
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialog.open} onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog.type === "credit" ? "Credit" : "Debit"} — {dialog.name}
            </DialogTitle>
            <DialogDescription>
              {dialog.type === "credit"
                ? "Add funds to this user's account."
                : "Deduct funds from this user's account."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Input
                id="note"
                placeholder="Reason for adjustment..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog((d) => ({ ...d, open: false }))}>
              Cancel
            </Button>
            <Button
              variant={dialog.type === "credit" ? "default" : "destructive"}
              onClick={handleAdjust}
              disabled={loading || !amount}
            >
              {loading ? "Processing..." : dialog.type === "credit" ? "Credit" : "Debit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
