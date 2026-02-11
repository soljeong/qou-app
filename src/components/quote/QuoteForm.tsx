'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form"

import { format } from "date-fns"
import { CalendarIcon, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { quoteSchema, QuoteFormValues } from "@/lib/validations/quote"
import { createQuote } from "@/actions/quote"
import { updateQuote } from "@/actions/quote-update"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Quote, QuoteItem } from "@prisma/client"

interface QuoteFormProps {
    initialData?: Quote & { items: QuoteItem[] }
}

export default function QuoteForm({ initialData }: QuoteFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const defaultItems = [
        { name: "", process: "", qty: 1, unitPrice: 0, note: "" }
    ]

    const form = useForm<QuoteFormValues>({
        resolver: zodResolver(quoteSchema),
        defaultValues: initialData ? {
            recipientName: initialData.recipientName,
            date: new Date(initialData.date),
            items: initialData.items.map(item => ({
                name: item.name,
                process: item.process,
                qty: item.qty,
                unitPrice: item.unitPrice,
                note: item.note || ""
            }))
        } : {
            recipientName: "",
            items: defaultItems,
            date: new Date(),
        },
    })

    const { fields, append, remove } = useFieldArray({
        name: "items",
        control: form.control,
    })

    // Real-time Total Calculation
    const items = form.watch("items")
    const totalAmount = items.reduce((sum, item) => {
        const amount = (item.qty || 0) * (item.unitPrice || 0)
        return sum + amount
    }, 0)
    const vat = Math.floor(totalAmount * 0.1)
    const grandTotal = totalAmount + vat

    async function onSubmit(data: QuoteFormValues) {
        setIsSubmitting(true)
        try {
            let result;
            if (initialData) {
                result = await updateQuote(initialData.id, data)
            } else {
                result = await createQuote(data)
            }

            if (result.success) {
                router.push('/quotes')
                router.refresh()
            } else {
                alert("견적서 저장 실패: " + result.error)
            }
        } catch (error) {
            console.error(error)
            alert("오류가 발생했습니다.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="recipientName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>수신처 (업체명)</FormLabel>
                                <FormControl>
                                    <Input placeholder="업체명 입력" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>견적일</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "yyyy-MM-dd")
                                                ) : (
                                                    <span>날짜 선택</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                                date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">견적 품목</h3>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ name: "", process: "", qty: 1, unitPrice: 0, note: "" })}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            품목 추가
                        </Button>
                    </div>

                    <div className="rounded-md border">
                        <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 text-sm font-medium text-muted-foreground">
                            <div className="col-span-3">품명</div>
                            <div className="col-span-2">공정</div>
                            <div className="col-span-1 text-center">수량</div>
                            <div className="col-span-2 text-right">단가</div>
                            <div className="col-span-2 text-right">금액</div>
                            <div className="col-span-1 text-center">비고</div>
                            <div className="col-span-1"></div>
                        </div>
                        {fields.map((field, index) => {
                            const currentItem = items[index] || {}
                            const amount = (currentItem.qty || 0) * (currentItem.unitPrice || 0)

                            return (
                                <div key={field.id} className="grid grid-cols-12 gap-2 p-2 items-center border-t">
                                    {/* Name */}
                                    <div className="col-span-3">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.name`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input {...field} placeholder="품명" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    {/* Process */}
                                    <div className="col-span-2">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.process`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input {...field} placeholder="공정" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    {/* Qty */}
                                    <div className="col-span-1">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.qty`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            {...field}
                                                            onChange={e => field.onChange(parseFloat(e.target.value))}
                                                            className="text-center"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    {/* Unit Price */}
                                    <div className="col-span-2">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.unitPrice`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            {...field}
                                                            value={field.value ?? ''}
                                                            onChange={e => {
                                                                const val = e.target.value === '' ? null : parseFloat(e.target.value)
                                                                field.onChange(val)
                                                            }}
                                                            placeholder="단가 (0 or Empty)"
                                                            className="text-right"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    {/* Amount (Read Only) */}
                                    <div className="col-span-2 text-right pr-2 font-medium">
                                        {amount.toLocaleString()}
                                    </div>
                                    {/* Note */}
                                    <div className="col-span-1">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.note`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input {...field} placeholder="비고" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    {/* Remove Button */}
                                    <div className="col-span-1 text-center">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => remove(index)}
                                            disabled={fields.length === 1}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Totals Summary */}
                    <div className="flex justify-end mt-4">
                        <div className="w-1/3 bg-muted p-4 rounded-lg space-y-2">
                            <div className="flex justify-between">
                                <span>공급가액</span>
                                <span>{totalAmount.toLocaleString()} 원</span>
                            </div>
                            <div className="flex justify-between">
                                <span>부가세 (10%)</span>
                                <span>{vat.toLocaleString()} 원</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-300">
                                <span>합계</span>
                                <span>{grandTotal.toLocaleString()} 원</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "저장 중..." : "견적서 저장"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
