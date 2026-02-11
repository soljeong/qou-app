import QuoteForm from '@/components/quote/QuoteForm'

export default function NewQuotePage() {
    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold tracking-tight mb-8">새 견적서 작성</h1>
            <QuoteForm />
        </div>
    )
}
