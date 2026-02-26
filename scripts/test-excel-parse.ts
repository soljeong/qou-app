import * as xlsx from 'xlsx'
import fs from 'fs/promises'
import path from 'path'

const FILE_PATH = path.join(process.cwd(), 'public', 'uploads', 'quotes', '9be03060-23a1-4664-a5e9-33d0e6311b18.xls')

async function main() {
  const buffer = await fs.readFile(FILE_PATH)
  const workbook = xlsx.read(buffer, { type: 'buffer' })

  console.log('시트 목록:', workbook.SheetNames)

  let quoteSheet: any[] = []
  let itemSheet: any[] = []
  let processSheet: any[] = []

  if (workbook.Sheets['견적서']) {
    quoteSheet = xlsx.utils.sheet_to_json<any>(workbook.Sheets['견적서'])
    console.log('\n=== 견적서 ===')
    console.log(JSON.stringify(quoteSheet, null, 2))
  }
  if (workbook.Sheets['견적품목']) {
    itemSheet = xlsx.utils.sheet_to_json<any>(workbook.Sheets['견적품목'])
    console.log('\n=== 견적품목 ===')
    console.log(JSON.stringify(itemSheet, null, 2))
  }
  if (workbook.Sheets['견적공정']) {
    processSheet = xlsx.utils.sheet_to_json<any>(workbook.Sheets['견적공정'])
    console.log('\n=== 견적공정 ===')
    console.log(JSON.stringify(processSheet, null, 2))
  }

  // 그룹핑 로직
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

  console.log('\n=== 파싱 결과 ===')
  console.log(JSON.stringify(parsedQuotes, null, 2))
}

main().catch(console.error)
