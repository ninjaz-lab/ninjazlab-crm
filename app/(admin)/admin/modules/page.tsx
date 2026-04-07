import { unstable_noStore as noStore } from "next/cache";
import { getAllUsersWithPermissions } from "@/lib/actions/admin";
import { ModulesTable } from "./modules-table";
import { MODULES } from "@/lib/db/schema";

export default async function AdminModulesPage() {
  noStore();
  const users = await getAllUsersWithPermissions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Module Access</h1>
        <p className="text-muted-foreground">
          Control which modules each user can access.
        </p>
      </div>
      <ModulesTable users={users} modules={MODULES} />
    </div>
  );
}
