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
import { Edit, FileText } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

// Types
import { Quote } from "@prisma/client"

interface QuoteTableProps {
    quotes: any[] // Using any for now to avoid Prisma type mismatch issues after update
    selectedId?: string
    onSelect?: (quote: any) => void
}

export default function QuoteTable({ quotes, selectedId, onSelect }: QuoteTableProps) {
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
                                <TableCell className="text-center space-x-2">
                                    <div className="flex justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                                        <Link href={`/quotes/${quote.id}/edit`}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Link href={`/quotes/${quote.id}/pdf`}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <FileText className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
