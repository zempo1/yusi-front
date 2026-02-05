import { useEffect, useState } from "react";
import { adminApi, type AdminStats } from "../../lib/api";
import { Users, Book, FileText, LayoutGrid } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";

export const AdminDashboard = () => {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const res = await adminApi.getStats();
                if (res.data.code === 200) {
                    setStats(res.data.data);
                }
            } catch (error) {
                console.error("Failed to load stats", error);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, []);

    const statItems = [
        { title: "总用户数", value: stats?.totalUsers ?? 0, icon: Users, color: "text-blue-500" },
        { title: "总日记数", value: stats?.totalDiaries ?? 0, icon: Book, color: "text-green-500" },
        { title: "待审核场景", value: stats?.pendingScenarios ?? 0, icon: FileText, color: "text-orange-500" },
        { title: "总房间数", value: stats?.totalRooms ?? 0, icon: LayoutGrid, color: "text-purple-500" },
    ];

    if (loading) {
        return <div className="flex justify-center p-8">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">仪表盘</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statItems.map((item, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {item.title}
                            </CardTitle>
                            <item.icon className={`h-4 w-4 ${item.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{item.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};
