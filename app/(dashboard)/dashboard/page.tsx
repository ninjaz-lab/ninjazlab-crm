import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {DollarSign, ShoppingCart, TrendingUp, Users} from "lucide-react";

const stats = [
    {title: "Total Users", value: "12,345", change: "+12%", icon: Users},
    {title: "Revenue", value: "$45,231", change: "+8.2%", icon: DollarSign},
    {title: "Orders", value: "1,234", change: "+3.1%", icon: ShoppingCart},
    {title: "Growth", value: "23.5%", change: "+4.6%", icon: TrendingUp},
];

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground"/>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">
                                <span className="text-green-600">{stat.change}</span> from last month
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {["User John Doe signed up", "Order #1234 placed", "Payment received $299", "New audience added"].map(
                                (item, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm">
                                        <div className="h-2 w-2 rounded-full bg-primary"/>
                                        {item}
                                    </div>
                                )
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <p>• Invite team members in Settings</p>
                            <p>• Connect your database via .env.local</p>
                            <p>• Add social auth providers</p>
                            <p>• Run npx drizzle-kit push to sync schema</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
