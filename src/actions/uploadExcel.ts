"use server";

import prisma from "@/lib/prisma";
import * as xlsx from "xlsx";
import XlsxPopulate from "xlsx-populate";
import { revalidatePath } from "next/cache";

const EXCEL_PASSWORD = "8715";

export async function uploadProductionPlan(formData: FormData) {
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");

    const buffer = Buffer.from(await file.arrayBuffer());

    // 비밀번호가 걸린 엑셀 파일을 xlsx-populate로 복호화 후 xlsx로 파싱
    // 비밀번호가 없는 파일의 경우 xlsx-populate가 오류를 발생시키므로 직접 파싱으로 폴백
    let workbook: ReturnType<typeof xlsx.read>;
    try {
        const populated = await XlsxPopulate.fromDataAsync(buffer, { password: EXCEL_PASSWORD });
        const decryptedBuffer = await populated.outputAsync() as Buffer;
        workbook = xlsx.read(decryptedBuffer, { type: "buffer" });
    } catch (decryptErr) {
        console.warn("xlsx-populate 복호화 실패, 비밀번호 없이 재시도:", decryptErr);
        workbook = xlsx.read(buffer, { type: "buffer" });
    }
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
