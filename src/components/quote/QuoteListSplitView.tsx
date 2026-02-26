'use client'

import { useState } from 'react'
import QuoteTable from './QuoteTable'
import { QuoteHTMLPreview } from './QuoteHTMLPreview'
import { Quote, QuoteItem } from '@prisma/client'

interface QuoteListSplitViewProps {
    quotes: (Quote & { items: QuoteItem[] })[]
}

export default function QuoteListSplitView({ quotes }: QuoteListSplitViewProps) {
    const [selectedQuote, setSelectedQuote] = useState<(Quote & { items: QuoteItem[] }) | null>(
        quotes.length > 0 ? quotes[0] : null
    )

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
            {/* Left: Table Section */}
            <div className="flex-1 overflow-auto border rounded-md bg-white">
                <QuoteTable
                    quotes={quotes}
                    selectedId={selectedQuote?.id}
                    onSelect={setSelectedQuote}
                />
            </div>

            {/* Right: Preview Section */}
            <div className="hidden lg:flex flex-1 flex-col overflow-auto border rounded-md bg-white shadow-sm relative">
                {selectedQuote ? (
                    <>
                        <div className="flex justify-between items-center p-3 border-b bg-slate-50 sticky top-0 z-10">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                견적서 미리보기
                            </h3>
                            {selectedQuote.excelFilePath && (
                                <a
                                    href={selectedQuote.excelFilePath}
                                    download
                                    className="text-xs inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 h-8 px-3 py-1 shadow-sm"
                                >
                                    원본 엑셀 다운로드
                                </a>
                            )}
                        </div>
                        <div className="p-4 origin-top scale-[0.7] xl:scale-[0.8] 2xl:scale-[0.85] w-full mt-4">
                            <QuoteHTMLPreview quote={selectedQuote as any} />
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground italic">
                        미리보기를 보려면 견적서를 선택하세요.
                    </div>
                )}
            </div>
        </div>
    )
}
