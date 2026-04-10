"use client";

import {useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {cancelCampaign, scheduleCampaign} from "@/lib/actions/email-marketing";
import {Button} from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {CalendarClock, Send, XCircle} from "lucide-react";
import {CAMPAIGN_STATUS} from "@/lib/enums";

export function CampaignActions({
                                    campaignId,
                                    status,
                                    scheduledAt,
                                }: {
    campaignId: string;
    status: string;
    scheduledAt: Date | null;
}) {
    const router = useRouter();
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [dateTime, setDateTime] = useState(
        scheduledAt ? new Date(scheduledAt).toISOString().slice(0, 16) : ""
    );
    const [isPending, startTransition] = useTransition();

    function handleSchedule() {
        if (!dateTime)
            return;
        startTransition(async () => {
            await scheduleCampaign(campaignId, new Date(dateTime));
            setScheduleOpen(false);
            router.refresh();
        });
    }

    function handleSendNow() {
        startTransition(async () => {
            await scheduleCampaign(campaignId, new Date());
            router.refresh();
        });
    }

    function handleCancel() {
        startTransition(async () => {
            await cancelCampaign(campaignId);
            router.refresh();
        });
    }

    if (status === CAMPAIGN_STATUS.S || status === CAMPAIGN_STATUS.SENDING)
        return null;

    return (
        <div className="flex items-center gap-2">
            {/* Send Now */}
            {(status === CAMPAIGN_STATUS.DRAFT|| status === CAMPAIGN_STATUS.SCHEDULED) && (
                <Button variant="outline" onClick={handleSendNow} disabled={isPending}>
                    <Send className="size-4"/>
                    Send Now
                </Button>
            )}

            {/* Schedule */}
            <Button onClick={() => setScheduleOpen(true)} disabled={isPending}>
                <CalendarClock className="size-4"/>
                {status === CAMPAIGN_STATUS.SCHEDULED ? "Reschedule" : "Schedule Blast"}
            </Button>

            {/* Cancel */}
            {status === CAMPAIGN_STATUS.SCHEDULED && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" disabled={isPending}>
                            <XCircle className="size-4"/>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Cancel this campaign?</AlertDialogTitle>
                            <AlertDialogDescription>
                                The scheduled blast will be cancelled. This cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Keep it</AlertDialogCancel>
                            <AlertDialogAction onClick={handleCancel}>
                                Yes, cancel campaign
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            {/* Schedule dialog */}
            <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Schedule Email Blast</DialogTitle>
                        <DialogDescription>
                            Choose when to send this campaign. The BullMQ worker will pick it up and process in batches.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="dt">Send At</Label>
                        <Input
                            id="dt"
                            type="datetime-local"
                            value={dateTime}
                            onChange={(e) => setDateTime(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setScheduleOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSchedule} disabled={isPending || !dateTime}>
                            {isPending ? "Scheduling..." : "Confirm Schedule"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
