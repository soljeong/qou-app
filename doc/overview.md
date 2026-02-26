# Qou-App 아키텍처 개요

> **Qou**는 소규모 사업자를 위한 **견적서(Quote) 관리 웹 애플리케이션**입니다.
> Next.js 16 (App Router) + PostgreSQL + Prisma ORM 기반으로 구성되어 있으며,
> Docker Compose를 통해 로컬 환경을 손쉽게 구동할 수 있습니다.

---

## 1. 기술 스택

| 레이어 | 기술 |
|-------|------|
| 프레임워크 | Next.js 16 (App Router, React 19) |
| 언어 | TypeScript |
| 스타일링 | Tailwind CSS v4 + shadcn/ui (Radix UI) |
| 폼 관리 | React Hook Form + Zod |
| ORM | Prisma v6 |
| 데이터베이스 | PostgreSQL 15 |
| PDF 생성 | html-to-image + jsPDF (HTML→PDF), @react-pdf/renderer (네이티브 PDF) |
| 컨테이너 | Docker Compose |

---

## 2. 전체 시스템 구성도

```d2
direction: right

browser: 브라우저 (Client) {
  shape: rectangle
  style.fill: "#e8f4fd"
}

nextjs: Next.js 16 App {
  shape: rectangle
  style.fill: "#f0f9ff"

  pages: Pages (App Router) {
    shape: rectangle
    "/" : "홈 (Landing)"
    "/quotes" : "견적서 목록"
    "/quotes/new" : "새 견적서 작성"
    "/quotes/[id]/edit" : "견적서 수정"
    "/quotes/[id]/pdf" : "PDF 뷰어"
  }

  actions: Server Actions {
    shape: rectangle
    getQuotes: "getQuotes()"
    createQuote: "createQuote()"
    updateQuote: "updateQuote()"
  }

  components: Components {
    shape: rectangle
    QuoteForm: "QuoteForm"
    QuoteListSplitView: "QuoteListSplitView"
    QuoteTable: "QuoteTable"
    PDFViewerWrapper: "PDFViewerWrapper"
    Previews: "QuoteHTMLPreview\n(classic / modern / compact)"
  }
}

prisma: Prisma Client {
  shape: rectangle
  style.fill: "#f5f0ff"
}

postgres: PostgreSQL 15 {
  shape: cylinder
  style.fill: "#e8f5e9"
  Quote: "Quote"
  QuoteItem: "QuoteItem"
  User: "User"
}

browser -> nextjs.pages: "HTTP Request"
nextjs.pages -> nextjs.actions: "Server Action 호출"
nextjs.actions -> prisma: "ORM Query"
prisma -> postgres: "SQL"
postgres -> prisma: "결과"
prisma -> nextjs.actions: "데이터"
nextjs.actions -> nextjs.pages: "반환"
nextjs.pages -> browser: "HTML / JSON"
```

---

## 3. 디렉토리 구조

```d2
direction: down

root: qou/ {
  shape: rectangle
  style.fill: "#fafafa"

  compose: docker-compose.yml {shape: document}
  submodule: qou-app/ (서브모듈) {
    shape: rectangle
    style.fill: "#f0f4ff"

    prisma_dir: prisma/ {
      schema: schema.prisma {shape: document}
      migrations: migrations/ {shape: package}
      seed: seed-from-excel.ts {shape: document}
    }

    src_dir: src/ {
      shape: rectangle

      app_dir: app/ {
        layout: layout.tsx {shape: document}
        page: page.tsx (홈) {shape: document}
        quotes_dir: quotes/ {
          list: page.tsx (목록) {shape: document}
          new_dir: "new/page.tsx (작성)" {shape: document}
          edit_dir: "[id]/edit/page.tsx (수정)" {shape: document}
          pdf_dir: "[id]/pdf/page.tsx (PDF 뷰어)" {shape: document}
        }
      }

      actions_dir: actions/ {
        quote: "quote.ts\n(getQuotes, createQuote)" {shape: document}
        quote_update: "quote-update.ts\n(updateQuote)" {shape: document}
      }

      components_dir: components/ {
        quote_comp: quote/ {
          QuoteForm: "QuoteForm.tsx" {shape: document}
          QuoteTable: "QuoteTable.tsx" {shape: document}
          QuoteListSplitView: "QuoteListSplitView.tsx" {shape: document}
          QuoteHTMLPreview: "QuoteHTMLPreview.tsx" {shape: document}
          QuoteHTMLPreviewModern: "QuoteHTMLPreviewModern.tsx" {shape: document}
          QuoteHTMLPreviewCompact: "QuoteHTMLPreviewCompact.tsx" {shape: document}
        }
        pdf_comp: pdf/ {
          PDFViewerWrapper: "PDFViewerWrapper.tsx" {shape: document}
          QuotePDF: "QuotePDF.tsx" {shape: document}
        }
        ui: "ui/ (shadcn 컴포넌트들)" {shape: package}
      }

      lib_dir: lib/ {
        prisma_lib: "prisma.ts (싱글턴)" {shape: document}
        pdf_export: "pdf-export.ts" {shape: document}
        quote_utils: "quote-utils.ts" {shape: document}
        validations: "validations/quote.ts (Zod)" {shape: document}
      }
    }
  }
}
```

---

## 4. 핵심 비즈니스 로직

### 4.1 견적번호 자동 생성

견적번호는 `ES-YYMM-MMSEQ-YEARSEQ` 형식으로 자동 생성됩니다.

```d2
direction: right

input: "견적 날짜\n(예: 2025-06-15)" {shape: oval}

step1: "prefix = ES-2506\n연도2자리 + 월2자리" {shape: rectangle}
step2: "mmSeq\n= 해당 월 마지막 번호 + 1\n(3자리 zero-pad)" {shape: rectangle}
step3: "yearSeq\n= 해당 연도 마지막 번호 + 1\n(4자리 zero-pad)" {shape: rectangle}
output: "ES-2506-001-0001" {
  shape: oval
  style.fill: "#d4edda"
}

input -> step1
step1 -> step2
step2 -> step3
step3 -> output
```

### 4.2 금액 계산 공식

```d2
direction: down

items: "품목들\n(name, qty, unitPrice, amount)" {shape: rectangle}
subtotal: "소계 (subtotal)\n= Σ item.amount" {shape: rectangle}
discount: "특별 할인 (discount)\n= 사용자 입력" {shape: rectangle}
supply: "공급가액 (supplyPrice)\n= subtotal - discount" {shape: rectangle}
vat: "부가세 (VAT)\n= floor(supplyPrice × 0.1)" {shape: rectangle}
total: "최종 합계 (total)\n= supplyPrice + VAT" {
  shape: rectangle
  style.fill: "#d4edda"
  style.font-size: 14
}

items -> subtotal
subtotal -> supply
discount -> supply
supply -> vat
supply -> total
vat -> total
```

---

## 5. PDF 생성 방식 (2가지)

### 방식 1: HTML→PNG→PDF (기본 다운로드)

> `html-to-image` + `jsPDF` 조합.
> 미리보기 DOM 요소를 캡처해서 A4 PDF로 변환.
> CSS 최신 색상(oklch, lab)과의 호환성 문제를 우회하기 위해 채택.

### 방식 2: @react-pdf/renderer (PDF 뷰어 페이지)

> `/quotes/[id]/pdf` 경로에서 사용.
> React 컴포넌트(`QuotePDF`)를 네이티브 PDF 스트림으로 렌더링.
> 브라우저 내 PDF 임베드 뷰어 제공 및 직접 다운로드 지원.

---

## 6. 인프라 구성 (Docker Compose)

```d2
direction: right

host: "호스트 머신" {
  shape: rectangle
  style.fill: "#f8f8f8"

  port3000: ":3000 (웹)" {shape: rectangle}
  port5555: ":5555 (Prisma Studio)" {shape: rectangle}
  port5432: ":5432 (PostgreSQL)" {shape: rectangle}
}

docker: "Docker Compose 네트워크" {
  shape: rectangle
  style.fill: "#e3f2fd"

  app: "app 컨테이너\nnode:20-alpine\nnpm run dev" {
    shape: rectangle
    style.fill: "#bbdefb"
  }

  db: "db 컨테이너\npostgres:15-alpine\nqou_db" {
    shape: cylinder
    style.fill: "#c8e6c9"
  }

  app -> db: "postgresql://\npostgres:password@db:5432/qou_db"
}

host.port3000 -> docker.app: "3000:3000"
host.port5555 -> docker.app: "5555:5555"
host.port5432 -> docker.db: "5432:5432"
```

---

## 7. 미리보기 템플릿 3종

| 템플릿 | 컴포넌트 | 특징 |
|-------|---------|------|
| 전통형 (classic) | `QuoteHTMLPreview` | 공식 견적서 레이아웃, 메모(Footnote) 지원 |
| 현대형 (modern) | `QuoteHTMLPreviewModern` | 깔끔한 현대적 디자인 |
| 실무형 (compact) | `QuoteHTMLPreviewCompact` | 간결한 실무 스타일 |

폼 수정 시 500ms 디바운스 후 실시간 미리보기가 오른쪽 패널에 업데이트됩니다.
