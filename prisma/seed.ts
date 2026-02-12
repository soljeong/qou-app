import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Start seeding...')

    // Note: Manual clearing is not needed when running with 'prisma migrate reset'
    // as it automatically wipes the database.

    const quotes = []
    const now = new Date()
    const year = now.getFullYear().toString().slice(2)
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const prefix = `ES-${year}${month}`

    for (let i = 1; i <= 100; i++) {
        const mmSeq = i.toString().padStart(3, '0')
        const yearSeq = i.toString().padStart(4, '0')
        const quoteNo = `${prefix}-${mmSeq}-${yearSeq}`

        const items = []
        let subtotal = 0

        // 2 items per quote
        for (let j = 1; j <= 2; j++) {
            const itemName = `품목 ${j}`

            // 3 processes per item
            for (let k = 1; k <= 3; k++) {
                const processName = `공정 ${k}`
                const qty = (Math.floor(Math.random() * 10) + 1) * 1000 // 1000, 2000, ... 10000
                const unitPrice = (Math.floor(Math.random() * 50) + 1) * 100 // 100, 200, ... 5000
                const amount = qty * unitPrice
                subtotal += amount

                items.push({
                    name: itemName,
                    process: processName,
                    qty,
                    unitPrice,
                    amount,
                    order: (j - 1) * 3 + (k - 1),
                    note: `참고 사항 (${j}-${k})`
                })
            }
        }

        const discount = 0
        const supplyPrice = subtotal - discount
        const vat = Math.floor(supplyPrice * 0.1)
        const total = supplyPrice + vat

        quotes.push({
            quoteNo,
            date: now,
            recipientName: `거래처 ${i}`,
            recipientContact: `담당자 ${i}`,
            supplierInfo: {
                name: "(주)테스트상사",
                representative: "홍길동",
                address: "서울시 강남구 테헤란로 123",
                businessNo: "123-45-67890",
                contact: "02-123-4567"
            },
            subtotal,
            discount,
            supplyPrice,
            vat,
            total,
            notes: "견적 유효기간: 발행일로부터 30일\n결제 조건: 검수 후 익월 말 현금",
            items: {
                create: items
            }
        })

        // Batch create every 10 quotes to avoid potential payload size issues (though 100 is fine usually)
        if (i % 10 === 0) {
            console.log(`Creating quotes ${i - 9} to ${i}...`)
            for (const q of quotes.splice(0, 10)) {
                await prisma.quote.create({ data: q })
            }
        }
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
