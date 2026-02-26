"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";

export async function getProductionOrders(snapshotId?: string | null) {
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
}

export async function getLatestProductionOrders() {
    return getProductionOrders();
}

export async function getProductionSnapshots() {
    const snapshots = await prisma.fileSnapshot.findMany({
        orderBy: { importedAt: "desc" },
        include: {
            _count: {
                select: { orders: true },
            },
        },
    });

    return snapshots;
}

export async function deleteProductionSnapshot(snapshotId: string) {
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
}
