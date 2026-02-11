import { z } from "zod"

export const quoteItemSchema = z.object({
    name: z.string().min(1, "품명을 입력해주세요"),
    process: z.string().optional(),
    qty: z.number().min(1, "수량은 1 이상이어야 합니다"),
    unitPrice: z.number().nullable().optional(), // Nullable for "Separate Quote"
    note: z.string().optional(),
})

export const quoteSchema = z.object({
    recipientName: z.string().min(1, "수신처를 입력해주세요"),
    recipientContact: z.string().optional(),
    date: z.date(),
    discount: z.number().default(0),
    items: z.array(quoteItemSchema).min(1, "최소 1개 이상의 품목을 추가해주세요"),
})

export type QuoteFormValues = z.infer<typeof quoteSchema>
