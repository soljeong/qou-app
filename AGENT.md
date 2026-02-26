# Qou App - Application Agent Guide

## 개요
이 디렉토리는 Qou 통합 견적 관리 시스템의 실제 **Next.js 16 애플리케이션 코드**가 위치한 곳입니다. (Git 서브모듈: `soljeong/qou-app`).
에이전트는 애플리케이션 개발 시 이 문서의 기술 스택 및 비즈니스 규칙을 엄격하게 준수해야 합니다.

## 기술 스택
- **프레임워크**: Next.js 16 (App Router, React 19, RSC)
- **언어**: TypeScript (Strict Mode)
- **스타일링 & UI**: Tailwind CSS v4, shadcn/ui (new-york style), lucide-react
- **DB & ORM**: PostgreSQL (Neon 연동), Prisma ORM v6
- **인증**: NextAuth v5 (Auth.js) - Google OAuth
- **PDF 생성**: `@react-pdf/renderer` 및 HTML-to-Image 방식 (jspdf)
- **빌드**: Docker `standalone` 멀티 스테이지 빌드

## 아키텍처 및 디렉토리 구조
- `app/`: Next.js App Router (페이지 및 API 경로 관리)
- `actions/`: `'use server'` 기반의 Server Actions 모음. 
- `components/`: 견적서 관련(`quote/`), PDF 렌더링 관련(`pdf/`), 공통 UI(`ui/`) 컴포넌트 단위 분리.
- `lib/`: Prisma 싱글턴 클라이언트, 유틸 함수, Zod 검증 스키마 포함.
- `prisma/`: 데이터베이스 스키마 (`schema.prisma`), 마이그레이션, 엑셀 시딩 로직.

## 코드 컨벤션 & 비즈니스 로직
1. **Server Actions 및 인증 검증**:
   - `src/actions/` 내부 로직은 항상 최상단에 `'use server'`를 선언합니다.
   - 인증이 필요한 기능은 `assertAuthenticated()`를 호출하여 세션을 검증합니다.
2. **견적서 도메인 규칙 (Quotation Business Logic)**:
   - **견적번호 규격**: `ES-YYMM-MMSEQ-YEARSEQ` (예: ES-2602-001-0001)
   - **금액 계산**: `공급가` = (품목별 금액 소계) - 할인금액 / `VAT` = `Math.floor(공급가 * 0.1)` / `총합계` = 공급가 + VAT
   - **단가 표기**: `unitPrice`가 `null`인 경우 "별도견적(PP)" 표시, `0`인 경우 "무상"으로 처리됩니다.
   - **행 병합(Row Spanning)**: PDF 출력 시 연속된 "품명(name)"이 같을 경우 UI/PDF 테이블에서 병합된 것처럼 보이도록 처리(`quote-utils.ts` 활용).
3. **상태 관리 및 라우팅 (Next.js)**:
   - 변경된 데이터를 화면에 반영하기 위해 Server Action 내에서 `revalidatePath('/quotes')`를 적극 활용합니다.
   - `redirect()`는 Error 처리를 방해하지 않도록 `try-catch` 블럭 바깥에서 호출합니다.
4. **마이그레이션 전략 (Prisma)**:
   - 로컬 작업: 스키마 변경 시 `npx prisma migrate dev`를 사용.
   - 운영 서버: `prisma db push`가 아닌 `npx prisma migrate deploy` 적용을 원칙으로 합니다. (마이그레이션 이력 파일 기반 동기화)

## 클라우드 및 배포 아키텍처
- 환경변수 (`AUTH_*`, `DATABASE_URL` 등)에 대한 탑 레벨 검증(빌드 타임 Throw)은 피하세요. CI 파이프라인(Cloud Build)이나 Docker 빌드 타임에 영향을 줄 수 있습니다.
- Google Cloud Run 배포를 위해 `.dockerignore` 등에 비밀키 누출이 없도록 관리합니다.

---

## 엑셀 업로드 파이프라인 (상세)

### 전체 데이터 플로우
```
사용자가 .xls/.xlsx 파일 업로드
  → QuoteListHeaderActions.tsx (파일 선택 input onChange)
  → uploadAndParseExcel(formData)  [src/actions/excel-upload.ts]
    → 파일을 public/uploads/quotes/{uuid}.xls 에 저장
    → xlsx 라이브러리로 워크북 파싱 → 각 시트를 CSV로 변환
    → Claude API (claude-sonnet-4-6) 호출 → 구조화된 JSON 반환
    → PNG 바이너리 시그니처로 이미지 추출 → public/uploads/images/{uuid}.png 저장
  → 결과를 sessionStorage('quoteDraft')에 저장 후 /quotes/new 리다이렉트
  → QuoteForm.tsx useEffect에서 sessionStorage 복원 → form.reset() 호출
  → 사용자 확인 후 저장 버튼 클릭
  → createQuote(data, extractedImages)  [src/actions/quote.ts]
    → Quote + QuoteItem DB 생성 (include items)
    → image.index ↔ item.order 매핑으로 QuoteImage DB 생성
```

### 핵심 파일 역할
| 파일 | 역할 |
|------|------|
| `src/actions/excel-upload.ts` | 엑셀 파싱 Server Action. LLM 파서 + PNG 이미지 추출 |
| `src/actions/quote.ts` | Quote CRUD. `createQuote(data, extractedImages?)` |
| `src/components/quote/QuoteListHeaderActions.tsx` | 엑셀 업로드 UI 버튼. sessionStorage 드래프트 저장 |
| `src/components/quote/QuoteForm.tsx` | 견적서 작성/수정 폼. sessionStorage 복원 + submit |

### LLM 파싱 전략
- **이유**: 엑셀 파일마다 시트명/셀 구성이 다를 수 있어 하드코딩 불가
- **방법**: 모든 시트를 `xlsx.utils.sheet_to_csv()`로 텍스트화 → Claude API에 전달 → JSON 반환
- **모델**: `claude-sonnet-4-6` (max_tokens: 4096)
- **환경변수 필수**: `ANTHROPIC_API_KEY` (`.env`에 없으면 런타임 에러)
- **JSON 코드블록 처리**: LLM이 ` ```json ``` `으로 감쌀 수 있으므로 `extractJSON()` 함수로 제거

### PNG 이미지 추출
- `.xls` (OLE Compound) 파일에서 xlsx 라이브러리의 `bookImages: true` 옵션은 `.xls` 포맷에서 동작 안 함
- 대신 **PNG 바이너리 시그니처 탐색** 방식 사용:
  - 시작: `89 50 4E 47 0D 0A 1A 0A`
  - 끝: `49 45 4E 44 AE 42 60 82` (IEND 청크)
- 테스트 파일(`9be03060-...xls`) 기준 **13개 PNG** 추출됨 (로고, 스탬프, 제품 이미지 등 혼재)
- 저장 경로: `public/uploads/images/{uuid}.png`

### 이미지-품목 매핑 전략
- 엑셀 내 이미지 앵커(어떤 셀에 붙어있는지) 추출은 BIFF8/ESCHER 파싱이 필요해 복잡
- 현재 구현: `image.index` (추출 순번)와 `QuoteItem.order` (품목 순서)를 **순번 기반 매칭**
- `image.index`에 해당하는 `QuoteItem.order`가 없으면 해당 이미지는 DB에 저장 안 됨

---

## DB 스키마 상세

### Quote 관련 모델
```prisma
model Quote {
  quoteNo     String   @unique  // ES-YYMM-MMSEQ-YEARSEQ 형식
  supplierInfo Json             // 공급사 정보 (name, representative, businessNo, contact, address)
  excelFilePath String?        // 업로드된 엑셀 파일 경로 (/uploads/quotes/xxx.xls)
  items       QuoteItem[]
}

model QuoteItem {
  order     Int              // 품목 순서 (0-based)
  images    QuoteImage[]     // 연결된 이미지들
}

model QuoteImage {
  quoteItemId String         // QuoteItem FK (Cascade delete)
  filePath    String         // /uploads/images/{uuid}.png
  itemIndex   Int            // 엑셀 내 이미지 추출 순번 (= QuoteItem.order와 매핑)
}
```

### supplierInfo JSON 구조 (예시)
```json
{
  "name": "은성 일렉콤",
  "representative": "임인걸",
  "businessNo": "137-81-30557",
  "contact": "Tel. 032-582-8715",
  "address": ""
}
```
- `createQuote`에서 현재 `supplierInfo: {}`로 빈 객체 저장 (LLM 파싱 결과가 있어도 아직 반영 안 됨)

---

## 실제 엑셀 파일 구조 분석 (기준 파일)

**파일**: `public/uploads/quotes/9be03060-23a1-4664-a5e9-33d0e6311b18.xls`
**작성 회사**: 은성SMT (작성자: smt es, 원작성자: 권영일)
**마지막 수정**: 2026-01-30

### Sheet1 레이아웃 (A1:W34)
```
A1:  "견  적  서" (제목, A1:J1 병합)
A2:  "NO.  ES-2601-031-0031" (견적번호)
A3:  "2026.  01.  30." (날짜)
A4:  "티온\n박동영 과장님 귀하" (고객사\n담당자)
A6:  "담당자 : 정동익(010-2200-2829)" (추가 연락처)
E3:  "등록번호"   F3: "137-81-30557" (사업자번호)
E4:  "상호"       F4: "은성 일렉콤"
H4:  "대표자명"   J4: "임인걸"
F7:  "Tel. 032-582-8715"
F8:  "Fax.032-582-8716"

Row 10: 헤더행 (품명|규격|수량||단가||금액||비고|...|700|1000|1500|2000|3000|합계|견적)
Row 11-13: 품목1 (A11:A13 병합 = "CPCB_LOG_83VD_V26")
  - Row 11: SMT, qty=2, PP, ₩450,000
  - Row 12: Ass'y, qty=2, PP, ₩60,000
  - Row 13: 메탈마스크, 1(단면), ₩100,000
Row 14-16: 품목2 (CPCB_LOG_83LGE_V26)
Row 17-19: 품목3 (CPCB_LOG_55VD_V26)
Row 20-22: 품목4 (CPCB_LOG_42-65_V26)
Row 23:    "~~이하여백~~"
A26: "공급가액" B26: 2,440,000
A27: "부 가 세" B27: 244,000
A28: "합     계" B28: 2,684,000
A29: "비고(메모)" B29: "무연솔더 진행."
```
- **병합셀 74개** (헤더, 품목 그룹핑, 푸터)
- 컬럼 매핑: A=품명(병합), B=공정/규격, C=수량, E=단가, G=금액, I=비고

### sessionStorage 드래프트 구조
```ts
{
  quoteNo: "ES-2601-031-0031",
  date: Date,
  recipientName: "티온",
  recipientContact: "박동영 과장님",
  notes: "무연솔더 진행.",
  discount: 0,
  supplierInfo: { name, representative, businessNo, contact, address },
  items: [{ name, process, qty, unitPrice, amount, note }],
  htmlPreview: "<h3>Sheet1</h3>...",       // 엑셀 원본 HTML 미리보기
  excelFilePath: "/uploads/quotes/xxx.xls",
  extractedImages: [{ filePath: "/uploads/images/xxx.png", index: 0 }, ...]
}
```

---

## 개발 환경 주의사항

### 필수 환경변수 (`.env`)
```
DATABASE_URL=postgresql://...
DIRECT_DATABASE_URL=postgresql://...
AUTH_SECRET=...
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
ANTHROPIC_API_KEY=sk-ant-...   ← 엑셀 LLM 파싱에 필수
```

### 로컬 DB 관리
- 로컬 PostgreSQL은 Docker Compose의 `db` 서비스 (포트 5432)
- 스키마 변경 시: `docker compose exec app npx prisma db push` (개발) 또는 `npx prisma db push` (로컬 직접)
- `prisma migrate dev`는 마이그레이션 히스토리와 실제 DB 간 drift가 있으면 reset 요구 → 개발 중에는 `db push` 사용
- 마이그레이션 히스토리 파일(`prisma/migrations/`)이 실제 DB 상태와 맞지 않는 상태임 (drift 존재)

### 파일 저장 경로
```
public/uploads/
├── quotes/    ← 업로드된 엑셀 파일들 ({uuid}.xls/.xlsx)
└── images/    ← 엑셀에서 추출된 PNG 이미지들 ({uuid}.png)
```

### 테스트 스크립트
- `scripts/test-excel-parse.ts`: 업로드된 엑셀 파일을 직접 파싱해서 콘솔 출력
  ```bash
  cd qou-app && npx tsx scripts/test-excel-parse.ts
  ```
