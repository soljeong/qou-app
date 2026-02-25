"use server";

import prisma from "@/lib/prisma";
import * as xlsx from "xlsx";
import { revalidatePath } from "next/cache";

export async function uploadProductionPlan(formData: FormData) {
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");

    const buffer = Buffer.from(await file.arrayBuffer());

    // NOTE: If the excel is password protected, node 'xlsx' cannot read it natively.
    // It expects a decrypted file.
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets["생산 계획"];
    if (!sheet) {
        throw new Error("Sheet '생산 계획' not found.");
    }

    const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null }) as (string | number | null)[][];

    const fileName = file.name;
    const writtenRaw = data[6] && data[6][0] ? String(data[6][0]) : null; // A7

    // Create FileSnapshot
    // Rough version checking

    const snapshot = await prisma.fileSnapshot.create({
        data: {
            fileName,
            writtenAt: writtenRaw,
            rowCount: data.length - 8,
            currentWw: `ww${new Date().getWeek() || '##'}`, // Fallback
        }
    });

    const DATA_START_ROW = 8; // 0-indexed for row 9

    const ordersToInsert = [];

    for (let i = DATA_START_ROW; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 3) continue;

        const client = row[1] ? String(row[1]).trim() : null;
        const model = row[2] ? String(row[2]).trim() : null;

        if (!client && !model) continue;
        let rowType = "data";
        if (client === "차주 대기모델") rowType = "divider_next_week";
        else if (client?.startsWith("관리모델")) rowType = "divider_managed";

        const qtyRaw = row[3] ? String(row[3]) : null;
        const orderDateRaw = row[4] ? String(row[4]) : null;
        const line = row[7] ? String(row[7]) : null;

        ordersToInsert.push({
            snapshotId: snapshot.id,
            rowNumber: i + 1,
            rowType,
            weekNo: row[0] ? String(row[0]) : null,
            clientName: client,
            modelName: model,
            quantityRaw: qtyRaw,
            orderDateRaw: orderDateRaw,
            deadlineRaw: row[5] ? String(row[5]) : null,
            versionMgmt: row[6] ? String(row[6]) : null,
            line,
            boardSide: row[8] ? String(row[8]) : null,
            postProcess: row[9] ? String(row[9]) : null,
            rohs: row[10] ? String(row[10]) : null,
            note: row[27] ? String(row[27]) : null,
        });
    }

    // Insert in chunks or via createMany
    if (ordersToInsert.length > 0) {
        await prisma.productionOrder.createMany({
            data: ordersToInsert
        });
    }

    revalidatePath("/production");
    return { success: true };
}

// Helper to get week approx
Date.prototype.getWeek = function () {
    const date = new Date(this.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

declare global {
    interface Date {
        getWeek(): number;
    }
}
