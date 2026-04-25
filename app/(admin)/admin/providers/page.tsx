import {unstable_noStore as noStore} from "next/cache";
import {HugeIcon} from "@/components/huge-icon";
import {PageHeader} from "@/components/page-header";
import {ProviderDashboard} from "@/app/(admin)/admin/providers/_components/provider-dashboard";
import {fetchTenants} from "@/lib/actions/admin/providers";
import {fetchAllUsers} from "@/lib/actions/admin/users";

export default async function ProvidersSettingsPage() {
    noStore();

    const [providers, users] = await Promise.all([
        fetchTenants(),
        fetchAllUsers()
    ]);

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-2">

            <PageHeader title="Service Providers"
                        description="Manage system-wide API configurations and tenant overrides"
                        tag="Admin Only"
                        tagClassName="text-rose-600"
            >
                <div
                    className="h-8 w-8 rounded-md border flex items-center justify-center bg-card shadow-sm text-muted-foreground">
                    <HugeIcon name="TwoFactorAccessIcon" size={16}/>
                </div>
            </PageHeader>

            <ProviderDashboard providers={providers as any}
                               users={users}/>
        </div>
    );
}
