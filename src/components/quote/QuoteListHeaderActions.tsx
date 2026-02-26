'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Download, Loader2 } from 'lucide-react'
import { uploadAndParseExcel } from '@/actions/excel-upload'
import { cn } from '@/lib/utils'

export default function QuoteListHeaderActions() {
    const router = useRouter()
    const [isUploading, setIsUploading] = useState(false)

    const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const result = await uploadAndParseExcel(formData)

            if (result.success && result.data && result.data.quotes.length > 0) {
                const parsed = result.data.quotes[0]
                const draftData = {
                    ...parsed,
                    htmlPreview: result.data.htmlPreview,
                    excelFilePath: result.data.filePath,
                    extractedImages: result.data.extractedImages ?? []
                }
                sessionStorage.setItem('quoteDraft', JSON.stringify(draftData))
                router.push('/quotes/new')
            } else {
                alert("엑셀 파일 파싱에 실패했습니다: " + (result.error || '알 수 없는 오류'))
            }
        } catch (error) {
            console.error(error)
            alert("엑셀 업로드 중 오류가 발생했습니다.")
        } finally {
            setIsUploading(false)
            e.target.value = '' // Reset input
        }
    }

    return (
        <div className="flex items-center gap-2">
            <div>
                <input
                    type="file"
                    id="excel-upload-list"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleExcelUpload}
                    disabled={isUploading}
                />
                <label
                    htmlFor="excel-upload-list"
                    className={cn(
                        "cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                        "bg-emerald-500 text-primary-foreground shadow hover:bg-emerald-600/90 h-9 px-4 py-2",
                        isUploading && "opacity-50 cursor-not-allowed"
                    )}
                >
                    {isUploading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 업로드 중...</>
                    ) : (
                        <><Download className="mr-2 h-4 w-4" /> 엑셀 업로드</>
                    )}
                </label>
            </div>
            <Link href="/quotes/new">
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> 새 견적서 작성
                </Button>
            </Link>
        </div>
    )
}
