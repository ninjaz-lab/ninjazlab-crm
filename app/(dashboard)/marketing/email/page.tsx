import {unstable_noStore as noStore} from "next/cache";
import Link from "next/link";
import {fetchEmailTemplates, getEmailCampaigns} from "@/lib/actions/email-marketing";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Badge} from "@/components/ui/badge";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table";
import {FileText, Mail, Plus} from "lucide-react";

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
    getEmailCampaigns(),
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
          <Button asChild variant="outline">
            <Link href="/marketing/email/templates/new">
              <FileText className="size-4" />
              New Template
            </Link>
          </Button>
          <Button asChild>
            <Link href="/marketing/email/campaigns/new">
              <Plus className="size-4" />
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
            <Mail className="size-4 mr-1" />
            Campaigns ({campaigns.length})
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="size-4 mr-1" />
            Templates ({templates.length})
          </TabsTrigger>
        </TabsList>

        {/* Campaigns tab */}
        <TabsContent value="campaigns" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Scheduled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      No campaigns yet.{" "}
                      <Link href="/marketing/email/campaigns/new" className="underline">
                        Create your first campaign
                      </Link>
                    </TableCell>
                  </TableRow>
                )}
                {campaigns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link
                        href={`/marketing/email/campaigns/${c.id}`}
                        className="font-medium hover:underline"
                      >
                        {c.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.fromName} &lt;{c.fromEmail}&gt;
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[c.status] ?? "secondary"}>
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
          <div className="grid gap-4 md:grid-cols-3">
            {templates.length === 0 && (
              <div className="col-span-3 py-12 text-center text-muted-foreground">
                No templates yet.{" "}
                <Link href="/marketing/email/templates/new" className="underline">
                  Create your first template
                </Link>
              </div>
            )}
            {templates.map((t) => (
              <Card key={t.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{t.name}</CardTitle>
                    <Badge variant={statusVariant[t.status] ?? "secondary"} className="text-xs">
                      {t.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.subject}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground mb-3">
                    {t.previewText ?? "No preview text"}
                  </p>
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline" className="flex-1">
                      <Link href={`/marketing/email/templates/${t.id}`}>Edit</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}
