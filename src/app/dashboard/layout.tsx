export default function DashboardLayout({ children,}: Readonly<{  children: React.ReactNode;}>) {
    return (
        <div className="flex flex-col h-screen">
            {/* allow the main area to shrink and enable internal scrolling */}
            <main className="flex-1 overflow-y-auto min-h-0">{children}</main>
        </div>
    );
}
