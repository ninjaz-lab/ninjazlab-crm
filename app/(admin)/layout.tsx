import {AdminSidebar} from "@/components/admin/admin-sidebar";
import {AdminHeader} from "@/components/admin/admin-header";
import {SidebarInset, SidebarProvider} from "@/components/ui/sidebar";

export default function AdminLayout({children}: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AdminSidebar/>
            <SidebarInset>
                <AdminHeader/>
                <main className="flex-1 p-6">{children}</main>
            </SidebarInset>
        </SidebarProvider>
    );
}
