import {unstable_noStore as noStore} from "next/cache";
import {fetchAllUsers, getAllPricingRules} from "@/lib/actions/admin";
import {PricingManager} from "./_components/pricing-manager";

export default async function AdminPricingPage() {
    noStore();
    const [rules, users] = await Promise.all([
        getAllPricingRules(),
        fetchAllUsers(),
    ]);

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-2">
            <div className="flex items-end justify-between border-b pb-4">
                <div className="space-y-0.5">
                    <h1 className="text-xl font-black tracking-tight uppercase">Pricing Management</h1>
                    <p className="text-xs font-medium text-muted-foreground">
                        Global module rates and user overrides • <span
                        className="text-rose-600 uppercase font-black tracking-widest text-[9px]">Admin Only</span>
                    </p>
                </div>
            </div>

            <PricingManager rules={rules} users={users}/>
        </div>
    );
}