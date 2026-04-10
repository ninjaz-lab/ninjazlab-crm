import {fetchUserFullDetails} from "@/lib/actions/admin";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {CalendarDays, History, UserCircle} from "lucide-react";
import {format} from "date-fns";
import {notFound} from "next/navigation";
import {Label} from "@/components/ui/label";
import {USER_ROLES} from "@/lib/enums";

export default async function UserDetailsPage({params}: {
    params: Promise<{ id: string }>
}) {
    // 1. Await the params to get the ID
    const {id} = await params;

    // 2. Fetch the data
    const data = await fetchUserFullDetails(id);

    // 3. Check if user exists (Drizzle returns undefined if no rows match)
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
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                    <TabsTrigger value="profile"><UserCircle className="size-4 mr-2"/> Profile</TabsTrigger>
                    <TabsTrigger value="billing"><History className="size-4 mr-2"/> Billing</TabsTrigger>
                    <TabsTrigger value="marketing"><CalendarDays className="size-4 mr-2"/> Schedule</TabsTrigger>
                </TabsList>

                {/* --- PROFILE TAB --- */}
                <TabsContent value="profile" className="mt-6">
                    <Card>
                        <CardHeader><CardTitle>Client Information</CardTitle></CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Location</Label>
                                    <p className="font-medium">{a?.address || "No address provided"}</p>
                                    <p className="text-sm">{a?.city} {a?.state} {a?.postalCode}</p>
                                    <p className="text-sm">{a?.country}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Contact</Label>
                                    <p className="font-medium">{a?.phone || "No phone provided"}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-xs text-muted-foreground">System Status</Label>
                                    <div className="flex gap-2 mt-1">
                                        <Badge variant={u.role === USER_ROLES.ADMIN
                                            ? "default"
                                            : "secondary"}>
                                            {u.role}
                                        </Badge>
                                        {u.banned && <Badge variant="destructive">Banned</Badge>}
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Account Created</Label>
                                    <p className="text-sm">{format(new Date(u.createdAt), "PPP")}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- BILLING TAB --- */}
                <TabsContent value="billing" className="mt-6">
                    <Card>
                        <CardHeader><CardTitle>Transaction History</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-1">
                                {data.transactions.length === 0 ? (
                                    <p className="text-sm text-muted-foreground py-4">No transactions recorded yet.</p>
                                ) : (
                                    data.transactions.map((tx) => (
                                        <div key={tx.id}
                                             className="flex justify-between items-center py-3 border-b last:border-0">
                                            <div>
                                                <p className="text-sm font-semibold">{tx.note || tx.module}</p>
                                                <p className="text-xs text-muted-foreground">{format(new Date(tx.createdAt), "MMM d, yyyy • HH:mm")}</p>
                                            </div>
                                            <div
                                                className={`font-mono font-bold ${tx.type === 'debit' ? 'text-destructive' : 'text-green-600'}`}>
                                                {tx.type === 'debit' ? '-' : '+'} {parseFloat(tx.amount).toFixed(2)}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- MARKETING TAB --- */}
                <TabsContent value="marketing" className="mt-6">
                    <Card>
                        <CardHeader><CardTitle>Upcoming & Active Campaigns</CardTitle></CardHeader>
                        <CardContent>
                            {data.ongoingCampaigns.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-4">No ongoing campaigns for this
                                    user.</p>
                            ) : (
                                <div className="space-y-3">
                                    {data.ongoingCampaigns.map((cp) => (
                                        <div key={cp.id}
                                             className="flex items-center justify-between p-3 border rounded-md">
                                            <div className="flex items-center gap-3">
                                                <CalendarDays className="size-4 text-blue-500"/>
                                                <div>
                                                    <p className="text-sm font-semibold">{cp.name}</p>
                                                    <p className="text-xs capitalize text-muted-foreground">{cp.channel}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge className="mb-1">{cp.status}</Badge>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {cp.scheduledAt ? format(new Date(cp.scheduledAt), "MMM d, HH:mm") : "Draft"}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}