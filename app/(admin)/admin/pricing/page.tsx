import {unstable_noStore as noStore} from "next/cache";
import {PricingDashboard} from "./_components/pricing-dashboard";
import {HugeIcon} from "@/components/huge-icon";
import {fetchAllUsers} from "@/lib/actions/admin/users";
import {fetchAllPricingRules} from "@/lib/actions/admin/pricing";
import {PageHeader} from "@/components/page-header";
import {ADMIN_CONTAINER_CLASS} from "@/lib/constants/admin";

export default async function AdminPricingPage() {
    noStore();

    const [rules, users] = await Promise.all([
        fetchAllPricingRules(),
        fetchAllUsers(),
    ]);

    return (
        <div className={ADMIN_CONTAINER_CLASS}>

            <PageHeader title="Pricing"
                        description="Set unit prices for campaigns modules"
                        tag="Admin Only"
                        tagClassName="text-rose-600"
            >
                <div
                    className="h-8 w-8 rounded-md border flex items-center justify-center bg-card shadow-sm text-muted-foreground">
                    <HugeIcon name="MoneyBag02Icon" size={16}/>
                </div>
            </PageHeader>

            <PricingDashboard rules={rules}
                              users={users}
            />
        </div>
    );
}