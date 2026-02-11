'use server'

import prisma from '@/lib/prisma'

export async function updateQuote(id: string, data: any) {
    try {
        const { recipientName, date, items } = data

        // Calculate totals
        const subtotal = items.reduce((sum: number, item: any) => sum + (item.qty * (item.unitPrice || 0)), 0)
        const discount = 0
        const supplyPrice = subtotal - discount
        const vat = Math.floor(supplyPrice * 0.1)
        const total = supplyPrice + vat

        // Transaction to update quote and replace items
        await prisma.$transaction(async (tx) => {
            // 1. Update Quote Info
            await tx.quote.update({
                where: { id },
                data: {
                    date: new Date(date),
                    recipientName,
                    subtotal,
                    discount,
                    supplyPrice,
                    vat,
                    total,
                }
            })

            // 2. Delete existing items
            await tx.quoteItem.deleteMany({
                where: { quoteId: id }
            })

            // 3. Create new items
            // Note: Creating many items one by one or createMany?
            // createMany is efficient but let's stick to relation create for simplicity or map
            // Actually createMany is better.
            if (items.length > 0) {
                await tx.quoteItem.createMany({
                    data: items.map((item: any, index: number) => ({
                        quoteId: id,
                        name: item.name,
                        process: item.process || '',
                        qty: item.qty,
                        unitPrice: item.unitPrice,
                        amount: item.qty * (item.unitPrice || 0),
                        note: item.note,
                        order: index
                    }))
                })
            }
        })

        return { success: true }
    } catch (error) {
        console.error('Failed to update quote:', error)
        return { success: false, error: 'Failed to update quote' }
    }
}
