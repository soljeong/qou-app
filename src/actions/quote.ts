'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getQuotes() {
    try {
        const quotes = await prisma.quote.findMany({
            include: {
                items: {
                    orderBy: {
                        order: 'asc'
                    }
                }
            },
            orderBy: {
                createdAt: 'desc',
            },
        })
        return quotes
    } catch (error) {
        console.error('Failed to fetch quotes:', error)
        return []
    }
}

import { QuoteFormValues } from '@/lib/validations/quote'

export async function createQuote(data: QuoteFormValues) {
    try {
        const { recipientName, recipientContact, date, items, discount: inputDiscount } = data

        const now = new Date()
        const year = now.getFullYear().toString().slice(2)
        const month = (now.getMonth() + 1).toString().padStart(2, '0')
        const prefix = `ES-${year}${month}`

        const lastQuote = await prisma.quote.findFirst({
            where: {
                quoteNo: {
                    startsWith: prefix
                }
            },
            orderBy: {
                quoteNo: 'desc'
            }
        })

        let mmSeq = 1
        if (lastQuote) {
            const parts = lastQuote.quoteNo.split('-')
            if (parts.length >= 3) {
                mmSeq = parseInt(parts[2]) + 1
            }
        }

        const mmSeqStr = mmSeq.toString().padStart(3, '0')
        const yearSeqStr = '0001'
        const quoteNo = `${prefix}-${mmSeqStr}-${yearSeqStr}`

        const subtotal = items.reduce((sum: number, item) => sum + (item.amount || 0), 0)
        const discount = inputDiscount || 0
        const supplyPrice = subtotal - discount
        const vat = Math.floor(supplyPrice * 0.1)
        const total = supplyPrice + vat

        const quote = await prisma.quote.create({
            data: {
                quoteNo,
                date: new Date(date),
                recipientName,
                recipientContact,
                supplierInfo: {},
                subtotal,
                discount,
                supplyPrice,
                vat,
                total,
                items: {
                    create: items.map((item, index: number) => ({
                        name: item.name,
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

        revalidatePath('/quotes')
        return { success: true, quote }
    } catch (error) {
        console.error('Failed to create quote:', error)
        return { success: false, error: 'Failed to create quote' }
    }
}
