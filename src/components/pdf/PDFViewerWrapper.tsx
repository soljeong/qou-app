'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { Quote, QuoteItem } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download } from 'lucide-react'
import Link from 'next/link'
import { QuotePDF } from './QuotePDF'

// Dynamic import for PDFViewer and PDFDownloadLink
const PDFViewer = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFViewer),
    {
        ssr: false,
        loading: () => <div className="h-full flex items-center justify-center">PDF Viewer Loading...</div>,
    }
)

const PDFDownloadLink = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
    {
        ssr: false,
        loading: () => <Button disabled>Loading...</Button>,
    }
)

interface PDFViewerWrapperProps {
    quote: Quote & { items: QuoteItem[] }
}

export default function PDFViewerWrapper({ quote }: PDFViewerWrapperProps) {
    return (
        <div className="h-screen flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-white">
                <div className="flex items-center gap-4">
                    <Link href="/quotes">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            목록으로
                        </Button>
                    </Link>
                    <h1 className="font-bold text-lg">{quote.quoteNo} 미리보기</h1>
                </div>
                <div>
                    <PDFDownloadLink
                        document={<QuotePDF quote={quote} />}
                        fileName={`${quote.quoteNo}.pdf`}
                    >
                        {/* @ts-ignore: PDFDownloadLink signature mismatch in some versions, children can be function */}
                        {({ loading }) => (
                            <Button disabled={loading}>
                                <Download className="mr-2 h-4 w-4" />
                                {loading ? '준비 중...' : 'PDF 다운로드'}
                            </Button>
                        )}
                    </PDFDownloadLink>
                </div>
            </div>

            <div className="flex-1 bg-gray-100 p-8">
                <PDFViewer width="100%" height="100%" className="rounded-lg shadow-lg">
                    <QuotePDF quote={quote} />
                </PDFViewer>
            </div>
        </div>
    )
}
