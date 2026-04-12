import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {format} from "date-fns";

export function BillingTab({transactions}: { transactions: any[] }) {
    return (
        <Card>
            <CardHeader><CardTitle>Transaction History</CardTitle></CardHeader>
            <CardContent>
                <div className="space-y-1">
                    {transactions.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4">No transactions recorded yet.</p>
                    ) : (
                        transactions.map((tx) => (
                            <div key={tx.id} className="flex justify-between items-center py-3 border-b last:border-0">
                                <div>
                                    <p className="text-sm font-semibold">{tx.note || tx.module}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {format(new Date(tx.createdAt), "MMM d, yyyy • HH:mm")}
                                    </p>
                                </div>
                                <div
                                    className={`font-mono font-bold ${tx.type === 'debit' ? 'text-destructive' : 'text-green-600'}`}>
                                    {tx.type === 'debit' ? '-' : '+'} {parseFloat(tx.amount).toFixed(2)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}