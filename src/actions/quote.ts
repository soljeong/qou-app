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
        const { recipientName, recipientContact, date, items, notes, discount: inputDiscount } = data

        const quoteDate = new Date(date)
        const year = quoteDate.getFullYear().toString().slice(2)
        const fullYear = quoteDate.getFullYear()
        const month = (quoteDate.getMonth() + 1).toString().padStart(2, '0')
        const prefix = `ES-${year}${month}`
        const yearPrefix = `ES-${year}`

        // Get the last quote in the same month for mmSeq
        const lastQuoteMonth = await prisma.quote.findFirst({
            where: {
                quoteNo: {
                    startsWith: prefix
                }
            },
            orderBy: {
                quoteNo: 'desc'
            }
        })

        // Get the last quote in the same year for yearSeq
        const lastQuoteYear = await prisma.quote.findFirst({
            where: {
                quoteNo: {
                    startsWith: yearPrefix
                }
            },
            orderBy: {
                quoteNo: 'desc'
            }
        })

        let mmSeq = 1
        if (lastQuoteMonth) {
            const parts = lastQuoteMonth.quoteNo.split('-')
            if (parts.length >= 3) {
                mmSeq = parseInt(parts[2]) + 1
            }
        }

        let yearSeq = 1
        if (lastQuoteYear) {
            const parts = lastQuoteYear.quoteNo.split('-')
            if (parts.length >= 4) {
                yearSeq = parseInt(parts[3]) + 1
            }
        }

        const mmSeqStr = mmSeq.toString().padStart(3, '0')
        const yearSeqStr = yearSeq.toString().padStart(4, '0')
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
                notes,
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
