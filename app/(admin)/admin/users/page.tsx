import { unstable_noStore as noStore } from "next/cache";
import { getAllUsers } from "@/lib/actions/admin";
import { UsersTable } from "./users-table";

export default async function AdminUsersPage() {
  noStore();
  const users = await getAllUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          Manage user roles, ban status, and access.
        </p>
      </div>
      <UsersTable users={users} />
    </div>
  );
}
