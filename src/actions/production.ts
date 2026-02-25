"use server";

import prisma from "@/lib/prisma";

export async function getLatestProductionOrders() {
    const latestSnapshot = await prisma.fileSnapshot.findFirst({
        orderBy: { id: "desc" },
    });

    if (!latestSnapshot) {
        return { snapshot: null, orders: [] };
    }

    const orders = await prisma.productionOrder.findMany({
        where: { snapshotId: latestSnapshot.id, rowType: "data" },
        orderBy: [{ rowNumber: "asc" }],
    });

    return { snapshot: latestSnapshot, orders };
}
