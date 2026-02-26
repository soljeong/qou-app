import { deleteProductionSnapshot, getProductionSnapshots } from "@/actions/production";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import Link from "next/link";

export default async function ProductionSnapshotPage() {
    const snapshots = await getProductionSnapshots();
    const latestSnapshotId = snapshots[0]?.id;

    return (
        <div className="container mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">생산계획 스냅샷 목록</h1>
                    <p className="text-sm text-slate-500 mt-2">업로드 이력을 확인하고 특정 스냅샷으로 화면을 전환할 수 있습니다.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/production" className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                        생산 현황으로
                    </Link>
                    <Link href="/production/upload" className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                        새 파일 업로드
                    </Link>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>스냅샷 이력</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>상태</TableHead>
                                    <TableHead>업로드 시각</TableHead>
                                    <TableHead>파일명</TableHead>
                                    <TableHead>작성 기준</TableHead>
                                    <TableHead className="text-right">행 수</TableHead>
                                    <TableHead className="text-right">레코드 수</TableHead>
                                    <TableHead className="text-right">작업</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {snapshots.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-10 text-center text-slate-500">
                                            아직 저장된 생산 스냅샷이 없습니다.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    snapshots.map((snapshot) => (
                                        <TableRow key={snapshot.id}>
                                            <TableCell>
                                                {snapshot.id === latestSnapshotId ? (
                                                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">최신</Badge>
                                                ) : (
                                                    <Badge variant="outline">보관</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>{format(new Date(snapshot.importedAt), "yyyy-MM-dd HH:mm")}</TableCell>
                                            <TableCell>
                                                <div className="font-medium">{snapshot.fileName}</div>
                                                {snapshot.filePath && (
                                                    <a href={snapshot.filePath} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">
                                                        원본 파일 열기
                                                    </a>
                                                )}
                                            </TableCell>
                                            <TableCell>{snapshot.currentWw || "-"} / {snapshot.writtenAt || "-"}</TableCell>
                                            <TableCell className="text-right tabular-nums">{snapshot.rowCount ?? 0}</TableCell>
                                            <TableCell className="text-right tabular-nums">{snapshot._count.orders}</TableCell>
                                            <TableCell>
                                                <div className="flex justify-end items-center gap-2">
                                                    <Link href={`/production?snapshotId=${snapshot.id}`}>
                                                        <Button size="sm" variant="outline">조회</Button>
                                                    </Link>
                                                    <form action={deleteProductionSnapshot.bind(null, snapshot.id)}>
                                                        <Button size="sm" variant="destructive">삭제</Button>
                                                    </form>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
