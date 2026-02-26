# 시퀀스 다이어그램

> 주요 유저 시나리오별 컴포넌트 간 상호작용을 D2 시퀀스 다이어그램으로 표현합니다.

---

## 1. 견적서 목록 조회

사용자가 `/quotes` 페이지에 접속했을 때의 흐름입니다.

```d2
shape: sequence_diagram

Browser: "브라우저"
QuoteListPage: "QuoteListPage\n(Server Component)"
getQuotes: "getQuotes()\n(Server Action)"
Prisma: "Prisma Client"
PostgreSQL: "PostgreSQL"
QuoteListSplitView: "QuoteListSplitView\n(Client Component)"
QuoteTable: "QuoteTable"
QuoteHTMLPreview: "QuoteHTMLPreview"

Browser -> QuoteListPage: "GET /quotes"
QuoteListPage -> getQuotes: "getQuotes() 호출"
getQuotes -> Prisma: "prisma.quote.findMany()\n{ include: items, orderBy: createdAt desc }"
Prisma -> PostgreSQL: "SELECT * FROM Quote\nJOIN QuoteItem ORDER BY createdAt DESC"
PostgreSQL -> Prisma: "quotes[] 반환"
Prisma -> getQuotes: "Quote & { items: QuoteItem[] }[]"
getQuotes -> QuoteListPage: "quotes 배열"
QuoteListPage -> QuoteListSplitView: "<QuoteListSplitView quotes={quotes} />"
QuoteListSplitView -> QuoteTable: "quotes 전달, selectedId"
QuoteListSplitView -> QuoteHTMLPreview: "selectedQuote (첫 번째) 미리보기"
QuoteListSplitView -> Browser: "렌더링된 HTML"
Browser -> QuoteListSplitView: "사용자가 다른 행 클릭"
QuoteListSplitView -> QuoteHTMLPreview: "setSelectedQuote(클릭된 quote)"
QuoteHTMLPreview -> Browser: "미리보기 업데이트"
```

---

## 2. 새 견적서 작성 및 저장

`/quotes/new`에서 폼을 작성하고 저장하는 전체 흐름입니다.

```d2
shape: sequence_diagram

Browser: "브라우저"
NewQuotePage: "NewQuotePage\n(Server Component)"
QuoteForm: "QuoteForm\n(Client Component)"
QuotePreviewWrapper: "QuotePreviewWrapper\n(내부 컴포넌트)"
ReactHookForm: "React Hook Form\n+ Zod"
createQuote: "createQuote()\n(Server Action)"
Prisma: "Prisma Client"
PostgreSQL: "PostgreSQL"
NextCache: "Next.js Cache"

Browser -> NewQuotePage: "GET /quotes/new"
NewQuotePage -> QuoteForm: "<QuoteForm /> 렌더"
QuoteForm -> Browser: "폼 UI 표시 (초기값: 빈 폼)"

Browser -> QuoteForm: "사용자 입력 (수신처, 날짜, 품목 등)"
QuoteForm -> ReactHookForm: "useWatch() → 500ms debounce"
ReactHookForm -> QuotePreviewWrapper: "previewData 업데이트"
QuotePreviewWrapper -> Browser: "실시간 HTML 미리보기 갱신"

Browser -> QuoteForm: "저장 버튼 클릭"
QuoteForm -> ReactHookForm: "form.handleSubmit(onSubmit)"
ReactHookForm -> ReactHookForm: "Zod schema 유효성 검사"
ReactHookForm -> QuoteForm: "onSubmit(data: QuoteFormValues) 호출"
QuoteForm -> createQuote: "createQuote(data) 호출"

createQuote -> Prisma: "prisma.quote.findFirst()\n(prefix=ES-YYMM → mmSeq 계산)"
Prisma -> PostgreSQL: "SELECT quoteNo WHERE startsWith(ES-YYMM)"
PostgreSQL -> Prisma: "lastQuoteMonth"
Prisma -> createQuote: "mmSeq 계산용 데이터"

createQuote -> Prisma: "prisma.quote.findFirst()\n(yearPrefix=ES-YY → yearSeq 계산)"
Prisma -> PostgreSQL: "SELECT quoteNo WHERE startsWith(ES-YY)"
PostgreSQL -> Prisma: "lastQuoteYear"
Prisma -> createQuote: "yearSeq 계산용 데이터"

createQuote -> createQuote: "quoteNo = ES-YYMM-{mmSeq}-{yearSeq}\nsubtotal / discount / supplyPrice / vat / total 계산"

createQuote -> Prisma: "prisma.quote.create()\n{ data: { ...quote, items: { create: [...] } } }"
Prisma -> PostgreSQL: "INSERT INTO Quote\nINSERT INTO QuoteItem (multiple)"
PostgreSQL -> Prisma: "생성된 Quote"
Prisma -> createQuote: "{ success: true, quote }"
createQuote -> NextCache: "revalidatePath('/quotes')"
createQuote -> QuoteForm: "{ success: true }"
QuoteForm -> Browser: "router.push('/quotes') → 목록으로 이동"
```

---

## 3. 견적서 수정 (트랜잭션)

`/quotes/[id]/edit`에서 기존 견적서를 수정하는 흐름입니다.
업데이트 시 품목 전체 삭제 후 재삽입 방식(Replace 패턴)을 사용합니다.

```d2
shape: sequence_diagram

Browser: "브라우저"
EditQuotePage: "EditQuotePage\n(Server Component)"
Prisma_server: "Prisma Client\n(서버)"
PostgreSQL: "PostgreSQL"
QuoteForm: "QuoteForm\n(Client Component, initialData 있음)"
updateQuote: "updateQuote()\n(Server Action)"
Prisma_action: "Prisma Client\n(Server Action)"
NextCache: "Next.js Cache"

Browser -> EditQuotePage: "GET /quotes/{id}/edit"
EditQuotePage -> Prisma_server: "prisma.quote.findUnique({ id })\n{ include: items }"
Prisma_server -> PostgreSQL: "SELECT Quote + QuoteItem WHERE id={id}"
PostgreSQL -> Prisma_server: "Quote & { items: QuoteItem[] }"
Prisma_server -> EditQuotePage: "quote (또는 notFound())"
EditQuotePage -> QuoteForm: "<QuoteForm initialData={quote} />"
QuoteForm -> Browser: "폼 UI (기존 데이터 채워진 상태)"

Browser -> QuoteForm: "사용자 수정 작업"
Browser -> QuoteForm: "저장 버튼 클릭"
QuoteForm -> updateQuote: "updateQuote(id, data) 호출"

updateQuote -> updateQuote: "합계 재계산\n(subtotal→supplyPrice→vat→total)"

updateQuote -> Prisma_action: "prisma.$transaction(async tx => { ... })"

Prisma_action -> PostgreSQL: "[TX START]"

Prisma_action -> PostgreSQL: "UPDATE Quote SET ...\nWHERE id={id}"
PostgreSQL -> Prisma_action: "Updated Quote"

Prisma_action -> PostgreSQL: "DELETE FROM QuoteItem\nWHERE quoteId={id}"
PostgreSQL -> Prisma_action: "Deleted count"

Prisma_action -> PostgreSQL: "INSERT INTO QuoteItem (batch)\n새 품목 전체 삽입"
PostgreSQL -> Prisma_action: "Inserted count"

PostgreSQL -> Prisma_action: "[TX COMMIT]"
Prisma_action -> updateQuote: "트랜잭션 완료"
updateQuote -> NextCache: "revalidatePath('/quotes')"
updateQuote -> QuoteForm: "{ success: true }"
QuoteForm -> Browser: "router.push('/quotes')"
```

---

## 4. HTML → PDF 다운로드 (html-to-image 방식)

목록 화면 또는 폼 화면의 다운로드 버튼 클릭 시 흐름입니다.

```d2
shape: sequence_diagram

Browser: "브라우저"
QuoteTable: "QuoteTable\n(Client Component)"
HiddenDOM: "숨겨진 DOM\n(QuoteHTMLPreview)"
pdfExport: "pdf-export.ts\nexportElementAsPdf()"
htmlToImage: "html-to-image\ntoPng()"
jsPDF: "jsPDF"

Browser -> QuoteTable: "다운로드 버튼 클릭"
QuoteTable -> QuoteTable: "setDownloadingQuote(quote)\nsetIsGenerating(true)"
QuoteTable -> HiddenDOM: "id={hidden-preview-{id}} 엘리먼트 렌더\n(화면 밖 -4000px 위치)"
QuoteTable -> QuoteTable: "useEffect 트리거\n(500ms 대기 후 실행)"
QuoteTable -> pdfExport: "exportElementAsPdf(elementId, prefix, recipientName)"
pdfExport -> HiddenDOM: "document.getElementById(elementId)"
pdfExport -> htmlToImage: "toPng(element, { quality:1.0, pixelRatio:2 })"
htmlToImage -> Browser: "DOM → PNG DataURL (고해상도)"
Browser -> pdfExport: "dataUrl 반환"
pdfExport -> jsPDF: "new jsPDF('p', 'mm', 'a4')"
pdfExport -> jsPDF: "addImage(dataUrl, 'PNG', 0, 0, width, height)"
pdfExport -> jsPDF: "pdf.save('견적서_업체명_YYYYMMDD.pdf')"
jsPDF -> Browser: "파일 다운로드 트리거"
Browser -> QuoteTable: "다운로드 완료"
QuoteTable -> QuoteTable: "setDownloadingQuote(null)\nsetIsGenerating(false)"
```

---

## 5. @react-pdf 방식 PDF 뷰어 페이지

`/quotes/[id]/pdf` 페이지에서의 PDF 생성 및 표시 흐름입니다.

```d2
shape: sequence_diagram

Browser: "브라우저"
QuotePDFPage: "QuotePDFPage\n(Server Component)"
Prisma: "Prisma Client"
PostgreSQL: "PostgreSQL"
PDFViewerWrapper: "PDFViewerWrapper\n(Client Component)"
ReactPDF: "@react-pdf/renderer\nusePDF()"
QuotePDF: "QuotePDF\n(Document Component)"

Browser -> QuotePDFPage: "GET /quotes/{id}/pdf"
QuotePDFPage -> Prisma: "prisma.quote.findUnique({ id })\n{ include: items }"
Prisma -> PostgreSQL: "SELECT Quote + QuoteItem"
PostgreSQL -> Prisma: "quote 데이터"
Prisma -> QuotePDFPage: "Quote & { items: QuoteItem[] }"
QuotePDFPage -> PDFViewerWrapper: "<PDFViewerWrapper quote={quote} />"

PDFViewerWrapper -> PDFViewerWrapper: "isClient=false (SSR guard)\n→ 'Loading PDF Support...' 표시"
PDFViewerWrapper -> PDFViewerWrapper: "useEffect → setIsClient(true)"

PDFViewerWrapper -> ReactPDF: "usePDF({ document: <QuotePDF quote={quote} /> })"
ReactPDF -> QuotePDF: "QuotePDF 컴포넌트 렌더링"
QuotePDF -> ReactPDF: "PDF Document (A4 스타일 견적서)"
ReactPDF -> ReactPDF: "PDF 바이너리 스트림 생성"
ReactPDF -> PDFViewerWrapper: "instance { url, loading, error }"

PDFViewerWrapper -> Browser: "instance.loading=true → Loader 표시"
ReactPDF -> PDFViewerWrapper: "instance.loading=false, instance.url='blob:...'"
PDFViewerWrapper -> Browser: "<embed src={url} type='application/pdf' />\n다운로드 버튼 활성화"

Browser -> PDFViewerWrapper: "다운로드 버튼 클릭"
PDFViewerWrapper -> Browser: "<a href={url} download='{quoteNo}.pdf'>\n파일 다운로드"
```

---

## 6. 엑셀 붙여넣기 (다중 셀 Paste)

QuoteForm의 품목 입력 칸에서 엑셀 데이터를 붙여넣는 흐름입니다.

```d2
shape: sequence_diagram

User: "사용자"
ExcelApp: "Excel / 스프레드시트"
Browser: "브라우저"
QuoteForm: "QuoteForm\n(Clipboard Handler)"
ReactHookForm: "React Hook Form"
Preview: "QuotePreviewWrapper"

User -> ExcelApp: "셀 범위 복사 (Ctrl+C)"
User -> Browser: "품명 Input에 포커스"
User -> Browser: "붙여넣기 (Ctrl+V)"

Browser -> QuoteForm: "onPaste 이벤트 발생 (시작 필드: 'name')"
QuoteForm -> QuoteForm: "e.clipboardData.getData('text') 읽기"
QuoteForm -> QuoteForm: "\\t, \\n 포함 확인 → 다중 셀 모드"
QuoteForm -> QuoteForm: "e.preventDefault() (기본 붙여넣기 차단)"
QuoteForm -> QuoteForm: "pasteData.split('\\n') → rows 배열\nrow.split('\\t') → cells 배열"

QuoteForm -> ReactHookForm: "rows[0]: form.setValue('items.0.name', cells[0])"
QuoteForm -> ReactHookForm: "rows[0]: form.setValue('items.0.process', cells[1])"
QuoteForm -> ReactHookForm: "rows[0]: form.setValue('items.0.qty', parseInt(cells[2]))"
QuoteForm -> ReactHookForm: "rows[0]: form.setValue('items.0.unitPrice', parseFloat(cells[3]))"
QuoteForm -> ReactHookForm: "rows[0]: qty × unitPrice → form.setValue('items.0.amount', ...)"

QuoteForm -> ReactHookForm: "rows[1] 처리 → 다음 행이 없으면 append() 호출"
ReactHookForm -> QuoteForm: "새 필드 추가됨"
QuoteForm -> ReactHookForm: "form.setValue('items.1.name', cells[0]) ..."

ReactHookForm -> QuoteForm: "watch() 변경 감지"
QuoteForm -> Preview: "500ms debounce 후 previewData 업데이트"
Preview -> Browser: "미리보기 실시간 갱신"
```
