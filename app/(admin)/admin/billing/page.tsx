import {unstable_noStore as noStore} from "next/cache";
import {fetchAllTransactions} from "@/lib/actions/admin/billing";
import {AdminBillingTable} from "./_components/billing-table";
import {PageHeader} from "@/components/page-header";
import {HugeIcon} from "@/components/huge-icon";

export default async function AdminBillingPage() {
    noStore();
    const transactions = await fetchAllTransactions();

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">

            <PageHeader
                title="Billing Management"
                description="Review and approve manual wallet top-ups across all users"
                tag="Admin Only"
                tagClassName="text-rose-600"
            >
                <div
                    className="h-8 w-8 rounded-md border flex items-center justify-center bg-card shadow-sm text-muted-foreground">
                    <HugeIcon name="TwoFactorAccessIcon" size={16}/>
                </div>
            </PageHeader>

            <div className="bg-background border rounded-xl shadow-sm">
                <AdminBillingTable transactions={transactions}/>
            </div>
        </div>
    );
}
