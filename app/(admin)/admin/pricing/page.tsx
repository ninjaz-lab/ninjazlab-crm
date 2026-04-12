import {unstable_noStore as noStore} from "next/cache";
import {PricingManager} from "./_components/pricing-manager";
import {HugeIcon} from "@/components/huge-icon";
import {fetchAllUsers} from "@/lib/actions/admin/users";
import {fetchAllPricingRules} from "@/lib/actions/admin/pricing";
import {PageHeader} from "@/components/page-header";

export default async function AdminPricingPage() {
    noStore();
    const [rules, users] = await Promise.all([
        fetchAllPricingRules(),
        fetchAllUsers(),
    ]);

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-2">

            <PageHeader
                title="Pricing Management"
                description="Global module rates and user overrides"
                tag="Admin Only"
                tagClassName="text-rose-600"
            >
                <div
                    className="h-8 w-8 rounded-md border flex items-center justify-center bg-card shadow-sm text-muted-foreground">
                    <HugeIcon name="MoneyBag02Icon" size={16}/>
                </div>
            </PageHeader>

            <PricingManager
                rules={rules}
                users={users}
            />
        </div>
    );
}