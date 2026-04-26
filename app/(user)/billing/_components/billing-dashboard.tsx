"use client";

import React, {useMemo} from "react";
import {HugeIcon} from "@/components/huge-icon";
import {Button} from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {cn} from "@/lib/utils/utils";
import {formatAmount} from "@/lib/utils/amount";
import {TransactionsTab} from "./transactions-tab";
import {InvoicesTab} from "./invoices-tab";
import {useUserBillingDashboard} from "@/hooks/use-user-billing-dashboard";

interface Props {
    transactions: any[];
}

export function BillingDashboard({transactions}: Props) {
    const {
        activeTab,
        setActiveTab,
        isTopUpOpen,
        setIsTopUpOpen,
        topUpAmount,
        setTopUpAmount,
        receipt,
        setReceipt,
        isPending,
        invoicesOnly,
        handleCopy,
        handleSubmit,
        handleCloseDialog,
    } = useUserBillingDashboard({transactions});

    const TopUpAction = (
        <Button onClick={() => setIsTopUpOpen(true)}
                className="w-full sm:w-auto font-black uppercase tracking-tighter shadow-lg shadow-primary/20"
        >
            <HugeIcon name="PlusSignIcon" size={16} className="mr-2"/>
            Top Up
        </Button>
    );

    const PRESET_AMOUNTS = ["100", "200", "500", "1000", "10000"];

    return (
        <>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <TabsList className="max-w-[400px]">
                        <TabsTrigger value="transactions">
                            <HugeIcon name="TransactionIcon" size={14} className="mr-2"/> Transactions
                        </TabsTrigger>

                        <TabsTrigger value="invoices">
                            <HugeIcon name="Invoice01Icon" size={14} className="mr-2"/> Invoices
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="transactions" className="m-0 outline-none">
                    <TransactionsTab data={transactions} actionSlot={TopUpAction}/>
                </TabsContent>

                <TabsContent value="invoices" className="m-0 outline-none">
                    <InvoicesTab data={invoicesOnly}
                                 actionSlot={TopUpAction}/>
                </TabsContent>
            </Tabs>

            <Dialog open={isTopUpOpen} onOpenChange={(open) => {
                if (!open) {
                    handleCloseDialog();
                } else {
                    setIsTopUpOpen(true);
                }
            }}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
                    <DialogHeader className="p-6 bg-muted/20 border-b">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <HugeIcon name="WalletAdd01Icon" size={24} className="text-primary"/>
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black tracking-tighter">
                                    Manual Bank Transfer
                                </DialogTitle>
                                <DialogDescription className="text-sm font-medium">
                                    Transfer funds to our account and upload the receipt.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6 space-y-6">

                        <div
                            className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm font-medium space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Our Bank
                                Details</p>
                            <div className="flex justify-between border-b border-primary/10 pb-1">
                                <span className="text-muted-foreground">Bank Name:</span>
                                <span className="font-bold">{process.env.NEXT_PUBLIC_NINJAZ_BANK_NAME}</span>
                            </div>
                            <div className="flex justify-between border-b border-primary/10 pb-1">
                                <span className="text-muted-foreground">Account Name:</span>
                                <span className="font-bold">{process.env.NEXT_PUBLIC_NINJAZ_BANK_ACCOUNT_NAME}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Account Number:</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold font-mono text-primary">
                                        {process.env.NEXT_PUBLIC_NINJAZ_BANK_ACCOUNT_NUMBER}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors"
                                        onClick={() => handleCopy(process.env.NEXT_PUBLIC_NINJAZ_BANK_ACCOUNT_NUMBER)}
                                        title="Copy Account Number"
                                    >
                                        <HugeIcon name="Copy01Icon" size={12}/>
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                Select Transfer Amount
                            </Label>
                            <div className="grid grid-cols-4 gap-2">
                                {PRESET_AMOUNTS.map((amt) => (
                                    <Button key={amt} type="button" variant="outline"
                                            onClick={() => setTopUpAmount(amt)} disabled={isPending}
                                            className={
                                                cn("h-10 font-black transition-all border-2",
                                                    topUpAmount === amt
                                                        ? "border-primary bg-primary/5 text-primary shadow-inner"
                                                        : "text-muted-foreground hover:border-muted-foreground/50"
                                                )}
                                    >
                                        MYR {formatAmount(amt)}
                                    </Button>
                                ))}
                            </div>
                            <div className="relative mt-2">
                                <Input type="number"
                                       className="pl-4 font-mono font-black text-lg bg-muted/20 border-none h-12"
                                       value={topUpAmount}
                                       onChange={(e) => setTopUpAmount(e.target.value)}
                                       placeholder="Other Amount..."
                                       disabled={isPending}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                Upload Receipt (PDF, JPG, PNG)
                            </Label>
                            <Input type="file"
                                   accept="image/*,.pdf"
                                   onChange={(e) => setReceipt(e.target.files?.[0] || null)}
                                   disabled={isPending}
                                   className="bg-muted/20 border-dashed border-2 cursor-pointer h-12 file:h-full file:bg-primary/10 file:text-primary file:font-bold file:border-none file:mr-4 file:px-4 file:rounded-md"
                            />
                        </div>

                    </div>

                    <DialogFooter className="p-6 bg-muted/20 border-t gap-3">
                        <Button variant="ghost"
                                onClick={handleCloseDialog}
                                className="font-bold"
                                disabled={isPending}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit}
                                disabled={isPending || !receipt}
                                className="font-black uppercase tracking-tighter px-8">
                            {isPending ? "Submitting..." : "Submit Receipt"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}