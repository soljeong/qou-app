'use client'

import React, { useEffect, useState } from 'react'
import { Quote, QuoteItem } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { QuotePDF } from './QuotePDF'
import { usePDF } from '@react-pdf/renderer'

interface PDFViewerWrapperProps {
    quote: Quote & { items: QuoteItem[] }
}

export default function PDFViewerWrapper({ quote }: PDFViewerWrapperProps) {
    const [instance] = usePDF({ document: <QuotePDF quote={quote} /> });
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsClient(true);
    }, []);

    if (!isClient) {
        return <div className="h-screen flex items-center justify-center">Loading PDF Support...</div>;
    }

    if (instance.loading) {
        return (
            <div className="h-screen flex items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>PDF 생성 중...</span>
            </div>
        );
    }

    if (instance.error) {
        return (
            <div className="h-screen flex items-center justify-center text-red-500 gap-2">
                <AlertCircle className="h-6 w-6" />
                <span>PDF 생성 오류: {instance.error}</span>
            </div>
        );
    }

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
                <div className="flex gap-2">
                    {instance.url ? (
                        <>
                            <a href={instance.url} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline">
                                    <Download className="mr-2 h-4 w-4" />
                                    새 창에서 열기
                                </Button>
                            </a>
                            <a href={instance.url} download={`${quote.quoteNo}.pdf`}>
                                <Button>
                                    <Download className="mr-2 h-4 w-4" />
                                    PDF 다운로드
                                </Button>
                            </a>
                        </>
                    ) : (
                        <Button disabled>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            준비 중...
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex-1 bg-gray-100 p-8 flex justify-center">
                {instance.url ? (
                    <embed
                        src={instance.url}
                        type="application/pdf"
                        className="w-full h-full rounded-lg shadow-lg"
                        title="PDF Viewer"
                    />
                ) : (
                    <div>PDF URL Generation Failed</div>
                )}
            </div>
        </div>
    )
}
