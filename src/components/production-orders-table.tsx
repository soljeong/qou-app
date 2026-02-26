"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMemo, useState, type ReactNode } from "react";

type ProductionOrderRow = {
    id: string;
    weekNo: string | null;
    clientName: string | null;
    modelName: string | null;
    quantityRaw: string | null;
    deadlineRaw: string | null;
    deadlineDate: string | null;
    versionMgmt: string | null;
    line: string | null;
    note: string | null;
};

type ColumnId =
    | "weekNo"
    | "clientName"
    | "modelName"
    | "quantityRaw"
    | "deadline"
    | "versionMgmt"
    | "line"
    | "note";

type SortDirection = "asc" | "desc";

type ColumnDefinition = {
    id: ColumnId;
    label: string;
    sortable?: boolean;
    filterable?: boolean;
    widthClassName?: string;
    align?: "left" | "right";
    getValue: (row: ProductionOrderRow) => string;
    render: (row: ProductionOrderRow) => ReactNode;
};

const formatDeadline = (deadlineDate: string | null, deadlineRaw: string | null) => {
    if (!deadlineDate) return deadlineRaw || "-";
    const parsed = new Date(deadlineDate);
    if (Number.isNaN(parsed.getTime())) return deadlineRaw || "-";
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${month}-${day}`;
};

const getRiskBadge = (versionMgmt: string | null) => {
    if (!versionMgmt) return null;
    if (versionMgmt === "신규") return <Badge variant="destructive">신규</Badge>;
    if (versionMgmt.includes("BOM")) return <Badge variant="destructive" className="bg-orange-500">BOM변경</Badge>;
    return <Badge variant="outline" className="text-slate-500">{versionMgmt}</Badge>;
};

const getLineBadge = (line: string | null) => {
    if (!line) {
        return (
            <Badge variant="secondary" className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                대기
            </Badge>
        );
    }

    return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300">{line}</Badge>;
};

const COLUMNS: ColumnDefinition[] = [
    {
        id: "weekNo",
        label: "주차",
        sortable: true,
        filterable: true,
        widthClassName: "w-[90px]",
        getValue: (row) => row.weekNo || "",
        render: (row) => <span className="font-medium">{row.weekNo || "-"}</span>,
    },
    {
        id: "clientName",
        label: "고객사",
        sortable: true,
        filterable: true,
        getValue: (row) => row.clientName || "",
        render: (row) => <span className="font-semibold text-slate-900 dark:text-white">{row.clientName || "-"}</span>,
    },
    {
        id: "modelName",
        label: "모델명",
        sortable: true,
        filterable: true,
        getValue: (row) => row.modelName || "",
        render: (row) => row.modelName || "-",
    },
    {
        id: "quantityRaw",
        label: "수량",
        sortable: true,
        filterable: true,
        align: "right",
        getValue: (row) => row.quantityRaw || "",
        render: (row) => <span className="tabular-nums">{row.quantityRaw || "-"}</span>,
    },
    {
        id: "deadline",
        label: "납기일",
        sortable: true,
        filterable: true,
        getValue: (row) => formatDeadline(row.deadlineDate, row.deadlineRaw),
        render: (row) => <span className="text-slate-500">{formatDeadline(row.deadlineDate, row.deadlineRaw)}</span>,
    },
    {
        id: "versionMgmt",
        label: "버전 관리",
        sortable: true,
        filterable: true,
        widthClassName: "w-[130px]",
        getValue: (row) => row.versionMgmt || "",
        render: (row) => getRiskBadge(row.versionMgmt),
    },
    {
        id: "line",
        label: "라인배정",
        sortable: true,
        filterable: true,
        getValue: (row) => row.line || "",
        render: (row) => getLineBadge(row.line),
    },
    {
        id: "note",
        label: "특이사항",
        sortable: true,
        filterable: true,
        getValue: (row) => row.note || "",
        render: (row) => {
            if (!row.note) return null;
            return (
                <div className="max-w-[320px] truncate" title={row.note}>
                    <span className="flex items-center gap-1.5 text-sm text-slate-500">
                        <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        {row.note}
                    </span>
                </div>
            );
        },
    },
];

export function ProductionOrdersTable({ orders }: { orders: ProductionOrderRow[] }) {
    const [visibleColumns, setVisibleColumns] = useState<ColumnId[]>(() => COLUMNS.map((column) => column.id));
    const [columnOrder, setColumnOrder] = useState<ColumnId[]>(() => COLUMNS.map((column) => column.id));
    const [sort, setSort] = useState<{ id: ColumnId; direction: SortDirection } | null>(null);
    const [filters, setFilters] = useState<Record<ColumnId, string>>({
        weekNo: "",
        clientName: "",
        modelName: "",
        quantityRaw: "",
        deadline: "",
        versionMgmt: "",
        line: "",
        note: "",
    });

    const orderedColumns = useMemo(() => {
        const columnMap = new Map(COLUMNS.map((column) => [column.id, column]));
        return columnOrder.map((columnId) => columnMap.get(columnId)).filter((column): column is ColumnDefinition => Boolean(column));
    }, [columnOrder]);

    const displayedColumns = useMemo(
        () => orderedColumns.filter((column) => visibleColumns.includes(column.id)),
        [orderedColumns, visibleColumns],
    );

    const filteredAndSortedOrders = useMemo(() => {
        const filtered = orders.filter((row) => {
            return COLUMNS.every((column) => {
                const filterValue = filters[column.id].trim().toLowerCase();
                if (!filterValue) return true;
                const rowValue = column.getValue(row).toLowerCase();
                return rowValue.includes(filterValue);
            });
        });

        if (!sort) return filtered;

        const targetColumn = COLUMNS.find((column) => column.id === sort.id);
        if (!targetColumn) return filtered;

        const sorted = [...filtered].sort((a, b) => targetColumn.getValue(a).localeCompare(targetColumn.getValue(b), "ko"));
        return sort.direction === "asc" ? sorted : sorted.reverse();
    }, [filters, orders, sort]);

    const toggleColumn = (columnId: ColumnId) => {
        setVisibleColumns((prev) => {
            if (prev.includes(columnId)) return prev.filter((id) => id !== columnId);
            return [...prev, columnId];
        });
    };

    const moveColumn = (columnId: ColumnId, direction: "left" | "right") => {
        setColumnOrder((prev) => {
            const index = prev.indexOf(columnId);
            if (index < 0) return prev;
            const targetIndex = direction === "left" ? index - 1 : index + 1;
            if (targetIndex < 0 || targetIndex >= prev.length) return prev;
            const next = [...prev];
            const [moved] = next.splice(index, 1);
            next.splice(targetIndex, 0, moved);
            return next;
        });
    };

    const cycleSort = (columnId: ColumnId) => {
        setSort((prev) => {
            if (!prev || prev.id !== columnId) return { id: columnId, direction: "asc" };
            if (prev.direction === "asc") return { id: columnId, direction: "desc" };
            return null;
        });
    };

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                <div className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">테이블 설정</div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {orderedColumns.map((column) => (
                        <div key={column.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                    <input
                                        type="checkbox"
                                        checked={visibleColumns.includes(column.id)}
                                        onChange={() => toggleColumn(column.id)}
                                        className="h-4 w-4"
                                    />
                                    {column.label}
                                </label>
                                <div className="flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() => moveColumn(column.id, "left")}
                                        className="rounded border px-2 py-1 text-xs hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800"
                                        disabled={columnOrder.indexOf(column.id) === 0}
                                    >
                                        ←
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => moveColumn(column.id, "right")}
                                        className="rounded border px-2 py-1 text-xs hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800"
                                        disabled={columnOrder.indexOf(column.id) === columnOrder.length - 1}
                                    >
                                        →
                                    </button>
                                </div>
                            </div>
                            {column.filterable ? (
                                <Input
                                    value={filters[column.id]}
                                    onChange={(event) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            [column.id]: event.target.value,
                                        }))
                                    }
                                    placeholder={`${column.label} 필터`}
                                    className="h-8"
                                />
                            ) : null}
                        </div>
                    ))}
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                        <TableRow>
                            {displayedColumns.map((column) => (
                                <TableHead key={column.id} className={column.widthClassName}>
                                    <button
                                        type="button"
                                        onClick={() => (column.sortable ? cycleSort(column.id) : undefined)}
                                        className="inline-flex items-center gap-1 font-semibold"
                                    >
                                        {column.label}
                                        {sort?.id === column.id ? (sort.direction === "asc" ? "▲" : "▼") : ""}
                                    </button>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSortedOrders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={Math.max(displayedColumns.length, 1)} className="py-12 text-center text-slate-500">
                                    조건에 맞는 생산 계획 데이터가 없습니다.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAndSortedOrders.map((order) => (
                                <TableRow key={order.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                    {displayedColumns.map((column) => (
                                        <TableCell
                                            key={`${order.id}-${column.id}`}
                                            className={column.align === "right" ? "text-right" : undefined}
                                        >
                                            {column.render(order)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
