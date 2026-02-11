import prisma from '@/lib/prisma'
import PDFViewerWrapper from '@/components/pdf/PDFViewerWrapper'
import { notFound } from 'next/navigation'

interface Props {
    params: Promise<{ id: string }>
}

export default async function QuotePDFPage({ params }: Props) {
    const { id } = await params

    const quote = await prisma.quote.findUnique({
        where: { id },
        include: { items: { orderBy: { order: 'asc' } } }
    })

    if (!quote) {
        notFound()
    }

    return <PDFViewerWrapper quote={quote} />
}
