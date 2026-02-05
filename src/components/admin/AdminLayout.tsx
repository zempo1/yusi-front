import { Outlet, Link, useLocation } from "react-router-dom";
import { cn } from "../../utils";
import { LayoutDashboard, Users, FileText, ArrowLeft } from "lucide-react";

export const AdminLayout = () => {
    const { pathname } = useLocation();

    const navItems = [
        { label: "仪表盘", href: "/admin", icon: LayoutDashboard },
        { label: "用户管理", href: "/admin/users", icon: Users },
        { label: "场景审核", href: "/admin/scenarios", icon: FileText },
    ];

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-xl">
                <div className="h-16 flex items-center px-6 border-b border-border">
                    <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="font-semibold">返回前台</span>
                    </Link>
                </div>

                <div className="p-4">
                    <div className="text-xs font-semibold text-muted-foreground mb-4 px-2 uppercase tracking-wider">
                        管理后台
                    </div>
                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                            return (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-md"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="container mx-auto p-8 max-w-7xl">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
