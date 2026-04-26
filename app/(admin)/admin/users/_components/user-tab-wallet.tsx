"use client";

import {Button} from "@/components/ui/button";
import {HugeIcon} from "@/components/huge-icon";
import {Input} from "@/components/ui/input";
import {DataTable} from "@/components/data-table/data-table";
import {getColumns} from "@/app/(admin)/admin/users/_components/columns-user-wallet";
import {USER_ROLES} from "@/lib/enums";

interface Props {
    adjustAmt: string;
    setAdjustAmt: (val: string) => void;
    adjustNote: string;
    setAdjustNote: (val: string) => void;
    isAdjusting: boolean;
    onAdjust: (type: "CREDIT" | "DEBIT") => void;
    pageSize: string;
    setPageSize: (val: string) => void;
    setTxPage: (val: number | ((prev: number) => number)) => void;
    txLoading: boolean;
    transactions: any[];
    txPage: number;
    totalTx: number;
    userRole?: string;
}

export function UserTabWallet({
                                  adjustAmt, setAdjustAmt,
                                  adjustNote, setAdjustNote,
                                  isAdjusting, onAdjust,
                                  pageSize, setPageSize,
                                  setTxPage, txLoading, transactions,
                                  txPage, totalTx,
                                  userRole,
                              }: Props) {
    const isSuperAdmin = userRole === USER_ROLES.SUPERADMIN;

    return (
        <>
            {/* Quick Adjustment - Only for Superadmin */}
            {isSuperAdmin && (
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden shrink-0">
                <div className="px-4 py-2.5 border-b bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <HugeIcon name="Wallet01Icon" size={11} className="text-muted-foreground"/>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Quick Adjustment
                        </h4>
                    </div>
                </div>
                <div className="p-4 space-y-3">
                    <div className="grid grid-cols-5 gap-2">
                        <Input placeholder="0.00"
                               type="number"
                               value={adjustAmt}
                               onChange={(e) => setAdjustAmt(e.target.value)}
                               className="col-span-2 h-9 text-xs font-mono font-bold bg-muted/30 border-muted-foreground/10"
                        />
                        <Input placeholder="Add a note..."
                               value={adjustNote}
                               onChange={(e) => setAdjustNote(e.target.value)}
                               className="col-span-3 h-9 text-xs bg-muted/30 border-muted-foreground/10"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Button size="sm"
                                onClick={() => onAdjust("CREDIT")}
                                disabled={isAdjusting || !adjustAmt}
                                className="h-9 text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <HugeIcon name="AddCircleIcon" size={14}/> Credit
                        </Button>
                        <Button size="sm"
                                onClick={() => onAdjust("DEBIT")}
                                disabled={isAdjusting || !adjustAmt}
                                className="h-9 text-xs font-bold gap-2 bg-rose-600 hover:bg-rose-700 text-white"
                        >
                            <HugeIcon name="RemoveCircleIcon" size={14}/> Debit
                        </Button>
                    </div>
                </div>
            </div>
            )}

            {/* Transaction DataTable */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 pb-2 custom-scrollbar">
                {txLoading ? (
                    <div className="py-20 flex justify-center">
                        <HugeIcon name="Loading02Icon" size={24} className="animate-spin text-muted-foreground"/>
                    </div>
                ) : (
                    <DataTable columns={getColumns}
                               data={transactions}
                               hideSearch
                               isServerSide
                               totalRows={totalTx}
                               currentPage={txPage}
                               pageSize={parseInt(pageSize)}
                               onPageChange={(page) => setTxPage(page)}
                               onPageSizeChange={(size) => {
                                   setPageSize(String(size));
                                   setTxPage(1);
                               }}
                    />
                )}
            </div>
        </>
    );
}
