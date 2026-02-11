import React, { forwardRef } from 'react';
import { Quote, QuoteItem } from '@prisma/client';
import { calculateItemSpans } from '@/lib/quote-utils';
import { format } from 'date-fns';

interface QuoteHTMLPreviewProps {
    quote: Quote & { items: QuoteItem[], recipientContact?: string | null };
}

export const QuoteHTMLPreviewCompact = forwardRef<HTMLDivElement, QuoteHTMLPreviewProps>(({ quote }, ref) => {
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
            className="bg-white p-[40px] shadow-lg w-[210mm] min-h-[297mm] mx-auto text-[10pt] font-sans leading-tight text-black printable-area box-border flex flex-col"
        >
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
                .compact-table th, .compact-table td {
                    border: 1px solid #000;
                }
            `}</style>

            {/* Compact Header Section */}
            <div className="flex justify-between items-end border-b-2 border-black pb-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tighter mb-4">견 적 서</h1>
                    <div className="space-y-0.5">
                        <div className="flex items-baseline gap-2">
                            <span className="text-[9pt] font-bold text-gray-500 w-12 underline decoration-gray-300">수 신 :</span>
                            <span className="text-lg font-bold">{quote.recipientName}</span>
                        </div>
                        {quote.recipientContact && (
                            <div className="flex items-baseline gap-2">
                                <span className="text-[9pt] font-bold text-gray-500 w-12 italic">참 조 :</span>
                                <span className="font-medium">{quote.recipientContact}  貴下</span>
                            </div>
                        )}
                        <div className="text-[9pt] text-gray-600 pt-1">아래와 같이 견적합니다. (단위:원)</div>
                    </div>
                </div>

                <div className="flex gap-4 items-start">
                    <div className="text-right space-y-0.5 text-[9pt]">
                        <div className="font-bold text-xs text-gray-400 mb-1">SUPPLIER INFO</div>
                        <div className="text-base font-bold">은성 일렉콤</div>
                        <div>사업자번호: 137-08-62025</div>
                        <div>대표자: 박은숙</div>
                        <div>인천 서구 원창로 61-11</div>
                        <div>Tel: 032-582-8715 / Fax: 032-582-8716</div>
                    </div>
                    <div className="w-12 h-12 border border-gray-200 rounded flex items-center justify-center text-[8pt] text-gray-300 italic">
                        (印)
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mb-4 px-1">
                <div className="font-bold text-sm">NO. {quote.quoteNo}</div>
                <div className="font-medium text-sm">{format(new Date(quote.date), 'yyyy년 MM월 dd일')}</div>
            </div>

            {/* High Density Table */}
            <table className="w-full compact-table table-fixed mb-6 border border-black">
                <thead>
                    <tr className="bg-gray-50 text-[9pt]">
                        <th className="py-2 px-1 w-[40%] border border-black text-center">품 명 / 규 격</th>
                        <th className="py-2 px-1 w-[12%] border border-black text-center">공 정</th>
                        <th className="py-2 px-1 w-[8%] border border-black text-center">수량</th>
                        <th className="py-2 px-1 w-[18%] border border-black text-center">단 가</th>
                        <th className="py-2 px-1 w-[22%] border border-black text-center">금 액</th>
                    </tr>
                </thead>
                <tbody>
                    {quote.items.map((item, index) => {
                        const spanInfo = itemSpans[index];
                        const amount = item.amount || 0;
                        const isFirstInSpan = spanInfo.isFirst;

                        return (
                            <tr key={item.id} className="h-9">
                                {isFirstInSpan && (
                                    <td
                                        className="px-2 align-middle overflow-hidden border border-black"
                                        rowSpan={spanInfo.rowSpan}
                                    >
                                        <div className="font-bold break-all leading-tight" title={item.name}>
                                            {item.name}
                                        </div>
                                    </td>
                                )}
                                <td className="px-2 align-middle text-center text-[9pt] font-medium text-gray-700 truncate border border-black">
                                    {item.process}
                                </td>
                                <td className="px-1 align-middle text-center border border-black">
                                    {item.qty}
                                </td>
                                <td className="px-2 align-middle text-right font-medium whitespace-nowrap border border-black">
                                    {item.unitPrice !== null ? `₩ ${item.unitPrice.toLocaleString()}` : 'PP'}
                                </td>
                                <td className="px-2 align-middle text-right font-bold whitespace-nowrap border border-black">
                                    ₩ {amount.toLocaleString()}
                                </td>
                            </tr>
                        );
                    })}
                    {/* Empty rows to fill space if few items */}
                    {quote.items.length < 15 && Array.from({ length: 15 - quote.items.length }).map((_, i) => (
                        <tr key={`empty-${i}`} className="h-9">
                            <td className="px-2 border border-blue-100/10"></td>
                            <td className="px-2 border border-blue-100/10"></td>
                            <td className="px-1 border border-blue-100/10"></td>
                            <td className="px-2 border border-blue-100/10"></td>
                            <td className="px-2 border border-blue-100/10"></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Summary Block */}
            <div className="flex justify-between items-start gap-8 mt-auto">
                <div className="flex-1 bg-gray-50 p-4 rounded border border-gray-200 min-h-[100px]">
                    <div className="text-[8pt] font-bold text-gray-400 mb-2 uppercase tracking-tighter">특이사항 및 비고</div>
                    <ul className="text-[9pt] text-gray-600 space-y-1 ml-4 list-disc">
                        <li>메탈마스크 개당 110,000원 (프레임 대여 기준)</li>
                        <li>추후 프레임 반납 요청드립니다.</li>
                        <li>본 견적은 발행일로부터 30일간 유효합니다.</li>
                        {/* Dynamic Item Notes could go here if aggregated, but we follow user wish to keep main table clear */}
                    </ul>
                </div>

                <div className="w-[280px]">
                    <table className="w-full compact-table">
                        <tbody>
                            {discount > 0 && (
                                <>
                                    <tr>
                                        <td className="px-3 py-1 bg-gray-50 font-bold text-[9pt]">소 계</td>
                                        <td className="px-3 py-1 text-right font-medium">₩ {totalAmount.toLocaleString()}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-3 py-1 bg-gray-50 font-bold text-[9pt]">할 인</td>
                                        <td className="px-3 py-1 text-right font-bold text-red-600">- ₩ {discount.toLocaleString()}</td>
                                    </tr>
                                </>
                            )}
                            <tr>
                                <td className="px-3 py-1 bg-gray-50 font-bold text-[9pt]">공급가액</td>
                                <td className="px-3 py-1 text-right font-bold">₩ {supplyPrice.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td className="px-3 py-1 bg-gray-50 font-bold text-[9pt]">부가세</td>
                                <td className="px-3 py-1 text-right font-medium text-gray-600">₩ {vat.toLocaleString()}</td>
                            </tr>
                            <tr className="bg-black text-white">
                                <td className="px-3 py-3 font-bold text-lg">총 합 계</td>
                                <td className="px-3 py-3 text-right font-black text-xl whitespace-nowrap">₩ {total.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
});
