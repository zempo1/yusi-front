import { useCallback, useEffect, useState } from "react";
import { adminApi, type User, type Page } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { toast } from "sonner";
import { Search, Loader2, Shield, UserCircle, ChevronLeft, ChevronRight, Users } from "lucide-react";

export const UserManagement = () => {
    const { user: currentUser } = useAuthStore();
    const [users, setUsers] = useState<User[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [updating, setUpdating] = useState<string | null>(null);

    const getTotalPages = (data: unknown): number => {
        if (!data || typeof data !== "object") return 0;
        const record = data as Record<string, unknown>;
        if (typeof record.totalPages === "number") return record.totalPages;
        if (typeof record.total_pages === "number") return record.total_pages;
        if (record.page && typeof record.page === "object") {
            const pageRecord = record.page as Record<string, unknown>;
            if (typeof pageRecord.totalPages === "number") return pageRecord.totalPages;
        }
        return 0;
    };

    const loadUsers = useCallback(async (targetPage = page, targetSearch = search) => {
        setLoading(true);
        try {
            const res = await adminApi.getUsers(targetPage, 10, targetSearch);
            if (res.data.code === 200) {
                const data = res.data.data as Page<User> | unknown;
                const content = Array.isArray((data as { content?: unknown }).content)
                    ? ((data as { content: User[] }).content)
                    : [];
                setUsers(content);
                const total = getTotalPages(data);
                setTotalPages(total);
            }
        } catch (error) {
            console.error(error);
            toast.error("加载用户列表失败");
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => {
        loadUsers(page, search);
    }, [page, search, loadUsers]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        loadUsers(0, search);
    };

    const handlePermissionChange = async (userId: string, currentLevel: number) => {
        setUpdating(userId);
        const newLevel = currentLevel >= 10 ? 0 : 10;
        try {
            await adminApi.updateUserPermission(userId, newLevel);
            toast.success("权限更新成功");
            setUsers(prev => prev.map(u => u.userId === userId ? { ...u, permissionLevel: newLevel } : u));
        } catch (error) {
            console.error(error);
            toast.error("权限更新失败");
        } finally {
            setUpdating(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Users className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                        用户管理
                    </h1>
                    <p className="text-muted-foreground text-sm">管理系统用户权限</p>
                </div>
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="搜索用户名..."
                            className="w-full bg-background border border-input rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button type="submit" variant="secondary" className="shrink-0">搜索</Button>
                </form>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : users.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <Users className="h-12 w-12 mb-4 opacity-30" />
                        <p className="text-sm">暂无用户数据</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="h-12 px-6 text-left font-medium text-muted-foreground">用户ID</th>
                                        <th className="h-12 px-6 text-left font-medium text-muted-foreground">用户名</th>
                                        <th className="h-12 px-6 text-left font-medium text-muted-foreground">权限</th>
                                        <th className="h-12 px-6 text-left font-medium text-muted-foreground">匹配状态</th>
                                        <th className="h-12 px-6 text-right font-medium text-muted-foreground">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{user.userId.substring(0, 8)}...</td>
                                            <td className="px-6 py-4 font-medium">{user.userName}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${user.permissionLevel >= 10 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                    {user.permissionLevel >= 10 && <Shield className="w-3 h-3" />}
                                                    {user.permissionLevel >= 10 ? '管理员' : '普通用户'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 text-xs ${user.isMatchEnabled ? 'text-green-500' : 'text-muted-foreground'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${user.isMatchEnabled ? 'bg-green-500' : 'bg-muted-foreground/50'}`} />
                                                    {user.isMatchEnabled ? '已开启' : '已关闭'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant={user.permissionLevel >= 10 ? "outline" : "secondary"}
                                                    size="sm"
                                                    disabled={updating === user.userId || currentUser?.userId === user.userId}
                                                    onClick={() => handlePermissionChange(user.userId, user.permissionLevel ?? 0)}
                                                    title={currentUser?.userId === user.userId ? "不能修改自己的权限" : ""}
                                                >
                                                    {updating === user.userId && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                                    {user.permissionLevel >= 10 ? '降级' : '设为管理员'}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="md:hidden space-y-3">
                        {users.map((user) => (
                            <Card key={user.id} className="overflow-hidden">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                                                <UserCircle className="w-6 h-6 text-muted-foreground" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium truncate">{user.userName}</p>
                                                <p className="text-xs text-muted-foreground font-mono">{user.userId.substring(0, 8)}...</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${user.permissionLevel >= 10 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                {user.permissionLevel >= 10 ? '管理员' : '用户'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span className={`w-1.5 h-1.5 rounded-full ${user.isMatchEnabled ? 'bg-green-500' : 'bg-muted-foreground/50'}`} />
                                            匹配: {user.isMatchEnabled ? '开启' : '关闭'}
                                        </div>
                                        <Button
                                            variant={user.permissionLevel >= 10 ? "outline" : "secondary"}
                                            size="sm"
                                            disabled={updating === user.userId || currentUser?.userId === user.userId}
                                            onClick={() => handlePermissionChange(user.userId, user.permissionLevel ?? 0)}
                                        >
                                            {updating === user.userId ? <Loader2 className="h-3 w-3 animate-spin" /> : user.permissionLevel >= 10 ? '降级' : '升级'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            )}

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0 || loading}
                        className="gap-1"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        上一页
                    </Button>
                    <div className="text-sm text-muted-foreground tabular-nums">
                        <span className="font-medium text-foreground">{page + 1}</span>
                        <span className="mx-1">/</span>
                        <span>{totalPages}</span>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1 || loading}
                        className="gap-1"
                    >
                        下一页
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    );
};
