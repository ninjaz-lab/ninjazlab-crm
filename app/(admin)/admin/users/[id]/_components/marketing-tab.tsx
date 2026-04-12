import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {HugeIcon} from "@/components/huge-icon";
import {format} from "date-fns";

export function MarketingTab({campaigns}: { campaigns: any[] }) {
    return (
        <Card>
            <CardHeader><CardTitle>Upcoming & Active Campaigns</CardTitle></CardHeader>
            <CardContent>
                {campaigns.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No ongoing campaigns for this user.</p>
                ) : (
                    <div className="space-y-3">
                        {campaigns.map((cp) => (
                            <div key={cp.id} className="flex items-center justify-between p-3 border rounded-md">
                                <div className="flex items-center gap-3">
                                    <HugeIcon name="Calendar02Icon" size={16} className="text-blue-500"/>
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
    );
}