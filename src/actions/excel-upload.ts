'use server'

import * as xlsx from 'xlsx'
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

// PNG 바이너리 시그니처로 이미지 추출
function extractPNGs(buffer: Buffer): Buffer[] {
  const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const IEND   = Buffer.from([0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82])
  const images: Buffer[] = []
  let pos = 0
  while (pos < buffer.length) {
    const start = buffer.indexOf(PNG_SIG, pos)
    if (start === -1) break
    const end = buffer.indexOf(IEND, start)
    if (end === -1) break
    images.push(buffer.subarray(start, end + IEND.length))
    pos = end + IEND.length
  }
  return images
}

// LLM 응답에서 JSON 추출 (코드블록 감싸기 대응)
function extractJSON(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  return match ? match[1].trim() : text.trim()
}

export async function uploadAndParseExcel(formData: FormData) {
  try {
    const file = formData.get('file') as File
    if (!file) {
      return { success: false, error: 'No file found' }
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // 엑셀 파일 저장
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'quotes')
    await fs.mkdir(uploadsDir, { recursive: true })
    const fileExt = path.extname(file.name) || '.xlsx'
    const fileName = `${uuidv4()}${fileExt}`
    const filePath = path.join(uploadsDir, fileName)
    await fs.writeFile(filePath, buffer)

    // 워크북 파싱
    const workbook = xlsx.read(buffer, { type: 'buffer' })

    // HTML 미리보기 생성 (비어있지 않은 시트만)
    let htmlPreview = ''
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName]
      const sheetHtml = xlsx.utils.sheet_to_html(sheet)
      if (sheetHtml && sheetHtml.includes('<td')) {
        htmlPreview += `<h3>${sheetName}</h3>${sheetHtml}<hr/>`
      }
    }

    // 시트 CSV 변환 (LLM 입력용)
    const sheetsText = workbook.SheetNames.map(name => {
      const csv = xlsx.utils.sheet_to_csv(workbook.Sheets[name], { blankrows: false })
      return `=== 시트: ${name} ===\n${csv}`
    }).join('\n\n')

    // Claude API 호출로 구조화된 데이터 추출
    const prompt = `다음은 견적서 엑셀 파일에서 추출한 시트 내용입니다.
이 데이터를 분석하여 아래 JSON 형식으로 추출해주세요.
비어 있거나 관련 없는 시트는 무시하세요.

${sheetsText}

반환 형식 (JSON만 반환, 마크다운 코드블록 없이):
{
  "quotes": [
    {
      "quoteNo": "견적번호 (예: ES-2601-031-0031)",
      "date": "YYYY-MM-DD 형식",
      "recipientName": "고객사명",
      "recipientContact": "담당자명",
      "notes": "비고/메모",
      "discount": 0,
      "supplierInfo": {
        "name": "공급사 상호",
        "representative": "대표자명",
        "businessNo": "사업자등록번호",
        "contact": "연락처",
        "address": "주소"
      },
      "items": [
        {
          "name": "품명",
          "process": "공정 또는 규격 (없으면 빈 문자열)",
          "qty": 수량(숫자, 없으면 null),
          "unitPrice": 단가(숫자, PP/별도/미기재이면 null),
          "amount": 금액(숫자, 없으면 null),
          "note": "비고 (없으면 빈 문자열)"
        }
      ]
    }
  ]
}`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonText = extractJSON(rawText)
    const parsed = JSON.parse(jsonText)

    const parsedQuotes = (parsed.quotes ?? []).map((q: any) => ({
      quoteNo: q.quoteNo ?? '',
      date: q.date ? new Date(q.date) : new Date(),
      recipientName: q.recipientName ?? '',
      recipientContact: q.recipientContact ?? '',
      notes: q.notes ?? '',
      discount: typeof q.discount === 'number' ? q.discount : 0,
      supplierInfo: q.supplierInfo ?? null,
      items: (q.items ?? []).map((item: any) => ({
        name: item.name ?? '',
        process: item.process ?? '',
        qty: item.qty ?? null,
        unitPrice: item.unitPrice ?? null,
        amount: item.amount ?? null,
        note: item.note ?? ''
      }))
    }))

    // PNG 이미지 추출 및 저장
    const imagesDir = path.join(process.cwd(), 'public', 'uploads', 'images')
    await fs.mkdir(imagesDir, { recursive: true })

    const pngBuffers = extractPNGs(buffer)
    const extractedImages: { filePath: string; index: number }[] = []

    for (let i = 0; i < pngBuffers.length; i++) {
      const imgName = `${uuidv4()}.png`
      const imgPath = path.join(imagesDir, imgName)
      await fs.writeFile(imgPath, pngBuffers[i])
      extractedImages.push({ filePath: `/uploads/images/${imgName}`, index: i })
    }

    return {
      success: true,
      data: {
        quotes: parsedQuotes,
        htmlPreview,
        filePath: `/uploads/quotes/${fileName}`,
        originalFileName: file.name,
        extractedImages
      }
    }
  } catch (error) {
    console.error('Error parsing excel:', error)
    return { success: false, error: 'Failed to parse Excel file' }
  }
}
