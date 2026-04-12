import {unstable_noStore as noStore} from "next/cache";
import {WalletManager} from "./_components/wallet-manager";
import {fetchUserWalletData} from "@/lib/actions/billing";
import {PageHeader} from "@/components/page-header";
import {HugeIcon} from "@/components/huge-icon";
import {MetricCard} from "@/components/metric-card";

export default async function BillingPage() {
    noStore();
    const walletData = await fetchUserWalletData();

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-2">

            <PageHeader title="Billing & Usage"
                        description="Manage your wallet balance and view your transaction history."
            >
                <div
                    className="h-8 w-8 rounded-md border flex items-center justify-center bg-card shadow-sm text-muted-foreground">
                    <HugeIcon name="Wallet02Icon" size={16}/>
                </div>
            </PageHeader>

            <div className="grid gap-4 md:grid-cols-4">

                {/* Balance Metric Card */}
                <MetricCard title="Available Balance"
                            icon="MoneyBag02Icon"
                            variant="primary"
                >
                    <div className="flex items-end gap-1.5 mt-0.5">
                        <span className="text-xs font-bold text-muted-foreground mb-1">MYR</span>
                        <span className="text-3xl font-black tracking-tighter">
                            {Number(walletData.balance || 0).toLocaleString("en-MY", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                        </span>
                    </div>
                </MetricCard>
            </div>

            {/* Transaction & Invoice Tables */}
            <WalletManager transactions={walletData.transactions}/>
        </div>
    );
}
