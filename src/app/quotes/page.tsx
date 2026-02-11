import { getQuotes } from '@/actions/quote'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import QuoteListSplitView from '@/components/quote/QuoteListSplitView'

export default async function QuoteListPage() {
    const quotes = await getQuotes()

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold tracking-tight">견적서 관리</h1>
                <Link href="/quotes/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> 새 견적서 작성
                    </Button>
                </Link>
            </div>

            <QuoteListSplitView quotes={quotes as any} />
        </div>
    )
}
