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

// Types
import { Quote } from "@prisma/client"

interface QuoteTableProps {
    quotes: Quote[]
}

export default function QuoteTable({ quotes }: QuoteTableProps) {
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
                            <TableRow key={quote.id}>
                                <TableCell>{format(new Date(quote.date), "yyyy-MM-dd")}</TableCell>
                                <TableCell className="font-medium">{quote.quoteNo}</TableCell>
                                <TableCell>{quote.recipientName}</TableCell>
                                <TableCell className="text-right">
                                    {new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(quote.total)}
                                </TableCell>
                                <TableCell className="text-center space-x-2">
                                    <Link href={`/quotes/${quote.id}/edit`}>
                                        <Button variant="ghost" size="icon">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                    <Link href={`/quotes/${quote.id}/pdf`}>
                                        <Button variant="ghost" size="icon">
                                            <FileText className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
