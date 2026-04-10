import { unstable_noStore as noStore } from "next/cache";
import { getAllPricingRules, getAllUsers } from "@/lib/actions/admin";
import { PricingManager } from "./pricing-manager";

export default async function AdminPricingPage() {
  noStore();
  const [rules, users] = await Promise.all([
    getAllPricingRules(),
    getAllUsers(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pricing Rules</h1>
        <p className="text-muted-foreground">
          Set default send rates and per-user overrides. Scheduled effective dates let you plan price changes in advance.
        </p>
      </div>
      <PricingManager rules={rules} users={users} />
    </div>
  );
}
