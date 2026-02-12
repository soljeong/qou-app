'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm, useWatch } from "react-hook-form"

import { format } from "date-fns"
import { CalendarIcon, Plus, Trash2, FileText, ArrowLeft, Download, Loader2 } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { quoteSchema, QuoteFormValues } from "@/lib/validations/quote"
import { createQuote } from "@/actions/quote"
import { updateQuote } from "@/actions/quote-update"
import { useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { Quote, QuoteItem } from "@prisma/client"
import { QuoteHTMLPreview } from "./QuoteHTMLPreview"
import { QuoteHTMLPreviewModern } from "./QuoteHTMLPreviewModern"
import { QuoteHTMLPreviewCompact } from "./QuoteHTMLPreviewCompact"

interface QuoteFormProps {
    initialData?: Quote & {
        items: QuoteItem[],
        recipientContact?: string | null,
        discount?: number
    }
}

// Internal component for the sticky preview wrapper
const QuotePreviewWrapper = ({ data, initialQuoteNo }: { data: QuoteFormValues, initialQuoteNo?: string }) => {
    const [template, setTemplate] = useState<'classic' | 'modern' | 'compact'>('classic');
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownloadHtmlPdf = async () => {
        setIsDownloading(true);
        try {
            const { exportElementAsPdf } = await import('@/lib/pdf-export');
            await exportElementAsPdf('quote-preview-content', '견적서', data.recipientName);
        } catch (error) {
            alert('PDF 생성 중 오류가 발생했습니다.');
        } finally {
            setIsDownloading(false);
        }
    };

    // Map form values to Quote object structure expected by QuoteHTMLPreview
    const previewQuote: Quote & { items: QuoteItem[] } = useMemo(() => ({
        id: "preview",
        quoteNo: initialQuoteNo || ("PREVIEW-" + format(new Date(), 'yyMM')),
        recipientName: data.recipientName || "수신처 미입력",
        recipientContact: data.recipientContact || "",
        notes: data.notes || "",
        date: data.date || new Date(),
        supplierInfo: {},
        subtotal: data.items.reduce((sum, item) => sum + (item.amount || 0), 0),
        discount: data.discount || 0,
        supplyPrice: data.items.reduce((sum, item) => sum + (item.amount || 0), 0) - (data.discount || 0),
        vat: Math.floor((data.items.reduce((sum, item) => sum + (item.amount || 0), 0) - (data.discount || 0)) * 0.1),
        total: (data.items.reduce((sum, item) => sum + (item.amount || 0), 0) - (data.discount || 0)) + Math.floor((data.items.reduce((sum, item) => sum + (item.amount || 0), 0) - (data.discount || 0)) * 0.1),
        createdAt: new Date(),
        updatedAt: new Date(),
        items: (data.items || []).map((item, idx) => ({
            id: `preview - item - ${idx} `,
            quoteId: "preview",
            name: item.name,
            process: item.process || "",
            qty: item.qty,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            unitPrice: (item.unitPrice as any) ?? null,
            amount: item.amount || 0,
            note: item.note || null,
            order: idx
        }))
    }), [data, initialQuoteNo]);

    return (
        <div className="h-[calc(100vh-120px)] border rounded-lg overflow-hidden bg-gray-100 shadow-sm sticky top-6 flex flex-col">
            <div className="bg-white border-b p-3 flex justify-between items-center shrink-0">
                <div className="flex flex-col gap-1">
                    <span className="font-semibold flex items-center text-sm">
                        <FileText className="mr-2 h-4 w-4" /> 실시간 미리보기 (HTML)
                    </span>
                    <div className="flex bg-slate-100 p-1 rounded-md w-fit">
                        <button
                            onClick={() => setTemplate('classic')}
                            className={cn(
                                "px-3 py-1 text-[11px] font-bold rounded transition-all",
                                template === 'classic' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            전통형
                        </button>
                        <button
                            onClick={() => setTemplate('modern')}
                            className={cn(
                                "px-3 py-1 text-[11px] font-bold rounded transition-all",
                                template === 'modern' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            현대형
                        </button>
                        <button
                            onClick={() => setTemplate('compact')}
                            className={cn(
                                "px-3 py-1 text-[11px] font-bold rounded transition-all",
                                template === 'compact' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            실무형
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadHtmlPdf}
                        disabled={isDownloading}
                        className="h-8 text-xs font-bold bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 disabled:opacity-70"
                    >
                        {isDownloading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                다운로드 중...
                            </>
                        ) : (
                            "HTML PDF 다운로드"
                        )}
                    </Button>
                </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-200 flex justify-center items-start">
                <div className="origin-top scale-[0.55] sm:scale-[0.65] md:scale-[0.75] lg:scale-[0.43] xl:scale-[0.5] 2xl:scale-[0.65]">
                    {template === 'classic' ? (
                        <QuoteHTMLPreview quote={previewQuote} />
                    ) : template === 'modern' ? (
                        <QuoteHTMLPreviewModern quote={previewQuote} />
                    ) : (
                        <QuoteHTMLPreviewCompact quote={previewQuote} />
                    )}
                </div>
            </div>
        </div>
    )
}

export default function QuoteForm({ initialData }: QuoteFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const defaultItems = [
        { name: "", process: "", qty: 1, unitPrice: 0, amount: 0, note: "" }
    ]

    const form = useForm<QuoteFormValues>({
        resolver: zodResolver(quoteSchema),
        defaultValues: initialData ? {
            recipientName: initialData.recipientName,
            recipientContact: initialData.recipientContact || "",
            date: new Date(initialData.date),
            discount: initialData.discount ?? 0,
            items: initialData.items.map(item => ({
                name: item.name,
                process: item.process || "",
                qty: item.qty,
                unitPrice: item.unitPrice,
                amount: item.amount,
                note: item.note || ""
            }))
        } : {
            recipientName: "",
            recipientContact: "",
            discount: 0,
            items: defaultItems.map(item => ({ ...item, amount: 0 })),
            date: new Date(),
        },
    })

    const { fields, append, remove } = useFieldArray({
        name: "items",
        control: form.control,
    })

    // Real-time Total Calculation for the form UI
    const items = form.watch("items")
    const watchedValidValues = useWatch({ control: form.control }); // Watch all values for preview

    // Debounce preview data
    const [previewData, setPreviewData] = useState<QuoteFormValues>(form.getValues())

    useEffect(() => {
        const handler = setTimeout(() => {
            setPreviewData(form.getValues())
        }, 500) // 500ms debounce

        return () => {
            clearTimeout(handler)
        }
    }, [watchedValidValues, form])


    const totalAmount = items.reduce((sum, item) => {
        const amount = (item.qty || 0) * (item.unitPrice || 0)
        return sum + amount
    }, 0)
    const discount = form.watch("discount") || 0
    const supplyPrice = totalAmount - discount
    const vat = Math.floor(supplyPrice * 0.1)
    const grandTotal = supplyPrice + vat

    const onSubmit = async (data: QuoteFormValues) => {
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
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column: Form */}
            <div className="flex-1 min-w-0">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                name="recipientContact"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>수신인 (담당자)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="담당자명 입력 (선택)" {...field} />
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
                                    onClick={() => append({ name: "", process: "", qty: 1, unitPrice: 0, amount: 0, note: "" })}
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
                                    const amount = currentItem.unitPrice !== null
                                        ? (currentItem.qty || 0) * (currentItem.unitPrice || 0)
                                        : (currentItem.amount || 0)

                                    const fieldSequence = ['name', 'process', 'qty', 'unitPrice', 'note'] as const;
                                    type FieldKey = typeof fieldSequence[number];

                                    const handlePaste = (startField: FieldKey) => (e: React.ClipboardEvent<HTMLInputElement>) => {
                                        const pasteData = e.clipboardData.getData('text');
                                        if (!pasteData.includes('\t') && !pasteData.includes('\n')) {
                                            return; // Let default paste handle single cell
                                        }

                                        e.preventDefault();
                                        const lines = pasteData.replace(/\r\n/g, '\n').split('\n');
                                        const rows = lines.filter(line => line.length > 0).map(row => row.split('\t'));
                                        const startFieldIndex = fieldSequence.indexOf(startField);

                                        rows.forEach((rowCells, rowOffset) => {
                                            const targetRowIndex = index + rowOffset;

                                            // Handle row creation if needed
                                            if (targetRowIndex >= fields.length) {
                                                append({ name: "", process: "", qty: 1, unitPrice: 0, amount: 0, note: "" });
                                            }

                                            rowCells.forEach((cellValue, colOffset) => {
                                                const currentFieldIndex = startFieldIndex + colOffset;
                                                if (currentFieldIndex < fieldSequence.length) {
                                                    const fieldKey = fieldSequence[currentFieldIndex];
                                                    let value: string | number | null = cellValue.trim();

                                                    if (fieldKey === 'qty') {
                                                        const parsed = parseInt(value.replace(/,/g, ''));
                                                        value = isNaN(parsed) ? 1 : parsed;
                                                    } else if (fieldKey === 'unitPrice') {
                                                        if (value === '') {
                                                            value = null;
                                                        } else {
                                                            const parsed = parseFloat(value.replace(/,/g, ''));
                                                            value = isNaN(parsed) ? 0 : parsed;
                                                        }
                                                    }

                                                    // @ts-ignore - dynamic key assignment
                                                    form.setValue(`items.${targetRowIndex}.${fieldKey} `, value);

                                                    // Sync amount if qty or unitPrice changed and unitPrice is not null
                                                    if (fieldKey === 'qty' || fieldKey === 'unitPrice') {
                                                        const q = fieldKey === 'qty' ? value as number : form.getValues(`items.${targetRowIndex}.qty`);
                                                        const p = fieldKey === 'unitPrice' ? value as number | null : form.getValues(`items.${targetRowIndex}.unitPrice`);
                                                        if (p !== null && p !== undefined) {
                                                            form.setValue(`items.${targetRowIndex}.amount`, q * p);
                                                        }
                                                    }
                                                }
                                            });
                                        });
                                    };

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
                                                                <Input
                                                                    {...field}
                                                                    placeholder="품명"
                                                                    onPaste={handlePaste('name')}
                                                                />
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
                                                                <Input
                                                                    {...field}
                                                                    placeholder="공정"
                                                                    onPaste={handlePaste('process')}
                                                                />
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
                                                                    onChange={e => {
                                                                        const val = parseFloat(e.target.value) || 0
                                                                        field.onChange(val)
                                                                        // Sync amount if unitPrice is not null
                                                                        const up = form.getValues(`items.${index}.unitPrice`)
                                                                        if (up !== null) {
                                                                            form.setValue(`items.${index}.amount`, val * (up || 0))
                                                                        }
                                                                    }}
                                                                    onPaste={handlePaste('qty')}
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
                                                                        // Sync amount if not null
                                                                        if (val !== null) {
                                                                            const q = form.getValues(`items.${index}.qty`) || 0
                                                                            form.setValue(`items.${index}.amount`, q * val)
                                                                        }
                                                                    }}
                                                                    onPaste={handlePaste('unitPrice')}
                                                                    placeholder="단가 (0 or Empty)"
                                                                    className="text-right"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            {/* Amount */}
                                            <div className="col-span-2">
                                                <FormField
                                                    control={form.control}
                                                    name={`items.${index}.amount`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    {...field}
                                                                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                                                    disabled={items[index]?.unitPrice !== null}
                                                                    placeholder="금액"
                                                                    className={cn(
                                                                        "text-right font-medium",
                                                                        items[index]?.unitPrice !== null && "bg-muted"
                                                                    )}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            {/* Note */}
                                            <div className="col-span-1">
                                                <FormField
                                                    control={form.control}
                                                    name={`items.${index}.note`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    placeholder="비고"
                                                                    onPaste={handlePaste('note')}
                                                                />
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
                        </div>

                        {/* Quote Notes (New) */}
                        <div className="mt-8 border-t pt-6">
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-bold flex items-center gap-2 mb-2">
                                            견적서 메모 (Footnote)
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                placeholder="견적서 하단에 표시될 추가 메모를 입력하세요 (전통형 템플릿 하단에 출력됩니다)"
                                                className="min-h-[120px] resize-none bg-white font-mono text-[13px]"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Totals Summary */}
                        <div className="flex justify-end mt-8">
                            <div className="w-full md:w-1/2 lg:w-3/5 bg-slate-50 border p-5 rounded-xl space-y-3 shadow-sm">
                                <div className="flex justify-between text-slate-600">
                                    <span>품목 합계 (소계)</span>
                                    <span className="font-medium">{totalAmount.toLocaleString()} 원</span>
                                </div>
                                <div className="flex justify-between items-center py-1">
                                    <span className="text-destructive font-bold flex items-center gap-1">
                                        특별 할인
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <FormField
                                            control={form.control}
                                            name="discount"
                                            render={({ field }) => (
                                                <FormItem className="m-0">
                                                    <FormControl>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₩</span>
                                                            <Input
                                                                type="number"
                                                                {...field}
                                                                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                                                className="w-36 h-9 text-right pl-7 font-bold text-slate-700 bg-white"
                                                            />
                                                        </div>
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <span className="text-sm font-bold text-slate-500">원</span>
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-slate-200" />
                                <div className="flex justify-between font-bold text-slate-700">
                                    <span>공급가액</span>
                                    <span>{supplyPrice.toLocaleString()} 원</span>
                                </div>
                                <div className="flex justify-between text-slate-500 text-[13px]">
                                    <span>부가세 (VAT 10%)</span>
                                    <span>{vat.toLocaleString()} 원</span>
                                </div>
                                <div className="flex justify-between font-black text-xl pt-4 border-t-2 border-slate-800 text-slate-900">
                                    <span>최종 합계</span>
                                    <span>{grandTotal.toLocaleString()} 원</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-8">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => router.push('/quotes')}
                                className="text-slate-500 hover:text-slate-800"
                            >
                                목록으로 돌아가기
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="px-8 h-11 font-bold text-base bg-slate-900">
                                {isSubmitting ? "저장 중..." : "견적서 저장 및 확정"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>

            {/* Right Column: Preview */}
            <div className="hidden lg:block w-1/2 max-w-[800px]">
                <QuotePreviewWrapper data={previewData} initialQuoteNo={initialData?.quoteNo} />
            </div>
        </div >
    )
}
