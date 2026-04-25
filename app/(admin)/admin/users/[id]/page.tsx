import {fetchUserFullDetails} from "@/lib/actions/admin/users";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {HugeIcon} from "@/components/huge-icon";
import {notFound} from "next/navigation";

import {ProfileTab} from "./_components/profile-tab";
import {BillingTab} from "./_components/billing-tab";
import {MarketingTab} from "./_components/marketing-tab";
import React from "react";

export default async function UserDetailsPage({params}: {
    params: Promise<{ id: string }>
}) {
    // 1. Await the params to get the ID
    const {id} = await params;

    // 2. Fetch the data
    const data = await fetchUserFullDetails(id);

    // 3. Check if user exists
    if (!data.profile)
        return notFound();

    const {user: u, audience: a, wallets: w} = data.profile;
    const balance = parseFloat(w?.balance ?? "0");

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold">{u.name}</h1>
                    <p className="text-muted-foreground">{u.email}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-muted-foreground">Main Balance</p>
                    <p className="text-2xl font-mono font-bold text-green-600">
                        MYR {balance.toFixed(2)}
                    </p>
                </div>
            </header>

            <Tabs defaultValue="profile" className="w-full">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <TabsList className="max-w-[400px]">
                        <TabsTrigger value="profile">
                            <HugeIcon name="UserCircleIcon" size={14} className="mr-2"/> Profile
                        </TabsTrigger>

                        <TabsTrigger value="billing">
                            <HugeIcon name="GlobalIcon" size={14} className="mr-2"/> Billing
                        </TabsTrigger>

                        <TabsTrigger value="marketing">
                            <HugeIcon name="GlobalIcon" size={14} className="mr-2"/> Schedule
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="profile" className="mt-6">
                    <ProfileTab user={u} audience={a}/>
                </TabsContent>

                <TabsContent value="billing" className="mt-6">
                    <BillingTab transactions={data.transactions}/>
                </TabsContent>

                <TabsContent value="marketing" className="mt-6">
                    <MarketingTab campaigns={data.ongoingCampaigns}/>
                </TabsContent>

            </Tabs>
        </div>
    );
}