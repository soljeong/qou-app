import { getQuotes } from '@/actions/quote'
import QuoteListSplitView from '@/components/quote/QuoteListSplitView'
import QuoteListHeaderActions from '@/components/quote/QuoteListHeaderActions'

export default async function QuoteListPage() {
    const quotes = await getQuotes()

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold tracking-tight">견적서 관리</h1>
                <QuoteListHeaderActions />
            </div>

            <QuoteListSplitView quotes={quotes as any} />
        </div>
    )
}
