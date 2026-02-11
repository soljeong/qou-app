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
                    <div className="p-4 origin-top scale-[0.7] xl:scale-[0.8] 2xl:scale-[0.85] w-full">
                        <QuoteHTMLPreview quote={selectedQuote as any} />
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground italic">
                        미리보기를 보려면 견적서를 선택하세요.
                    </div>
                )}
            </div>
        </div>
    )
}
