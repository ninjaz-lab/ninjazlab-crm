import {unstable_noStore as noStore} from "next/cache";
import {fetchAllTransactions} from "@/lib/actions/admin/billing";
import {BillingDashboard} from "./_components/billing-dashboard";
import {PageHeader} from "@/components/page-header";
import {HugeIcon} from "@/components/huge-icon";
import {ADMIN_CONTAINER_CLASS} from "@/lib/constants/admin";

export default async function AdminBillingPage() {
    noStore();
    const transactions = await fetchAllTransactions();

    return (
        <div className={ADMIN_CONTAINER_CLASS}>

            <PageHeader title="Billing"
                        description="Manage system billing, invoices, and tenant subscriptions"
                        tag="Admin Only"
                        tagClassName="text-rose-600"
            >
                <div
                    className="h-8 w-8 rounded-md border flex items-center justify-center bg-card shadow-sm text-muted-foreground">
                    <HugeIcon name="TwoFactorAccessIcon" size={16}/>
                </div>
            </PageHeader>

            <BillingDashboard transactions={transactions}/>

        </div>
    );
}
