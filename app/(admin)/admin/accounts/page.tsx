import { unstable_noStore as noStore } from "next/cache";
import { getAllAccounts } from "@/lib/actions/admin";
import { AccountsTable } from "./accounts-table";

export default async function AdminAccountsPage() {
  noStore();
  const accounts = await getAllAccounts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
        <p className="text-muted-foreground">
          View and manage user account balances.
        </p>
      </div>
      <AccountsTable accounts={accounts} />
    </div>
  );
}
