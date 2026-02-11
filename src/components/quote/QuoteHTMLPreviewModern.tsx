import React, { forwardRef } from 'react';
import { Quote, QuoteItem } from '@prisma/client';
import { calculateItemSpans } from '@/lib/quote-utils';
import { format } from 'date-fns';

interface QuoteHTMLPreviewProps {
    quote: Quote & { items: QuoteItem[], recipientContact?: string | null };
}

export const QuoteHTMLPreviewModern = forwardRef<HTMLDivElement, QuoteHTMLPreviewProps>(({ quote }, ref) => {
    const itemSpans = calculateItemSpans(quote.items);
    const totalAmount = quote.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const discount = (quote as any).discount || 0;
    const supplyPrice = totalAmount - discount;
    const vat = Math.floor(supplyPrice * 0.1);
    const total = supplyPrice + vat;

    return (
        <div
            id="quote-preview-content"
            ref={ref}
            className="bg-white p-[50px] shadow-lg w-[210mm] min-h-[297mm] mx-auto text-[10.5pt] font-sans leading-relaxed text-slate-900 printable-area box-border"
        >
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
            `}</style>

            {/* Top Bar Decoration */}
            <div className="h-1.5 w-full bg-slate-900 mb-12 rounded-full" />

            {/* Header Section */}
            <div className="flex justify-between items-start mb-16 px-2">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">QUOTATION</h1>
                    <div className="text-slate-500 font-medium">No. {quote.quoteNo}</div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold mb-1">은성 일렉콤</div>
                    <div className="text-slate-500 text-sm">ES ELECTCOM Co., Ltd.</div>
                </div>
            </div>

            {/* Address & Date Section */}
            <div className="grid grid-cols-2 gap-12 mb-16 px-2">
                <div className="space-y-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">TO RECIPIENT</div>
                    <div className="space-y-1">
                        <div className="text-2xl font-bold text-slate-900">{quote.recipientName}</div>
                        {quote.recipientContact && (
                            <div className="text-slate-600 font-medium">{quote.recipientContact}</div>
                        )}
                        <div className="text-slate-500 pt-2">아래와 같이 견적을 제출합니다.</div>
                    </div>
                </div>
                <div className="space-y-4 text-right">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">DATE & CONTACT</div>
                    <div className="space-y-1 text-slate-600">
                        <div className="font-bold text-slate-900">{format(new Date(quote.date), 'yyyy년 MM월 dd일')}</div>
                        <div>인천광역시 서구 원창로 61-11</div>
                        <div>Tel. 032-582-8715</div>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="w-full mb-12">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b-2 border-slate-900">
                            <th className="py-4 px-4 text-left font-bold text-slate-900 w-[45%]">DESCRIPTION / PROCESS</th>
                            <th className="py-4 px-4 text-center font-bold text-slate-900 w-[10%]">QTY</th>
                            <th className="py-4 px-4 text-right font-bold text-slate-900 w-[20%]">UNIT PRICE</th>
                            <th className="py-4 px-4 text-right font-bold text-slate-900 w-[25%] text-lg">AMOUNT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quote.items.map((item, index) => {
                            const spanInfo = itemSpans[index];
                            const amount = item.amount || 0;
                            const isFirstInSpan = spanInfo.isFirst;

                            return (
                                <tr key={item.id} className="border-b border-slate-100 group">
                                    <td className="py-5 px-4 align-top">
                                        {isFirstInSpan && (
                                            <div className="font-bold text-slate-900 mb-2 break-all max-w-[320px] leading-tight text-[11pt]">
                                                {item.name}
                                            </div>
                                        )}
                                        <div className="text-slate-500 font-medium pl-2 border-l-2 border-slate-100 py-0.5">
                                            {item.process}
                                        </div>
                                    </td>
                                    <td className="py-5 px-4 text-center align-middle font-medium text-slate-600">
                                        {item.qty}
                                    </td>
                                    <td className="py-5 px-4 text-right align-middle font-medium text-slate-600">
                                        {item.unitPrice !== null ? item.unitPrice.toLocaleString() : 'PP'}
                                    </td>
                                    <td className="py-5 px-4 text-right align-middle">
                                        <div className="font-bold text-slate-900">
                                            ₩ {amount.toLocaleString()}
                                        </div>
                                        {item.note && (
                                            <div className="text-[9pt] text-slate-400 italic mt-1 font-normal break-all max-w-[200px] ml-auto">
                                                {item.note}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end mb-20">
                <div className="w-[300px] space-y-4">
                    {discount > 0 && (
                        <>
                            <div className="flex justify-between items-center text-slate-500 px-2 leading-none">
                                <span className="text-sm font-medium">SUBTOTAL</span>
                                <span className="font-bold">₩ {totalAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-rose-500 px-2 leading-none">
                                <span className="text-sm font-medium">DISCOUNT</span>
                                <span className="font-bold">- ₩ {discount.toLocaleString()}</span>
                            </div>
                        </>
                    )}
                    <div className="flex justify-between items-center text-slate-500 px-2 leading-none">
                        <span className="text-sm font-medium uppercase tracking-wider">Net Amount</span>
                        <span className="font-bold">₩ {supplyPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 px-2 leading-none pb-4 border-b border-slate-200">
                        <span className="text-sm font-medium uppercase tracking-wider">VAT (10%)</span>
                        <span className="font-bold">₩ {vat.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-900 text-white p-5 rounded-xl shadow-lg mt-4 transform translate-y-2">
                        <span className="text-xs font-bold uppercase tracking-[2px] opacity-70">Total AMOUNT</span>
                        <span className="text-2xl font-black">₩ {total.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Footer / Terms */}
            <div className="mt-auto px-4 py-8 bg-slate-50 rounded-2xl">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Terms & Notes</div>
                <div className="grid grid-cols-2 gap-8 text-[9.5pt] text-slate-500 leading-relaxed font-medium">
                    <ul className="list-disc list-inside space-y-1">
                        <li>메탈마스크 개당 110,000원</li>
                        <li>메탈마스크 프레임은 대여 기준입니다</li>
                    </ul>
                    <ul className="list-disc list-inside space-y-1">
                        <li>추후 프레임 반납 요청드립니다</li>
                        <li>견적서 유효기간: 발행일로부터 30일</li>
                    </ul>
                </div>
            </div>

            {/* Stamp Area (Invisible placeholder) */}
            <div className="absolute bottom-28 right-24 w-24 h-24 border-4 border-slate-100 rounded-full flex items-center justify-center opacity-20 pointer-events-none italic font-bold text-slate-300">
                (印)
            </div>
        </div>
    );
});
