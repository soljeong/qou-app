import { getProductionOrders } from "@/actions/production";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductionOrdersTable } from "@/components/production-orders-table";

export default async function ProductionPage({
    searchParams,
}: {
    searchParams?: Promise<{ snapshotId?: string }>;
}) {
    const params = await searchParams;
    const selectedSnapshotId = params?.snapshotId;
    const { snapshot, orders } = await getProductionOrders(selectedSnapshotId);

    const getStatusRatio = (targetOrders: { line: string | null }[]) => {
        const totalLines = { A: 0, B: 0, C: 0, 외주: 0, 미배정: 0 };
        targetOrders.forEach((order) => {
            if (order.line === "A") totalLines.A++;
            else if (order.line === "B") totalLines.B++;
            else if (order.line === "C") totalLines.C++;
            else if (order.line?.includes("외주")) totalLines.외주++;
            else totalLines.미배정++;
        });
        return totalLines;
    };

    const stats = getStatusRatio(orders);

    return (
        <div className="w-full max-w-none px-4 py-8 lg:px-8">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">생산 계획 현황</h1>
                    {snapshot && (
                        <p className="mt-2 text-sm text-slate-500">
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
                        className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                    >
                        계획서 업로드 (Excel)
                    </Link>
                </div>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-5">
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

            <ProductionOrdersTable
                orders={orders.map((order) => ({
                    id: order.id,
                    weekNo: order.weekNo,
                    clientName: order.clientName,
                    modelName: order.modelName,
                    quantityRaw: order.quantityRaw,
                    deadlineRaw: order.deadlineRaw,
                    deadlineDate: order.deadlineDate ? order.deadlineDate.toISOString() : null,
                    versionMgmt: order.versionMgmt,
                    line: order.line,
                    note: order.note,
                }))}
            />
        </div>
    );
}
