import { unstable_noStore as noStore } from "next/cache";
import { getSystemProviders } from "@/lib/actions/admin";
import { SystemProviderForm } from "./system-provider-form";

export default async function AdminSettingsPage() {
  noStore();
  const providers = await getSystemProviders();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">
          Configure system-wide sending providers. These are used by all user campaigns.
        </p>
      </div>
      <SystemProviderForm providers={providers} />
    </div>
  );
}
