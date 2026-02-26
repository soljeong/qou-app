'use server'

import * as xlsx from 'xlsx'
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function uploadAndParseExcel(formData: FormData) {
  try {
    const file = formData.get('file') as File
    if (!file) {
      return { success: false, error: 'No file found' }
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Save file to public/uploads
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'quotes')
    await fs.mkdir(uploadsDir, { recursive: true })

    const fileExt = path.extname(file.name) || '.xlsx'
    const fileName = `${uuidv4()}${fileExt}`
    const filePath = path.join(uploadsDir, fileName)

    await fs.writeFile(filePath, buffer)

    // Parse with xlsx
    const workbook = xlsx.read(buffer, { type: 'buffer' })

    let quoteSheet = []
    let itemSheet = []
    let processSheet = []
    let htmlPreview = ''

    if (workbook.Sheets['견적서']) {
      quoteSheet = xlsx.utils.sheet_to_json<any>(workbook.Sheets['견적서'])
      htmlPreview += `<h3>견적서</h3>${xlsx.utils.sheet_to_html(workbook.Sheets['견적서'])}`
    }
    if (workbook.Sheets['견적품목']) {
      itemSheet = xlsx.utils.sheet_to_json<any>(workbook.Sheets['견적품목'])
      htmlPreview += `<hr/><h3>견적품목</h3>${xlsx.utils.sheet_to_html(workbook.Sheets['견적품목'])}`
    }
    if (workbook.Sheets['견적공정']) {
      processSheet = xlsx.utils.sheet_to_json<any>(workbook.Sheets['견적공정'])
      htmlPreview += `<hr/><h3>견적공정</h3>${xlsx.utils.sheet_to_html(workbook.Sheets['견적공정'])}`
    }

    // Apply seed-from-excel grouping logic
    const processesByItemId: Record<string, any[]> = {}
    processSheet.forEach(p => {
      const itemId = p['품목ID']
      if (!processesByItemId[itemId]) processesByItemId[itemId] = []
      processesByItemId[itemId].push(p)
    })

    const itemsByQuoteNo: Record<string, any[]> = {}
    itemSheet.forEach(item => {
      const quoteNo = item['견적번호']
      const itemId = item['품목ID']
      const itemName = item['품명']

      const processes = processesByItemId[itemId] || []
      if (!itemsByQuoteNo[quoteNo]) itemsByQuoteNo[quoteNo] = []

      if (processes.length > 0) {
        processes.forEach(p => {
          itemsByQuoteNo[quoteNo].push({
            itemName,
            process: p['공정'],
            qty: typeof p['수량'] === 'number' ? p['수량'] : 0,
            unitPrice: typeof p['단가'] === 'number' ? p['단가'] : null,
            amount: typeof p['금액'] === 'number' ? p['금액'] : 0,
            note: p['비고']
          })
        })
      } else {
        itemsByQuoteNo[quoteNo].push({
          itemName,
          process: '',
          qty: typeof item['수량'] === 'number' ? item['수량'] : 0,
          unitPrice: typeof item['단가'] === 'number' ? item['단가'] : null,
          amount: typeof item['금액'] === 'number' ? item['금액'] : 0,
          note: item['비고'] || ''
        })
      }
    })

    // Format dates correctly from Excel serial number
    function excelDateToJSDate(serial: number) {
      const utc_days = Math.floor(serial - 25569)
      const utc_value = utc_days * 86400
      const date_info = new Date(utc_value * 1000)
      return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate())
    }

    const parsedQuotes = quoteSheet.map(q => {
      const quoteNo = q['견적번호']
      const items = itemsByQuoteNo[quoteNo] || []

      return {
        quoteNo,
        date: typeof q['등록일'] === 'number' ? excelDateToJSDate(q['등록일']) : new Date(),
        recipientName: q['고객사'] || '',
        recipientContact: q['고객사담당자'] || '',
        notes: q['메모'] || '',
        discount: typeof q['할인'] === 'number' ? q['할인'] : 0,
        // Add items formatted for QuoteForm
        items: items.map(item => ({
          name: item.itemName || '',
          process: item.process || '',
          qty: item.qty ?? null,
          unitPrice: item.unitPrice ?? null,
          amount: item.amount ?? null,
          note: item.note || ''
        }))
      }
    })

    return {
      success: true,
      data: {
        quotes: parsedQuotes,
        htmlPreview,
        filePath: `/uploads/quotes/${fileName}`,
        originalFileName: file.name
      }
    }
  } catch (error) {
    console.error('Error parsing excel:', error)
    return { success: false, error: 'Failed to parse Excel file' }
  }
}
