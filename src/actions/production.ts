"use server";

import dummyProductionData from "@/data/production-dummy.json";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";

const parseDate = (value: string | null) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const mapDummySnapshot = (snapshot: (typeof dummyProductionData.snapshots)[number]) => ({
    ...snapshot,
    importedAt: new Date(snapshot.importedAt),
    writtenDatetime: parseDate(snapshot.writtenDatetime),
    fileModifiedAt: parseDate(snapshot.fileModifiedAt),
});

const mapDummyOrder = (order: (typeof dummyProductionData.orders)[number]) => ({
    ...order,
    orderDate: parseDate(order.orderDate),
    deadlineDate: parseDate(order.deadlineDate),
    pcbScheduleDate: parseDate(order.pcbScheduleDate),
    materialInDate: parseDate(order.materialInDate),
    workOrderDate: parseDate(order.workOrderDate),
    materialOutDate: parseDate(order.materialOutDate),
});

const getDummySnapshots = () =>
    dummyProductionData.snapshots
        .map(mapDummySnapshot)
        .sort((a, b) => b.importedAt.getTime() - a.importedAt.getTime());

const getDummyOrders = (snapshotId: string) =>
    dummyProductionData.orders
        .filter((order) => order.snapshotId === snapshotId && order.rowType === "data")
        .map(mapDummyOrder)
        .sort((a, b) => (a.rowNumber ?? 0) - (b.rowNumber ?? 0));

const isDbConnectionError = (error: unknown) => {
    if (error instanceof Prisma.PrismaClientInitializationError) return true;
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return ["P1000", "P1001", "P1002", "P1017"].includes(error.code);
    }

    if (error instanceof Error) {
        return /(can't reach database server|authentication failed|connection.*database|database.*unreachable)/i.test(error.message);
    }

    return false;
};

const canUseDummyFallback = (error: unknown) => process.env.NODE_ENV !== "production" && isDbConnectionError(error);

const getProductionOrdersFromDummy = (snapshotId?: string | null) => {
    const snapshots = getDummySnapshots();
    const targetSnapshotId = snapshotId || snapshots[0]?.id;

    if (!targetSnapshotId) {
        return { snapshot: null, orders: [] };
    }

    const snapshot = snapshots.find((item) => item.id === targetSnapshotId);
    if (!snapshot) {
        return { snapshot: null, orders: [] };
    }

    const orders = getDummyOrders(targetSnapshotId);
    return { snapshot, orders };
};

export async function getProductionOrders(snapshotId?: string | null) {
    try {
        const latestSnapshot = await prisma.fileSnapshot.findFirst({
            orderBy: { importedAt: "desc" },
        });

        const targetSnapshotId = snapshotId || latestSnapshot?.id;
        if (!targetSnapshotId) {
            return { snapshot: null, orders: [] };
        }

        const snapshot = await prisma.fileSnapshot.findUnique({
            where: { id: targetSnapshotId },
        });

        if (!snapshot) {
            return { snapshot: null, orders: [] };
        }

        const orders = await prisma.productionOrder.findMany({
            where: { snapshotId: targetSnapshotId, rowType: "data" },
            orderBy: [{ rowNumber: "asc" }],
        });

        return { snapshot, orders };
    } catch (error) {
        if (canUseDummyFallback(error)) {
            console.warn("[production] DB connection failed in development. Falling back to local dummy data.");
            return getProductionOrdersFromDummy(snapshotId);
        }

        throw error;
    }
}

export async function getLatestProductionOrders() {
    return getProductionOrders();
}

export async function getProductionSnapshots() {
    try {
        const snapshots = await prisma.fileSnapshot.findMany({
            orderBy: { importedAt: "desc" },
            include: {
                _count: {
                    select: { orders: true },
                },
            },
        });

        return snapshots;
    } catch (error) {
        if (canUseDummyFallback(error)) {
            console.warn("[production] DB connection failed in development. Falling back to local dummy snapshots.");
            return getDummySnapshots();
        }

        throw error;
    }
}

export async function deleteProductionSnapshot(snapshotId: string) {
    try {
        const snapshot = await prisma.fileSnapshot.findUnique({
            where: { id: snapshotId },
        });

        if (!snapshot) {
            return { success: false, error: "스냅샷을 찾을 수 없습니다." };
        }

        await prisma.fileSnapshot.delete({
            where: { id: snapshotId },
        });

        if (snapshot.filePath) {
            const localPath = path.join(process.cwd(), "public", snapshot.filePath.replace(/^\//, ""));
            await fs.rm(localPath, { force: true }).catch(() => undefined);
        }

        revalidatePath("/production");
        revalidatePath("/production/snapshots");

        return { success: true };
    } catch (error) {
        if (canUseDummyFallback(error)) {
            return { success: false, error: "개발용 더미 데이터 모드에서는 삭제할 수 없습니다." };
        }

        throw error;
    }
}
