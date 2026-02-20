# CLAUDE.md

견적서(Quotation) 관리 웹 애플리케이션. 견적서 CRUD 및 PDF 출력 기능을 제공한다.

## 기술 스택

- Next.js 16 (App Router, React 19, RSC)
- TypeScript strict 모드
- Tailwind CSS v4 + shadcn/ui (new-york 스타일, lucide-react 아이콘)
- PostgreSQL (Neon) + Prisma ORM v6
- NextAuth v5 (Auth.js) - Google OAuth, JWT 세션
- react-hook-form + zod 유효성 검증
- PDF: @react-pdf/renderer, jspdf, html-to-image
- Docker (node:20-alpine), standalone 빌드

## 프로젝트 구조

```
src/
├── app/                       # App Router 페이지
│   ├── page.tsx               # 메인 (/ → /quotes 리다이렉트)
│   ├── login/page.tsx         # 로그인
│   ├── quotes/page.tsx        # 견적서 목록 (SplitView)
│   ├── quotes/new/page.tsx    # 견적서 생성
│   ├── quotes/[id]/edit/page.tsx  # 견적서 수정
│   ├── quotes/[id]/pdf/page.tsx   # PDF 미리보기
│   └── api/auth/              # NextAuth API 라우트
├── actions/                   # Server Actions ('use server')
│   ├── quote.ts               # getQuotes, createQuote, deleteQuote
│   └── quote-update.ts        # updateQuote
├── components/
│   ├── layout/                # Header, Footer
│   ├── quote/                 # QuoteForm, QuoteTable, QuoteListSplitView, QuoteHTMLPreview*
│   ├── pdf/                   # QuotePDF (react-pdf), PDFViewerWrapper
│   └── ui/                    # shadcn/ui 컴포넌트
├── lib/
│   ├── prisma.ts              # Prisma 클라이언트 싱글턴
│   ├── utils.ts               # cn() 유틸리티
│   ├── quote-utils.ts         # calculateItemSpans (행 병합 로직)
│   ├── pdf-export.ts          # exportElementAsPdf (html-to-image → jspdf)
│   └── validations/quote.ts   # Zod 스키마 (quoteSchema, quoteItemSchema)
├── auth.ts                    # NextAuth 설정 (Google OAuth)
└── middleware.ts              # /quotes/:path* 인증 보호
prisma/
├── schema.prisma              # DB 스키마 (User, Quote, QuoteItem)
├── seed.ts                    # 더미 시드
├── seed-from-excel.ts         # 엑셀 데이터 시딩
└── migrations/                # 마이그레이션 파일
```

## 명령어

```bash
npm run dev              # 개발 서버
npm run build            # 프로덕션 빌드
npm run lint             # ESLint
npx prisma generate      # Prisma 클라이언트 생성
npx prisma migrate dev   # 마이그레이션 생성 및 적용
npx prisma migrate deploy # 운영 DB 마이그레이션 적용
npx prisma studio        # DB GUI
npm run seed:excel       # 엑셀 데이터 시딩
```

## 코드 컨벤션

- 경로 별칭: `@/*` → `./src/*`
- Server Actions: `src/actions/`에 `'use server'` 선언, 인증은 `assertAuthenticated()` 호출
- 견적번호: `ES-YYMM-MMSEQ-YEARSEQ` (예: `ES-2602-001-0001`). 월별 순번(3자리) + 연간 순번(4자리)
- 금액 계산: 공급가 = 소계 - 할인, VAT = `Math.floor(공급가 * 0.1)`, 합계 = 공급가 + VAT
- UI 검증 메시지: 한국어 (예: "품명을 입력해주세요")
- 데이터 변경 후 `revalidatePath('/quotes')` 호출
- `redirect()`는 try-catch 밖에서 호출 (Next.js 규칙)
- unitPrice가 null이면 "별도견적(PP)" 표시, 0이면 무상

## DB 스키마

- **User**: id, email, name
- **Quote**: id, quoteNo(unique), date, recipientName, recipientContact?, supplierInfo(JSON), subtotal, discount, supplyPrice, vat, total, notes?, items[]
- **QuoteItem**: id, quoteId(FK, cascade delete), name, process, qty, unitPrice?(nullable), amount, note?, order

## 환경 변수

```
DATABASE_URL           # Neon PostgreSQL pooled URL
DIRECT_DATABASE_URL    # Neon 직접 연결 URL (마이그레이션용)
AUTH_GOOGLE_ID         # Google OAuth 클라이언트 ID
AUTH_GOOGLE_SECRET     # Google OAuth 클라이언트 시크릿
AUTH_SECRET            # NextAuth 시크릿
```

## 주의사항

- `next.config.ts`에 `output: "standalone"` (Docker 배포용)
- Prisma binaryTargets에 `linux-musl-openssl-3.0.x` 포함 (Alpine Linux용)
- Prisma DB 변경은 `db push` 대신 `migrate dev` / `migrate deploy` 사용 (마이그레이션 기반 운영)
- Neon DB는 pooled URL(앱 런타임)과 direct URL(마이그레이션)을 분리 사용
