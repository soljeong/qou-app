import { getProductionOrders } from "@/actions/production";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export default async function ProductionPage({
    searchParams,
}: {
    searchParams?: Promise<{ snapshotId?: string }>;
}) {
    const params = await searchParams;
    const selectedSnapshotId = params?.snapshotId;
    const { snapshot, orders } = await getProductionOrders(selectedSnapshotId);

    const getRiskBadge = (versionMgmt: string | null) => {
        if (!versionMgmt) return null;
        if (versionMgmt === "신규") return <Badge variant="destructive">신규</Badge>;
        if (versionMgmt.includes("BOM")) return <Badge variant="destructive" className="bg-orange-500">BOM변경</Badge>;
        return <Badge variant="outline" className="text-slate-500">{versionMgmt}</Badge>;
    };

    const getStatusRatio = (orders: { line: string | null }[]) => {
        const totalLines = { A: 0, B: 0, C: 0, 외주: 0, 미배정: 0 };
        orders.forEach((o) => {
            if (o.line === "A") totalLines.A++;
            else if (o.line === "B") totalLines.B++;
            else if (o.line === "C") totalLines.C++;
            else if (o.line?.includes("외주")) totalLines.외주++;
            else totalLines.미배정++;
        });
        return totalLines;
    };

    const stats = getStatusRatio(orders);

    return (
        <div className="container mx-auto px-6 py-8">
            <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">생산 계획 현황</h1>
                    {snapshot && (
                        <p className="text-sm text-slate-500 mt-2">
                            조회 중인 스냅샷: {snapshot.currentWw} ({snapshot.writtenAt || "작성일 미기재"})
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/production/snapshots"
                        className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        스냅샷 목록 관리
                    </Link>
                    <Link
                        href="/production/upload"
                        className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 shadow-sm"
                    >
                        계획서 업로드 (Excel)
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">미배정(대기)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats["미배정"]}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">A 라인</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.A}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">B 라인</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stats.B}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">C 라인</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.C}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">외주(하이원 등)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats["외주"]}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                            <TableRow>
                                <TableHead className="w-[80px]">주차</TableHead>
                                <TableHead>고객사</TableHead>
                                <TableHead>모델명</TableHead>
                                <TableHead className="text-right">수량</TableHead>
                                <TableHead>납기일</TableHead>
                                <TableHead className="w-[120px]">버전 관리</TableHead>
                                <TableHead>라인배정</TableHead>
                                <TableHead>특이사항</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                                        생산 계획 데이터가 없습니다. 우측 상단의 업로드 버튼을 눌러 추가해주세요.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orders.map((order) => (
                                    <TableRow key={order.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                        <TableCell className="font-medium">{order.weekNo}</TableCell>
                                        <TableCell className="font-semibold text-slate-900 dark:text-white">{order.clientName}</TableCell>
                                        <TableCell>{order.modelName}</TableCell>
                                        <TableCell className="text-right tabular-nums">{order.quantityRaw}</TableCell>
                                        <TableCell className="text-slate-500">
                                            {order.deadlineDate ? format(new Date(order.deadlineDate), "MM-dd") : order.deadlineRaw}
                                        </TableCell>
                                        <TableCell>{getRiskBadge(order.versionMgmt)}</TableCell>
                                        <TableCell>
                                            {order.line ? (
                                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300">
                                                    {order.line}
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                                >
                                                    대기
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="max-w-[200px] truncate" title={order.note || ""}>
                                                {order.note ? (
                                                    <span className="flex items-center gap-1.5 text-sm text-slate-500">
                                                        <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                            />
                                                        </svg>
                                                        {order.note}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
}
