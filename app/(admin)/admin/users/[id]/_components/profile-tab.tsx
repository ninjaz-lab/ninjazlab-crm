import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Label} from "@/components/ui/label";
import {format} from "date-fns";
import {RoleBadge} from "@/components/role-badge";

export function ProfileTab({user, audience}: { user: any; audience: any }) {
    return (
        <Card>
            <CardHeader><CardTitle>Client Information</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div>
                        <Label className="text-xs text-muted-foreground">Location</Label>
                        <p className="font-medium">{audience?.address || "No address provided"}</p>
                        <p className="text-sm">{audience?.city} {audience?.state} {audience?.postalCode}</p>
                        <p className="text-sm">{audience?.country}</p>
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground">Contact</Label>
                        <p className="font-medium">{audience?.phone || "No phone provided"}</p>
                    </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <Label className="text-xs text-muted-foreground">System Status</Label>
                        <div className="flex gap-2 mt-1">
                            <RoleBadge role={user.role}/>
                            {user.banned && <Badge variant="destructive">Banned</Badge>}
                        </div>
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground">Account Created</Label>
                        <p className="text-sm">{format(new Date(user.createdAt), "PPP")}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}