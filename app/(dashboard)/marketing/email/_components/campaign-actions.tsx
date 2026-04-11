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
import {toast} from "sonner";

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
        if (!dateTime) return;
        startTransition(async () => {
            try {
                await scheduleCampaign(campaignId, new Date(dateTime));
                toast.success("Campaign scheduled successfully!");
                setScheduleOpen(false);
                router.refresh();
            } catch (error) {
                toast.error("Failed to schedule campaign.");
            }
        });
    }

    function handleSendNow() {
        startTransition(async () => {
            try {
                await scheduleCampaign(campaignId, new Date());
                toast.success("Campaign is preparing to send!");
                router.refresh();
            } catch (error) {
                toast.error("Failed to trigger campaign.");
            }
        });
    }

    function handleCancel() {
        startTransition(async () => {
            try {
                await cancelCampaign(campaignId);
                toast.success("Campaign has been cancelled.");
                router.refresh();
            } catch (error) {
                toast.error("Failed to cancel campaign.");
            }
        });
    }

    if (status === CAMPAIGN_STATUS.SENT || status === CAMPAIGN_STATUS.SENDING)
        return null;

    return (
        <div className="flex items-center gap-2">
            {/* Send Now */}
            {(status === CAMPAIGN_STATUS.DRAFT || status === CAMPAIGN_STATUS.SCHEDULED) && (
                <Button variant="outline" className="font-bold" onClick={handleSendNow} disabled={isPending}>
                    <Send className="size-4 mr-2"/>
                    Send Now
                </Button>
            )}

            {/* Schedule */}
            <Button className="font-bold shadow-sm" onClick={() => setScheduleOpen(true)} disabled={isPending}>
                <CalendarClock className="size-4 mr-2"/>
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
                            <AlertDialogAction
                                onClick={handleCancel}
                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold">
                                Yes, cancel campaign
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            {/* Schedule dialog */}
            <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Schedule Email Blast</DialogTitle>
                        <DialogDescription>
                            Choose when to send this campaign. The background worker will pick it up and process it at
                            the exact time.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="dt"
                                   className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                Send Date & Time
                            </Label>
                            <Input
                                id="dt"
                                type="datetime-local"
                                className="bg-background font-mono font-bold"
                                value={dateTime}
                                onChange={(e) => setDateTime(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setScheduleOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSchedule} disabled={isPending || !dateTime} className="font-bold">
                            {isPending ? "Scheduling..." : "Confirm Schedule"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}