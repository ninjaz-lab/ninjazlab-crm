import {revalidatePath, unstable_noStore as noStore} from "next/cache";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Button} from "@/components/ui/button";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {HugeIcon} from "@/components/huge-icon";
import {PageHeader} from "@/components/page-header";
import {getSession} from "@/lib/session";
import {db} from "@/lib/db";
import {user as userTable} from "@/lib/db/schema";
import {eq} from "drizzle-orm";

export default async function SettingsPage() {
    noStore();

    const session = await getSession();
    const user = session.user;

    // Server Action for Personal Profile
    async function updateProfile(formData: FormData) {
        "use server";
        const newName = formData.get("name") as string;
        if (!newName || newName.trim() === "") return;

        const activeSession = await getSession();
        await db.update(userTable)
            .set({name: newName, updatedAt: new Date()})
            .where(eq(userTable.id, activeSession.user.id));

        revalidatePath("/settings");
    }

    // Server Action for Workspace Details (Ready for when you update your DB)
    async function updateWorkspace(formData: FormData) {
        "use server";
        // Example: const company = formData.get("companyName");
        // await db.update(workspaceTable)...
        revalidatePath("/settings");
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-2">

            <PageHeader title="Settings"
                        description="Manage your account, workspace, and billing preferences."
            >
                <div
                    className="h-8 w-8 rounded-md border flex items-center justify-center bg-card shadow-sm text-muted-foreground">
                    <HugeIcon name="Settings02Icon" size={16}/>
                </div>
            </PageHeader>

            <Tabs defaultValue="general" className="space-y-6">

                <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 space-x-6">
                    <TabsTrigger value="general"
                                 className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2">
                        General
                    </TabsTrigger>
                    <TabsTrigger value="workspace"
                                 className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2">
                        Workspace
                    </TabsTrigger>
                    <TabsTrigger value="security"
                                 className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2">
                        Security
                    </TabsTrigger>
                </TabsList>

                {/* ─── TAB: GENERAL (Personal Info) ─── */}
                <TabsContent value="general" className="space-y-6 focus-visible:outline-none">
                    <form action={updateProfile}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Personal Information</CardTitle>
                                <CardDescription>This is how others will see you on the platform.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 max-w-xl">
                                {/* Avatar placeholder - crucial for modern SaaS */}
                                <div className="flex items-center gap-4 pb-4">
                                    <div
                                        className="h-16 w-16 rounded-full bg-muted border flex items-center justify-center overflow-hidden">
                                        <HugeIcon name="UserCircleIcon" size={32} className="text-muted-foreground/50"/>
                                    </div>
                                    <Button variant="outline" size="sm" type="button">Upload Avatar</Button>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" name="name" defaultValue={user.name} required/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input id="email"
                                           type="email"
                                           defaultValue={user.email}
                                           disabled
                                           className="bg-muted/50 cursor-not-allowed"/>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mt-1">
                                        Contact support to change your email
                                    </p>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t bg-muted/20 px-6 py-4">
                                <Button type="submit">Save Changes</Button>
                            </CardFooter>
                        </Card>
                    </form>
                </TabsContent>

                {/* ─── TAB: WORKSPACE (Company Info) ─── */}
                <TabsContent value="workspace" className="space-y-6 focus-visible:outline-none">
                    <form action={updateWorkspace}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Workspace Details</CardTitle>
                                <CardDescription>Manage your company details and global defaults.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 max-w-xl">
                                <div className="space-y-2">
                                    <Label htmlFor="companyName">Company Name</Label>
                                    <Input id="companyName" name="companyName" placeholder="Acme Corp, Inc."/>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Support Phone</Label>
                                        <Input id="phone" name="phone" placeholder="+1 (555) 000-0000"/>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="timezone">Default Timezone</Label>
                                        <Input id="timezone" name="timezone" defaultValue="Asia/Kuala_Lumpur" disabled/>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t bg-muted/20 px-6 py-4">
                                <Button type="submit">Save Workspace</Button>
                            </CardFooter>
                        </Card>
                    </form>
                </TabsContent>

                {/* ─── TAB: SECURITY (Roles & Danger Zone) ─── */}
                <TabsContent value="security" className="space-y-6 focus-visible:outline-none">
                    <Card>
                        <CardHeader>
                            <CardTitle>Account Security</CardTitle>
                            <CardDescription>Review your access level and verification status.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between border-b pb-4">
                                <div className="space-y-0.5">
                                    <Label>Account Role</Label>
                                    <p className="text-sm text-muted-foreground">Your permission level across the
                                        workspace.</p>
                                </div>
                                <div
                                    className="flex items-center gap-2 font-medium capitalize bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                                    <HugeIcon name="UserCircleIcon" size={16}/>
                                    {user.role}
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Email Status</Label>
                                    <p className="text-sm text-muted-foreground">Used for password resets and critical
                                        alerts.</p>
                                </div>
                                <div className="flex items-center gap-2 font-medium text-sm">
                                    {user.emailVerified ? (
                                        <span
                                            className="text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full flex items-center gap-1.5">
                                            <HugeIcon name="CheckmarkBadge01Icon" size={16}/> Verified
                                        </span>
                                    ) : (
                                        <span
                                            className="text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full flex items-center gap-1.5">
                                            <HugeIcon name="Alert02Icon" size={16}/> Unverified
                                        </span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Standard SaaS Danger Zone */}
                    <Card className="border-rose-500/20 bg-rose-500/5">
                        <CardHeader>
                            <CardTitle className="text-rose-600">Danger Zone</CardTitle>
                            <CardDescription>Permanently delete your account and all associated data.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="destructive">Delete Account</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    );
}