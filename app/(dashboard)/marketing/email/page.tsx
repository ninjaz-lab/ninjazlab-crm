import {unstable_noStore as noStore} from "next/cache";
import Link from "next/link";
import {fetchEmailCampaigns} from "@/lib/actions/email-marketing";
import {fetchEmailTemplates} from "@/lib/actions/email-template";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Badge} from "@/components/ui/badge";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table";
import {FileText, Mail, Plus} from "lucide-react";
import {TemplateRowActions} from "./_components/template-row-actions";
import {CAMPAIGN_STATUS} from "@/lib/enums";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    draft: "secondary",
    scheduled: "outline",
    sending: "default",
    sent: "default",
    paused: "secondary",
    cancelled: "destructive",
    published: "default",
};

export default async function EmailMarketingPage() {
    noStore();
    const [campaigns, templates] = await Promise.all([
        fetchEmailCampaigns(),
        fetchEmailTemplates(),
    ]);

    const totalSent = campaigns.reduce((s, c) => s + (c.sentCount ?? 0), 0);
    const totalOpened = campaigns.reduce((s, c) => s + (c.openedCount ?? 0), 0);
    const avgOpenRate =
        totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : "0.0";

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Email Marketing</h1>
                    <p className="text-muted-foreground">
                        Create, schedule and track email campaigns.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline" className="font-bold shadow-sm">
                        <Link href="/marketing/email/templates/new">
                            <FileText className="size-4 mr-2"/>
                            New Template
                        </Link>
                    </Button>
                    <Button asChild className="font-bold shadow-sm">
                        <Link href="/marketing/email/campaigns/new">
                            <Plus className="size-4 mr-2"/>
                            New Campaign
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Campaigns</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{campaigns.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Templates</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{templates.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalSent.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Avg Open Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgOpenRate}%</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="campaigns">
                <TabsList>
                    <TabsTrigger value="campaigns">
                        <Mail className="size-4 mr-1"/>
                        Campaigns ({campaigns.length})
                    </TabsTrigger>
                    <TabsTrigger value="templates">
                        <FileText className="size-4 mr-1"/>
                        Templates ({templates.length})
                    </TabsTrigger>
                </TabsList>

                {/* Campaigns tab */}
                <TabsContent value="campaigns" className="mt-4">
                    <div className="rounded-md border bg-card shadow-sm">
                        <Table>
                            <TableHeader className="bg-muted/40">
                                <TableRow>
                                    <TableHead className="font-bold w-[50px]">#</TableHead>
                                    <TableHead className="font-bold">Campaign</TableHead>
                                    <TableHead className="font-bold">From</TableHead>
                                    <TableHead className="font-bold">Status</TableHead>
                                    <TableHead className="font-bold">Recipients</TableHead>
                                    <TableHead className="font-bold">Sent</TableHead>
                                    <TableHead className="font-bold">Opened</TableHead>
                                    <TableHead className="font-bold">Scheduled</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {campaigns.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8}
                                                   className="py-8 text-center text-muted-foreground font-medium">
                                            No campaigns yet.{" "}
                                            <Link href="/marketing/email/campaigns/new"
                                                  className="underline hover:text-foreground">
                                                Create your first campaign
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {campaigns.map((c, index) => (
                                    <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="text-muted-foreground font-medium">{index + 1}</TableCell>
                                        <TableCell>
                                            <Link
                                                href={`/marketing/email/campaigns/${c.id}`}
                                                className="font-bold hover:underline"
                                            >
                                                {c.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {c.fromName} &lt;{c.fromEmail}&gt;
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={statusVariant[c.status] ?? "secondary"}
                                                   className="uppercase text-[10px] tracking-wider">
                                                {c.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{c.totalRecipients}</TableCell>
                                        <TableCell>{c.sentCount}</TableCell>
                                        <TableCell>
                                            {c.sentCount > 0
                                                ? `${((c.openedCount / c.sentCount) * 100).toFixed(1)}%`
                                                : "—"}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {c.scheduledAt
                                                ? new Date(c.scheduledAt).toLocaleString()
                                                : "—"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                {/* Templates tab */}
                <TabsContent value="templates" className="mt-4">
                    <div className="rounded-md border bg-card shadow-sm">
                        <Table>
                            <TableHeader className="bg-muted/40">
                                <TableRow>
                                    <TableHead className="font-bold w-[50px]">#</TableHead>
                                    <TableHead className="font-bold">Template Name</TableHead>
                                    <TableHead className="font-bold">Subject Line</TableHead>
                                    <TableHead className="font-bold w-[120px]">Status</TableHead>
                                    <TableHead className="font-bold text-right w-[150px]">Last Updated</TableHead>
                                    <TableHead className="w-[160px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {templates.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6}
                                                   className="h-32 text-center text-muted-foreground font-medium">
                                            No templates yet.{" "}
                                            <Link href="/marketing/email/templates/new"
                                                  className="underline hover:text-foreground">
                                                Create your first template
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    templates.map((t, index) => (
                                        <TableRow key={t.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell
                                                className="text-muted-foreground font-medium">{index + 1}</TableCell>
                                            <TableCell className="font-bold">{t.name}</TableCell>
                                            <TableCell className="text-muted-foreground max-w-[300px] truncate text-sm">
                                                {t.subject || "—"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={t.status === CAMPAIGN_STATUS.PUBLISHED ? "default" : "secondary"}
                                                    className="text-[10px] uppercase tracking-wider">
                                                    {t.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-xs text-muted-foreground">
                                                {new Date(t.updatedAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <TemplateRowActions templateId={t.id} htmlBody={t.htmlBody || ""}/>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

            </Tabs>
        </div>
    );
}