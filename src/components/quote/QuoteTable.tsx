'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Edit, FileText, Download, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { QuoteHTMLPreview } from "./QuoteHTMLPreview"

// Types
import { Quote, QuoteItem } from "@prisma/client"

interface QuoteTableProps {
    quotes: (Quote & { items: QuoteItem[] })[]
    selectedId?: string
    onSelect?: (quote: any) => void
}

export default function QuoteTable({ quotes, selectedId, onSelect }: QuoteTableProps) {
    const [downloadingQuote, setDownloadingQuote] = useState<(Quote & { items: QuoteItem[] }) | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownloadHtmlPdf = async (e: React.MouseEvent, quote: Quote & { items: QuoteItem[] }) => {
        e.stopPropagation();
        setDownloadingQuote(quote);
        setIsGenerating(true);
    };

    useEffect(() => {
        const generatePdf = async () => {
            if (downloadingQuote && isGenerating) {
                try {
                    // Small delay to ensure the hidden element is rendered in the DOM
                    await new Promise(resolve => setTimeout(resolve, 500));

                    const { exportElementAsPdf } = await import('@/lib/pdf-export');
                    await exportElementAsPdf(
                        `hidden-preview-${downloadingQuote.id}`,
                        downloadingQuote.quoteNo,
                        downloadingQuote.recipientName
                    );
                } catch (error) {
                    console.error('Download failed:', error);
                    alert('PDF 다운로드 중 오류가 발생했습니다.');
                } finally {
                    setDownloadingQuote(null);
                    setIsGenerating(false);
                }
            }
        };

        generatePdf();
    }, [downloadingQuote, isGenerating]);

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>견적일</TableHead>
                        <TableHead>견적번호</TableHead>
                        <TableHead>수신처 (업체명)</TableHead>
                        <TableHead className="text-right">합계금액</TableHead>
                        <TableHead className="text-center">관리</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {quotes.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                등록된 견적서가 없습니다.
                            </TableCell>
                        </TableRow>
                    ) : (
                        quotes.map((quote) => (
                            <TableRow
                                key={quote.id}
                                className={cn(
                                    "cursor-pointer hover:bg-muted/50 transition-colors",
                                    selectedId === quote.id && "bg-muted"
                                )}
                                onClick={() => onSelect?.(quote)}
                            >
                                <TableCell>{format(new Date(quote.date), "yyyy-MM-dd")}</TableCell>
                                <TableCell className="font-medium">{quote.quoteNo}</TableCell>
                                <TableCell>{quote.recipientName}</TableCell>
                                <TableCell className="text-right">
                                    {new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(quote.total)}
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                                        <Link href={`/quotes/${quote.id}/edit`}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-600">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Link href={`/quotes/${quote.id}/pdf`}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-orange-600">
                                                <FileText className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 hover:text-green-600"
                                            onClick={(e) => handleDownloadHtmlPdf(e, quote as any)}
                                            disabled={isGenerating && downloadingQuote?.id === quote.id}
                                        >
                                            {isGenerating && downloadingQuote?.id === quote.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Download className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            {/* Hidden export container */}
            <div className="fixed -left-[4000px] top-0 pointer-events-none">
                {downloadingQuote && (
                    <div id={`hidden-preview-${downloadingQuote.id}`}>
                        <QuoteHTMLPreview quote={downloadingQuote as any} />
                    </div>
                )}
            </div>
        </div>
    )
}
