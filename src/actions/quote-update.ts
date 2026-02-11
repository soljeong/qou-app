'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { QuoteFormValues } from '@/lib/validations/quote'

export async function updateQuote(id: string, data: QuoteFormValues) {
    try {
        const { recipientName, recipientContact, date, items, discount: inputDiscount } = data

        // Calculate totals
        const subtotal = items.reduce((sum: number, item) => sum + (item.amount || 0), 0)
        const discount = inputDiscount || 0
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
                    recipientContact,
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
            if (items.length > 0) {
                await tx.quoteItem.createMany({
                    data: items.map((item, index: number) => ({
                        quoteId: id,
                        name: item.name,
                        process: item.process || '',
                        qty: item.qty,
                        unitPrice: item.unitPrice,
                        amount: item.amount,
                        note: item.note,
                        order: index
                    }))
                })
            }
        })

        revalidatePath('/quotes')
        return { success: true }
    } catch (error) {
        console.error('Failed to update quote:', error)
        return { success: false, error: 'Failed to update quote' }
    }
}
