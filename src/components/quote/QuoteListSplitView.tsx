'use client'

import { useState, useMemo } from 'react'
import QuoteTable from './QuoteTable'
import { QuoteHTMLPreview } from './QuoteHTMLPreview'
import { Quote, QuoteItem } from '@prisma/client'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QuoteListSplitViewProps {
    quotes: (Quote & { items: QuoteItem[] })[]
}

export default function QuoteListSplitView({ quotes }: QuoteListSplitViewProps) {
    const [selectedQuote, setSelectedQuote] = useState<(Quote & { items: QuoteItem[] }) | null>(
        quotes.length > 0 ? quotes[0] : null
    )
    const [searchText, setSearchText] = useState('')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')

    const filteredQuotes = useMemo(() => {
        const keyword = searchText.trim().toLowerCase()
        const fromDate = dateFrom ? (() => { const d = new Date(dateFrom); d.setHours(0, 0, 0, 0); return d })() : null
        const toDate = dateTo ? (() => { const d = new Date(dateTo); d.setHours(23, 59, 59, 999); return d })() : null
        return quotes.filter((quote) => {
            if (keyword) {
                const matchesQuoteNo = quote.quoteNo.toLowerCase().includes(keyword)
                const matchesRecipient = quote.recipientName.toLowerCase().includes(keyword)
                if (!matchesQuoteNo && !matchesRecipient) return false
            }
            const quoteDate = new Date(quote.date)
            if (fromDate && quoteDate < fromDate) return false
            if (toDate && quoteDate > toDate) return false
            return true
        })
    }, [quotes, searchText, dateFrom, dateTo])

    const hasFilter = searchText || dateFrom || dateTo

    const handleClearFilters = () => {
        setSearchText('')
        setDateFrom('')
        setDateTo('')
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Search & Filter Bar */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                        type="text"
                        placeholder="견적번호 또는 수신처로 검색"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <div className="flex items-center gap-1">
                    <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-36"
                        aria-label="시작일"
                        max={dateTo || undefined}
                    />
                    <span className="text-muted-foreground text-sm">~</span>
                    <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-36"
                        aria-label="종료일"
                        min={dateFrom || undefined}
                    />
                </div>
                {hasFilter && (
                    <Button variant="ghost" size="sm" onClick={handleClearFilters} className="gap-1">
                        <X className="h-3.5 w-3.5" />
                        초기화
                    </Button>
                )}
                <span className="text-sm text-muted-foreground">
                    {filteredQuotes.length}건
                </span>
            </div>

        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-260px)]">
            {/* Left: Table Section */}
            <div className="flex-1 overflow-auto border rounded-md bg-white">
                <QuoteTable
                    quotes={filteredQuotes}
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
        </div>
    )
}
