# CLAUDE.md - qou-app

## 프로젝트 개요

견적서(Quotation) 관리 웹 애플리케이션. 견적서 생성, 조회, 수정, PDF 출력 기능을 제공한다.

## 기술 스택

- **프레임워크**: Next.js 16 (App Router, React 19, RSC 사용)
- **언어**: TypeScript (strict 모드)
- **스타일링**: Tailwind CSS v4 + CSS Variables
- **UI 컴포넌트**: shadcn/ui (new-york 스타일, lucide-react 아이콘)
- **DB**: PostgreSQL (Neon) + Prisma ORM v6
- **인증**: NextAuth v5 (Auth.js) - Google OAuth, JWT 세션
- **폼 처리**: react-hook-form + zod 유효성 검증
- **PDF**: @react-pdf/renderer, jspdf, html-to-image
- **배포**: Docker (node:20-alpine) → standalone 빌드

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── page.tsx            # 메인 페이지
│   ├── login/page.tsx      # 로그인 페이지
│   ├── quotes/             # 견적서 관련 페이지
│   │   ├── page.tsx        # 견적서 목록
│   │   ├── new/page.tsx    # 견적서 생성
│   │   └── [id]/
│   │       ├── edit/page.tsx  # 견적서 수정
│   │       └── pdf/page.tsx   # PDF 미리보기
│   └── api/auth/           # NextAuth API 라우트
├── actions/                # Server Actions
│   ├── quote.ts            # 견적서 CRUD (getQuotes, createQuote, deleteQuote)
│   └── quote-update.ts     # 견적서 수정
├── components/
│   ├── layout/             # Header, Footer
│   ├── quote/              # 견적서 관련 컴포넌트 (QuoteForm, QuoteTable 등)
│   ├── pdf/                # PDF 관련 컴포넌트
│   └── ui/                 # shadcn/ui 컴포넌트
├── lib/
│   ├── prisma.ts           # Prisma 클라이언트 싱글턴
│   ├── utils.ts            # cn() 유틸리티
│   ├── quote-utils.ts      # 견적서 유틸리티
│   ├── pdf-export.ts       # PDF 내보내기
│   └── validations/quote.ts # Zod 스키마
├── auth.ts                 # NextAuth 설정
└── middleware.ts           # 인증 미들웨어 (/quotes/** 보호)
prisma/
├── schema.prisma           # DB 스키마 (User, Quote, QuoteItem)
├── seed.ts                 # 더미 시드
└── migrations/             # 마이그레이션 파일
```

## 주요 명령어

```bash
npm run dev          # 개발 서버 실행
npm run build        # 프로덕션 빌드
npm run lint         # ESLint 실행
npx prisma generate  # Prisma 클라이언트 생성
npx prisma migrate dev  # DB 마이그레이션
npx prisma studio    # DB GUI
npm run seed:excel   # 엑셀 데이터 시딩
```

## 코드 컨벤션

- **경로 별칭**: `@/*` → `./src/*`
- **Server Actions**: `src/actions/` 디렉토리에 `'use server'` 선언
- **인증 검증**: Server Action에서 `assertAuthenticated()` 호출로 세션 확인
- **견적번호 형식**: `ES-YYMM-MMSEQ-YEARSEQ` (예: ES-2602-001-0001)
- **금액 계산**: 공급가 = 소계 - 할인, VAT = Math.floor(공급가 * 0.1), 합계 = 공급가 + VAT
- **UI 검증 메시지**: 한국어 사용 (예: "품명을 입력해주세요")
- **revalidatePath**: 데이터 변경 후 `/quotes` 경로 재검증

## 환경 변수

```
DATABASE_URL          # Neon PostgreSQL 연결 URL (pooled)
DIRECT_DATABASE_URL   # Neon 직접 연결 URL (마이그레이션용)
AUTH_GOOGLE_ID        # Google OAuth 클라이언트 ID
AUTH_GOOGLE_SECRET    # Google OAuth 클라이언트 시크릿
AUTH_SECRET           # NextAuth 시크릿
```

## DB 스키마 요약

- **User**: id, email, name
- **Quote**: id, quoteNo(unique), date, recipientName, recipientContact, supplierInfo(JSON), subtotal, discount, supplyPrice, vat, total, notes
- **QuoteItem**: id, quoteId(FK), name, process, qty, unitPrice(nullable), amount, note, order

## 주의사항

- `next.config.ts`에서 `output: "standalone"` 설정 (Docker 배포용)
- Prisma binaryTargets에 `linux-musl-openssl-3.0.x` 포함 (Alpine Linux용)
- 미들웨어가 `/quotes/:path*` 경로를 보호하며 미인증 시 `/login`으로 리다이렉트
- `redirect()`는 try-catch 밖에서 호출해야 함 (Next.js 규칙)
