'use client';

import React from 'react';
import { Quote, QuoteItem } from '@prisma/client';
import { calculateItemSpans } from '@/lib/quote-utils';
import { format } from 'date-fns';

interface QuoteHTMLPreviewProps {
    quote: Quote & { items: QuoteItem[], recipientContact?: string | null };
}

export const QuoteHTMLPreview = ({ quote }: QuoteHTMLPreviewProps) => {
    const itemSpans = calculateItemSpans(quote.items);
    const totalAmount = quote.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const discount = (quote as any).discount || 0;
    const supplyPrice = totalAmount - discount;
    const vat = Math.floor(supplyPrice * 0.1);
    const total = supplyPrice + vat;

    return (
        <div className="bg-white p-[40px] shadow-lg w-[210mm] min-h-[297mm] mx-auto text-[10pt] font-['Noto_Sans_KR',_sans-serif] leading-relaxed text-black printable-area box-border">
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap');
            `}</style>

            {/* Header */}
            <div className="relative flex justify-center mb-8 pt-2">
                <div className="absolute top-0 right-0 text-[10pt] font-medium">NO. {quote.quoteNo}</div>
                <h1 className="text-5xl font-bold tracking-[25px] text-center mt-6">견 적 서</h1>
            </div>

            {/* Info Section */}
            <div className="flex border border-black h-[140px] mb-8">
                {/* Recipient Details */}
                <div className="w-[45%] p-4 border-r border-black flex flex-col items-center justify-center text-center space-y-2">
                    <div className="text-3xl font-bold tracking-tight">{quote.recipientName}</div>
                    <div className="text-[12pt] font-medium">
                        {quote.recipientContact ? `${quote.recipientContact} 귀하` : '귀하'}
                    </div>
                    <div className="text-[11pt] tracking-widest leading-none">
                        {`${new Date(quote.date).getFullYear()}. ${new Date(quote.date).getMonth() + 1}. ${new Date(quote.date).getDate()}.`}
                    </div>
                    <div className="text-[11pt]">아래와 같이 견적합니다.</div>
                </div>
                {/* Supplier Details (Table Layout) */}
                <div className="flex-1 flex text-[9pt]">
                    <div className="w-8 flex items-center justify-center bg-gray-100 border-r border-black font-bold text-center leading-tight py-4">
                        공<br />급<br />자
                    </div>
                    <div className="flex-1 flex flex-col">
                        <div className="flex h-1/5 border-b border-black items-center px-4">
                            <span className="w-20 font-bold shrink-0">등록번호</span>
                            <span className="font-bold text-[10pt]">137-81-30557</span>
                        </div>
                        <div className="flex h-1/5 border-b border-black items-center">
                            <div className="flex flex-1 items-center px-4 border-r border-black h-full">
                                <span className="w-20 font-bold shrink-0">상 호</span>
                                <span>은성 일렉콤</span>
                            </div>
                            <div className="flex flex-1 items-center px-4 h-full">
                                <span className="w-16 font-bold shrink-0">대표자명</span>
                                <span>임인걸</span>
                            </div>
                        </div>
                        <div className="flex h-1/5 border-b border-black items-center px-4">
                            <span className="w-20 font-bold shrink-0">사업장주소</span>
                            <span>인천광역시 서구 원창로 61-11</span>
                        </div>
                        <div className="flex flex-1 items-center border-b border-black">
                            <div className="flex flex-1 items-center px-4 border-r border-black h-full">
                                <span className="w-20 font-bold shrink-0">업 태</span>
                                <span>제조</span>
                            </div>
                            <div className="flex flex-1 items-center px-4 h-full">
                                <span className="w-16 font-bold shrink-0">종 목</span>
                                <span>전자부품</span>
                            </div>
                        </div>
                        <div className="flex h-1/5 items-center px-4">
                            <span className="w-20 font-bold shrink-0">연 락 처</span>
                            <span>Tel. 032-582-8715</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="border-x border-t border-black text-sm">
                <div className="flex bg-gray-100 font-bold border-b border-black text-center h-10 items-center">
                    <div className="w-[25%] border-r border-black">품 명</div>
                    <div className="w-[20%] border-r border-black">규 격</div>
                    <div className="w-[10%] border-r border-black">수량</div>
                    <div className="w-[15%] border-r border-black">단 가</div>
                    <div className="w-[15%] border-r border-black">금 액</div>
                    <div className="w-[15%]">비 고</div>
                </div>
                {quote.items.map((item, index) => {
                    const spanInfo = itemSpans[index];
                    const amount = item.amount || 0;
                    const isLastItem = index === quote.items.length - 1;

                    return (
                        <div key={item.id} className="flex border-black items-stretch min-h-[40px]">
                            {spanInfo.isFirst ? (
                                <div
                                    className={`w-[25%] border-r border-black flex items-center justify-center p-2 font-bold ${(!isLastItem && !spanInfo.isLastInSpan) ? '' : 'border-b'
                                        }`}
                                    style={{ height: `${spanInfo.rowSpan * 40}px` }} // Apply height based on rowSpan
                                >
                                    {item.name}
                                </div>
                            ) : null}
                            <div className="w-[20%] border-r border-b border-black flex items-center p-2">{item.process}</div>
                            <div className="w-[10%] border-r border-b border-black flex items-center justify-center p-2">{item.qty}</div>
                            <div className="w-[15%] border-r border-b border-black flex items-center justify-end p-2 px-3 text-right">
                                {item.unitPrice !== null ? `₩ ${item.unitPrice.toLocaleString()}` : 'PP'}
                            </div>
                            <div className="w-[15%] border-r border-b border-black flex items-center justify-end p-2 px-3 text-right font-bold">
                                ₩ {amount.toLocaleString()}
                            </div>
                            <div className="w-[15%] border-b border-black flex items-center justify-center p-2 text-xs text-center">
                                {item.note}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Totals Summary */}
            <div className="mt-8 flex justify-end">
                <table className="w-[35%] border-collapse border border-black text-[10pt] font-medium">
                    <tbody>
                        {discount > 0 && (
                            <>
                                <tr className="h-8">
                                    <td className="border border-black px-3 py-1 bg-gray-50 font-bold w-1/2">소 계</td>
                                    <td className="border border-black px-3 py-1 text-right font-bold w-1/2">₩ {totalAmount.toLocaleString()}</td>
                                </tr>
                                <tr className="h-8">
                                    <td className="border border-black px-3 py-1 bg-gray-50 font-bold text-destructive">할 인</td>
                                    <td className="border border-black px-3 py-1 text-right font-bold text-destructive">₩ -{discount.toLocaleString()}</td>
                                </tr>
                            </>
                        )}
                        <tr className="h-8">
                            <td className="border border-black px-3 py-1 bg-gray-50 font-bold w-1/2">공급가액</td>
                            <td className="border border-black px-3 py-1 text-right font-bold w-1/2">₩ {supplyPrice.toLocaleString()}</td>
                        </tr>
                        <tr className="h-8">
                            <td className="border border-black px-3 py-1 bg-gray-50 font-bold">부 가 세</td>
                            <td className="border border-black px-3 py-1 text-right font-bold">₩ {vat.toLocaleString()}</td>
                        </tr>
                        <tr className="h-8">
                            <td className="border border-black px-3 py-1 bg-gray-50 font-bold">합 계</td>
                            <td className="border border-black px-3 py-1 text-right font-bold text-[11pt]">₩ {total.toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Footer Notes (Placeholder matching image) */}
            <div className="mt-12 text-[9pt] space-y-1 font-medium italic opacity-80">
                <div>** 메탈마스크 개당 110,000원 입니다..</div>
                <div>** 메탈마스크 프레임은 대여 기준입니다.</div>
                <div>** 추후 메탈마스크 폐기시에 프레임은 반납요청드립니다.</div>
            </div>
        </div>
    );
};
