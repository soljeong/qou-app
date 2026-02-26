# UML 클래스 다이어그램

> 이 문서는 qou-app의 주요 클래스/타입/컴포넌트 관계를 D2 UML 클래스 다이어그램으로 표현합니다.

---

## 1. 도메인 모델 (Prisma Schema → TypeScript Types)

```d2
direction: down

User: {
  shape: class
  id: "String (UUID, PK)"
  email: "String (unique)"
  name: "String?"
  createdAt: "DateTime"
  updatedAt: "DateTime"
}

Quote: {
  shape: class
  id: "String (UUID, PK)"
  quoteNo: "String (unique)"
  date: "DateTime"
  recipientName: "String"
  recipientContact: "String?"
  supplierInfo: "Json"
  subtotal: "Float"
  discount: "Float (default: 0)"
  supplyPrice: "Float"
  vat: "Float"
  total: "Float"
  notes: "String?"
  createdAt: "DateTime"
  updatedAt: "DateTime"
  items(): "QuoteItem[]"
}

QuoteItem: {
  shape: class
  id: "String (UUID, PK)"
  quoteId: "String (FK)"
  name: "String"
  process: "String"
  qty: "Int"
  unitPrice: "Float? (null = 별도 견적)"
  amount: "Float"
  note: "String?"
  order: "Int"
  quote(): "Quote"
}

Quote -> QuoteItem: "1\n\nitems\n\n*" {
  style.stroke: "#333"
}
```

---

## 2. Zod 유효성 검사 스키마

```d2
direction: down

QuoteItemSchema: {
  shape: class
  style.fill: "#fff9c4"
  name: "z.string().min(1)"
  process: "z.string().optional()"
  qty: "z.number().min(1)"
  unitPrice: "z.number().nullable().optional()"
  amount: "z.number()"
  note: "z.string().optional()"
}

QuoteSchema: {
  shape: class
  style.fill: "#fff9c4"
  recipientName: "z.string().min(1)"
  recipientContact: "z.string().optional()"
  date: "z.date()"
  discount: "z.number()"
  notes: "z.string().optional()"
  items: "z.array(quoteItemSchema).min(1)"
}

QuoteFormValues: {
  shape: class
  style.fill: "#e8f5e9"
  "<<type>>"
  recipientName: "string"
  recipientContact: "string | undefined"
  date: "Date"
  discount: "number"
  notes: "string | undefined"
  items: "QuoteItemValues[]"
}

QuoteSchema -> QuoteItemSchema: "items 포함"
QuoteSchema -> QuoteFormValues: "z.infer<typeof quoteSchema>"
```

---

## 3. Server Actions 레이어

```d2
direction: down

getQuotes: {
  shape: class
  style.fill: "#e3f2fd"
  "<<async function>>"
  return: "Promise<Quote & { items: QuoteItem[] }[]>"
  "prisma.quote.findMany()": "(include items, orderBy createdAt desc)"
}

createQuote: {
  shape: class
  style.fill: "#e3f2fd"
  "<<async function>>"
  param: "data: QuoteFormValues"
  return: "Promise<{ success: boolean; quote?: Quote; error?: string }>"
  "generateQuoteNo()": "ES-YYMM-MMSEQ-YEARSEQ 생성"
  "calcTotals()": "subtotal, supplyPrice, vat, total 계산"
  "prisma.quote.create()": "Quote + QuoteItem 생성"
  "revalidatePath('/quotes')": "Next.js 캐시 무효화"
}

updateQuote: {
  shape: class
  style.fill: "#e3f2fd"
  "<<async function>>"
  param: "id: string, data: QuoteFormValues"
  return: "Promise<{ success: boolean; error?: string }>"
  "prisma.$transaction()": "트랜잭션 실행"
  "tx.quote.update()": "Quote 필드 업데이트"
  "tx.quoteItem.deleteMany()": "기존 아이템 전부 삭제"
  "tx.quoteItem.createMany()": "새 아이템 일괄 생성"
  "revalidatePath('/quotes')": "Next.js 캐시 무효화"
}

PrismaClient: {
  shape: class
  style.fill: "#f3e5f5"
  "<<singleton>>"
  quote: "QuoteDelegate"
  quoteItem: "QuoteItemDelegate"
  user: "UserDelegate"
  "$transaction()": "원자적 트랜잭션"
}

createQuote -> PrismaClient: "사용"
updateQuote -> PrismaClient: "사용"
getQuotes -> PrismaClient: "사용"
```

---

## 4. 컴포넌트 계층 구조 (Pages → Components)

```d2
direction: down

QuoteListPage: {
  shape: class
  style.fill: "#fce4ec"
  "<<Server Component>>"
  "getQuotes()": "Server Action 호출"
  return: "JSX (QuoteListSplitView)"
}

NewQuotePage: {
  shape: class
  style.fill: "#fce4ec"
  "<<Server Component>>"
  return: "JSX (QuoteForm)"
}

EditQuotePage: {
  shape: class
  style.fill: "#fce4ec"
  "<<Server Component>>"
  params: "{ id: string }"
  "prisma.quote.findUnique()": "직접 DB 조회"
  return: "JSX (QuoteForm with initialData)"
}

QuotePDFPage: {
  shape: class
  style.fill: "#fce4ec"
  "<<Server Component>>"
  params: "{ id: string }"
  "prisma.quote.findUnique()": "직접 DB 조회"
  return: "JSX (PDFViewerWrapper)"
}

QuoteListSplitView: {
  shape: class
  style.fill: "#e8eaf6"
  "<<Client Component>>"
  quotes: "(Quote & { items: QuoteItem[] })[]"
  selectedQuote: "Quote | null (state)"
  return: "QuoteTable + QuoteHTMLPreview"
}

QuoteTable: {
  shape: class
  style.fill: "#e8eaf6"
  "<<Client Component>>"
  quotes: "(Quote & { items: QuoteItem[] })[]"
  selectedId: "string | undefined"
  onSelect: "(quote) => void"
  downloadingQuote: "Quote | null (state)"
  isGenerating: "boolean (state)"
  "handleDownloadHtmlPdf()": "HTML→PDF 다운로드"
  return: "Table + 숨김 export 컨테이너"
}

QuoteForm: {
  shape: class
  style.fill: "#e8eaf6"
  "<<Client Component>>"
  initialData: "Quote & { items: QuoteItem[] } | undefined"
  form: "useForm<QuoteFormValues>"
  fields: "useFieldArray (items)"
  previewData: "QuoteFormValues (debounced 500ms)"
  isSubmitting: "boolean (state)"
  "onSubmit()": "createQuote() 또는 updateQuote() 호출"
  "handlePaste()": "엑셀 다중 셀 붙여넣기 처리"
  return: "2-column (Form + QuotePreviewWrapper)"
}

QuotePreviewWrapper: {
  shape: class
  style.fill: "#e8eaf6"
  "<<Client Component (internal)>>"
  data: "QuoteFormValues"
  initialQuoteNo: "string | undefined"
  template: "'classic' | 'modern' | 'compact' (state)"
  isDownloading: "boolean (state)"
  "handleDownloadHtmlPdf()": "exportElementAsPdf() 호출"
  return: "Sticky preview panel"
}

QuoteHTMLPreview: {
  shape: class
  style.fill: "#f3e5f5"
  "<<Component (전통형)>>"
  quote: "Quote & { items: QuoteItem[] }"
  "calculateItemSpans()": "행 병합 계산"
  return: "A4 HTML 견적서 테이블"
}

QuoteHTMLPreviewModern: {
  shape: class
  style.fill: "#f3e5f5"
  "<<Component (현대형)>>"
  quote: "Quote & { items: QuoteItem[] }"
  return: "모던 스타일 A4 견적서"
}

QuoteHTMLPreviewCompact: {
  shape: class
  style.fill: "#f3e5f5"
  "<<Component (실무형)>>"
  quote: "Quote & { items: QuoteItem[] }"
  return: "컴팩트 실무 A4 견적서"
}

PDFViewerWrapper: {
  shape: class
  style.fill: "#e8eaf6"
  "<<Client Component>>"
  quote: "Quote & { items: QuoteItem[] }"
  "usePDF()": "@react-pdf/renderer 훅"
  instance: "PDFInstance (url, loading, error)"
  isClient: "boolean (hydration guard)"
  return: "Embed PDF 뷰어 + 다운로드 버튼"
}

QuotePDF: {
  shape: class
  style.fill: "#f3e5f5"
  "<<@react-pdf/renderer Document>>"
  quote: "Quote & { items: QuoteItem[] }"
  return: "PDF Document (A4)"
}

QuoteListPage -> QuoteListSplitView: "렌더"
QuoteListSplitView -> QuoteTable: "포함"
QuoteListSplitView -> QuoteHTMLPreview: "선택된 견적 미리보기"
QuoteTable -> QuoteHTMLPreview: "숨김 DOM (PDF 캡처용)"

NewQuotePage -> QuoteForm: "렌더"
EditQuotePage -> QuoteForm: "initialData 전달"
QuoteForm -> QuotePreviewWrapper: "debounced 데이터"
QuotePreviewWrapper -> QuoteHTMLPreview: "template='classic'"
QuotePreviewWrapper -> QuoteHTMLPreviewModern: "template='modern'"
QuotePreviewWrapper -> QuoteHTMLPreviewCompact: "template='compact'"

QuotePDFPage -> PDFViewerWrapper: "렌더"
PDFViewerWrapper -> QuotePDF: "usePDF()"
```

---

## 5. 유틸리티 클래스/함수

```d2
direction: right

SpanInfo: {
  shape: class
  style.fill: "#fff9c4"
  "<<interface>>"
  rowSpan: "number"
  isFirst: "boolean"
  isLastInSpan: "boolean"
}

calculateItemSpans: {
  shape: class
  style.fill: "#e8f5e9"
  "<<function>>"
  param: "items: QuoteItem[]"
  return: "SpanInfo[]"
  logic: "같은 name인 연속 행을 병합 처리"
}

exportElementAsPdf: {
  shape: class
  style.fill: "#e8f5e9"
  "<<async function>>"
  elementId: "string (DOM ID)"
  filenamePrefix: "string"
  recipientName: "string"
  return: "Promise<true | void>"
  step1: "html-to-image.toPng() → PNG DataURL"
  step2: "jsPDF A4 인스턴스 생성"
  step3: "addImage() → save()"
}

calculateItemSpans -> SpanInfo: "SpanInfo[] 반환"
QuoteHTMLPreview -> calculateItemSpans: "사용"
QuoteTable -> exportElementAsPdf: "사용"
QuotePreviewWrapper -> exportElementAsPdf: "사용"
```
