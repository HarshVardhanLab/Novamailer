import { Sidebar } from "@/components/sidebar"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen overflow-hidden">
            <div className="w-64 hidden md:block">
                <Sidebar />
            </div>
            <div className="flex-1 overflow-y-auto p-8">
                {children}
            </div>
        </div>
    )
}
