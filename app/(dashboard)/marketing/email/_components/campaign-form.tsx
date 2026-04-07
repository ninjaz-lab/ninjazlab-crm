"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createEmailCampaign } from "@/lib/actions/email-marketing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarClock, Info, Send } from "lucide-react";

type Template = { id: string; name: string; subject: string | null; status: string };
type List = { id: string; name: string; subscriberCount: number };

export function CampaignForm({
  templates,
  lists,
}: {
  templates: Template[];
  lists: List[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [fromName, setFromName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [listId, setListId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [utmSource, setUtmSource] = useState("email");
  const [utmMedium, setUtmMedium] = useState("newsletter");
  const [utmCampaign, setUtmCampaign] = useState("");

  function handleSubmit() {
    if (!name || !fromName || !fromEmail || !templateId || !listId) {
      setError("Name, from details, template and list are required.");
      return;
    }
    setError("");

    startTransition(async () => {
      const id = await createEmailCampaign({
        name,
        fromName,
        fromEmail,
        replyTo: replyTo || undefined,
        templateId,
        listId,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        utmSource: utmSource || undefined,
        utmMedium: utmMedium || undefined,
        utmCampaign: utmCampaign || undefined,
      });
      router.push(`/marketing/email/campaigns/${id}`);
    });
  }

  const publishedTemplates = templates.filter((t) => t.status === "published");

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        {/* Basic info */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                placeholder="e.g. April Newsletter"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fromName">From Name</Label>
                <Input
                  id="fromName"
                  placeholder="NinjazCRM"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromEmail">From Email</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  placeholder="hello@yourdomain.com"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="replyTo">Reply-To (optional)</Label>
              <Input
                id="replyTo"
                type="email"
                placeholder="support@yourdomain.com"
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Template + List */}
        <Card>
          <CardHeader>
            <CardTitle>Content & Audience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email Template</Label>
              {publishedTemplates.length === 0 ? (
                <Alert>
                  <Info className="size-4" />
                  <AlertDescription>
                    No published templates. Create and publish a template first.
                  </AlertDescription>
                </Alert>
              ) : (
                <Select value={templateId} onValueChange={setTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {publishedTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} — {t.subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>Subscriber List</Label>
              {lists.length === 0 ? (
                <Alert>
                  <Info className="size-4" />
                  <AlertDescription>
                    No lists yet. Create a list and add subscribers first.
                  </AlertDescription>
                </Alert>
              ) : (
                <Select value={listId} onValueChange={setListId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a list..." />
                  </SelectTrigger>
                  <SelectContent>
                    {lists.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name} ({l.subscriberCount} subscribers)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* UTM */}
        <Card>
          <CardHeader>
            <CardTitle>UTM Tracking (optional)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>UTM Source</Label>
              <Input value={utmSource} onChange={(e) => setUtmSource(e.target.value)} placeholder="email" />
            </div>
            <div className="space-y-2">
              <Label>UTM Medium</Label>
              <Input value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} placeholder="newsletter" />
            </div>
            <div className="space-y-2">
              <Label>UTM Campaign</Label>
              <Input value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} placeholder="april-2026" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar: schedule + submit */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="size-4" />
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Send At (optional)</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to save as draft.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-3">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" onClick={handleSubmit} disabled={isPending}>
              <Send className="size-4" />
              {scheduledAt ? "Schedule Campaign" : "Save as Draft"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
