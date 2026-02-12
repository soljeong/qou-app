import { PrismaClient } from '@prisma/client'
import * as xlsx from 'xlsx'
import path from 'path'

const prisma = new PrismaClient()

// Helper to convert Excel serial date to JS Date
function excelDateToJSDate(serial: number) {
    const utc_days = Math.floor(serial - 25569)
    const utc_value = utc_days * 86400
    const date_info = new Date(utc_value * 1000)
    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate())
}

async function main() {
    console.log('Start seeding from Excel...')

    const filePath = path.resolve(__dirname, '../../기존파일/견적서_앱시트.xlsx')
    const workbook = xlsx.readFile(filePath)

    // Load sheets
    const quoteSheet = xlsx.utils.sheet_to_json<any>(workbook.Sheets['견적서'])
    const itemSheet = xlsx.utils.sheet_to_json<any>(workbook.Sheets['견적품목'])
    const processSheet = xlsx.utils.sheet_to_json<any>(workbook.Sheets['견적공정'])

    console.log(`Loaded ${quoteSheet.length} quotes, ${itemSheet.length} items, ${processSheet.length} processes.`)

    // Grouping logic
    const processesByItemId: Record<string, any[]> = {}
    processSheet.forEach(p => {
        const itemId = p['품목ID']
        if (!processesByItemId[itemId]) processesByItemId[itemId] = []
        processesByItemId[itemId].push(p)
    })

    const itemsByQuoteNo: Record<string, any[]> = {}
    itemSheet.forEach(item => {
        const quoteNo = item['견적번호']
        const itemId = item['품목ID']
        const itemName = item['품명']

        const processes = processesByItemId[itemId] || []
        if (!itemsByQuoteNo[quoteNo]) itemsByQuoteNo[quoteNo] = []

        processes.forEach(p => {
            itemsByQuoteNo[quoteNo].push({
                itemName,
                process: p['공정'],
                qty: typeof p['수량'] === 'number' ? p['수량'] : 0,
                unitPrice: typeof p['단가'] === 'number' ? p['단가'] : null,
                amount: typeof p['금액'] === 'number' ? p['금액'] : 0,
                note: p['비고']
            })
        })
    })

    const defaultSupplierInfo = {
        name: "(주)테스트상사",
        representative: "홍길동",
        address: "서울시 강남구 테헤란로 123",
        businessNo: "123-45-67890",
        contact: "02-123-4567"
    }

    // Process quotes
    for (const q of quoteSheet) {
        const quoteNo = q['견적번호']
        const items = itemsByQuoteNo[quoteNo] || []

        const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0)
        const discount = typeof q['할인'] === 'number' ? q['할인'] : 0
        const supplyPrice = subtotal - discount
        const vat = Math.floor(supplyPrice * 0.1)
        const total = supplyPrice + vat

        await prisma.quote.create({
            data: {
                quoteNo,
                date: typeof q['등록일'] === 'number' ? excelDateToJSDate(q['등록일']) : new Date(),
                recipientName: q['고객사'] || 'Unknown',
                recipientContact: q['고객사담당자'],
                notes: q['메모'],
                supplierInfo: defaultSupplierInfo,
                subtotal,
                discount,
                supplyPrice,
                vat,
                total,
                items: {
                    create: items.map((item, index) => ({
                        name: item.itemName,
                        process: item.process || '',
                        qty: item.qty,
                        unitPrice: item.unitPrice,
                        amount: item.amount,
                        note: item.note,
                        order: index
                    }))
                }
            }
        })
        console.log(`Created quote: ${quoteNo}`)
    }

    console.log('Seeding finished.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
