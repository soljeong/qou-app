import prisma from '@/lib/prisma'
import QuoteForm from '@/components/quote/QuoteForm'
import { notFound } from 'next/navigation'

interface Props {
    params: Promise<{ id: string }>
}

export default async function EditQuotePage({ params }: Props) {
    const { id } = await params

    const quote = await prisma.quote.findUnique({
        where: { id },
        include: { items: { orderBy: { order: 'asc' } } }
    })

    if (!quote) {
        notFound()
    }

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold tracking-tight mb-8">견적서 수정</h1>
            <QuoteForm initialData={quote} />
        </div>
    )
}
