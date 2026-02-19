# Qou - 견적 관리 시스템 (Quote Management System)

## 1. 프로젝트 개요

---

## 2. 기술 스택 (Tech Stack)

| 구분 | 기술 / 라이브러리 | 비고 |
| :--- | :--- | :--- |
| **Framework** | Next.js 14 (App Router) | React 기반 웹 프레임워크 |
| **Language** | TypeScript | 정적 타입 시스템 |
| **Styling** | Tailwind CSS | 유틸리티 퍼스트 CSS |
| **UI Components** | Shadcn UI | Radix UI 기반의 재사용 가능한 컴포넌트 라이브러리 |
| **Icons** | Lucide React | 아이콘 라이브러리 |
| **Backend** | Next.js Server Actions | 서버 사이드 로직 처리 |
| **Database** | PostgreSQL 15 | 관계형 데이터베이스 (Docker 컨테이너) |
| **ORM** | Prisma | 타입세이프 데이터베이스 클라이언트 |
| **PDF Generation** | @react-pdf/renderer | React 컴포넌트 기반 PDF 생성 (서버/클라이언트) |
| **Validation** | Zod | 스키마 검증 라이브러리 |
| **Date Utils** | Date-fns | 날짜 처리 라이브러리 |
| **Environment** | Docker & Docker Compose | 개발 환경 가상화 |

---

## 3. 핵심 기능 및 로직 (Key Features & Logic)

### 3.1. 견적서 관리 (Quote Management)
*   **견적서 목록 조회**: 작성된 견적서를 최신순으로 조회합니다.
*   **견적서 작성/수정**:
    *   수신처(업체명) 및 견적일 입력.
    *   품목(Item)의 동적 추가/삭제.
    *   **공정(Process) 관리**: 기존 '규격(Spec)' 대신 '공정' 개념을 사용하여 제조/가공 단계를 명시.
    *   **유연한 단가 정책**: 단가(Unit Price)는 **0원** 또는 **빈 값(Null - 별도견적)** 입력을 허용합니다.
    *   **자동 계산**: 수량 * 단가 = 금액, 공급가액 + 부가세(10%) = 합계금액 자동 산출.
    *   **실시간 미리보기**: 견적서 작성 화면에서 좌우 분할(Split View)을 통해 입력 내용이 반영된 PDF를 실시간으로 확인 가능.
    *   **스프레드시트 붙여넣기**: 엑셀이나 구글 시트의 데이터를 복사하여 견적 품목의 **어떤 칸**에서든 붙여넣기(`Ctrl+V`)를 통해 여러 행/열을 한 번에 입력 가능. (데이터에 맞춰 행 자동 추가)
*   **할인 기능**: 견적서 하단에 할인 금액을 입력할 수 있으며, 할인이 적용된 경우 양식에 '소계, 할인, 공급가액, 부가세, 합계' 5항목이 표시됨 (할인이 없으면 3항목만 표시).
*   **견적 관리 분할 뷰(Split View)**: 견적서 목록에서 항목을 클릭하면 우측에서 즉시 해당 견적서의 실시간 미리보기를 확인할 수 있어 빠르고 효율적인 관리가 가능합니다. (NEW)
*   **수동 금액 입력 및 "PP" 표시**: 단가(Unit Price)를 알 수 없는 경우 단가 칸을 비워두면 금액(Amount) 칸이 활성화되어 수동으로 총액을 입력할 수 있습니다. 이 경우 미리보기 및 PDF에서는 단가 칸에 "PP"가 표시됩니다. (NEW)
*   **수신처 담당자**: 수신처 업체명 외에 담당자(recipientContact)를 추가로 입력하여 견적서 상단에 표시할 수 있습니다. (NEW)

### 3.2. PDF 출력 (PDF Generation)
*   **A4 규격 준수**: 인쇄 및 배포에 최적화된 A4 레이아웃.
*   **한글 폰트 지원**: Noto Sans KR 폰트를 로컬(`public/fonts/`)에서 로드하여 깨짐 없는 출력 보장.
*   **행 병합 (Row Spanning)**:
    *   동일한 **품명(Name)**이 연속될 경우, 첫 번째 행에만 품명을 표시하고 셀 경계선을 조정하여 **시각적으로 병합**된 효과를 줍니다.
    *   이를 통해 하나의 품목에 여러 공정이 포함되는 경우를 깔끔하게 표현합니다.

### 3.3. 데이터베이스 (Database Schema)

#### User (사용자)
*   관리자 또는 시스템 사용자 정보 관리.

#### Quote (견적서)
*   `quoteNo`: 견적번호 (Format: `ES-YYMM-SEQ...` / 현재는 UUID 또는 임시 로직 사용 중)
*   `recipientName`: 수신처
*   `date`: 견적일
*   `total`: 합계금액

#### QuoteItem (견적 품목)
*   `quoteId`: 소속 견적서 ID
*   `name`: 품명 (Row Spanning 기준)
*   `process`: 공정 (Process)
*   `qty`: 수량
*   `unitPrice`: 단가 (Optional/Nullable)
*   `amount`: 금액
*   `note`: 비고
*   `order`: 정렬 순서

---

## 4. 데이터베이스 스키마 정의 (Prisma Schema)

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Quote {
  id          String   @id @default(uuid())
  quoteNo     String   @unique
  date        DateTime
  recipientName    String
  recipientContact String? // 수신처 담당자 (예: 배일권 부장)
  supplierInfo Json     // 공급자 정보
  
  // 금액 집계
  subtotal    Float
  discount    Float    @default(0)
  supplyPrice Float
  vat         Float
  total       Float

  items       QuoteItem[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model QuoteItem {
  id        String @id @default(uuid())
  quoteId   String
  quote     Quote  @relation(fields: [quoteId], references: [id], onDelete: Cascade)

  name      String // 품명
  process   String // 공정
  qty       Int    // 수량
  unitPrice Float? // 단가 (Null 허용)
  amount    Float  // 금액
  note      String? // 비고

  order     Int    // 정렬 순서
}
```

---

## 5. 프로젝트 구조 (Directory Structure)

```
qou/
├── docker-compose.yml       # Docker 실행 설정
├── README.md                # 프로젝트 설명서 (본 문서)
└── qou-app/                 # Next.js 애플리케이션
    ├── public/
    │   └── fonts/           # PDF용 로컬 폰트 (NotoSansKR)
    ├── prisma/
    │   └── schema.prisma    # DB 스키마 정의
    ├── src/
    │   ├── app/             # Page 및 API Route
    │   ├── actions/         # Server Actions (DB 조작)
    │   ├── components/
    │   │   ├── ui/          # Shadcn UI 컴포넌트
    │   │   ├── quote/       # 견적 관련 컴포넌트 (Form, Table)
    │   │   └── pdf/         # PDF 생성 컴포넌트 (QuotePDF.tsx 등)
    │   ├── lib/
    │   │   ├── prisma.ts    # Prisma 클라이언트 싱글톤
    │   │   └── validations/ # Zod 검증 스키마
    └── ...
```

---



### 개발 관련 명령어 (컨테이너 내부 실행)
DB 스키마 변경 시 적용:
```bash
docker compose run --rm app npx prisma db push
```

새로운 패키지 설치:
```bash
docker compose run --rm app npm install [패키지명]
```

---

## 7. 문제 해결 (Troubleshooting)

### Hydration Error (날짜 불일치)
*   서버(UTC)와 클라이언트(KST)의 시간대 차이로 인해 발생할 수 있습니다.
*   `docker-compose.yml`에 `TZ=Asia/Seoul` 환경변수를 설정하여 해결했습니다.
*   날짜 렌더링 시 `date-fns`의 `format` 함수를 사용하여 일관된 문자열을 출력합니다.

### PDF 폰트 로드 실패
*   외부 URL(GitHub, Google Fonts) 차단 또는 CORS 문제 시 발생합니다.
*   폰트 파일을 로컬(`public/fonts`)에 다운로드하여 직접 참조하도록 수정하여 해결했습니다.

---

## 8. 제약 사항 및 향후 계획 (Constraints & Future Plans)

### 공급자 정보 하드코딩
*   **현재 상태**: 공급자 정보(등록번호, 상호, 대표자, 주소, 연락처 등)는 `QuoteHTMLPreview.tsx` 및 `QuotePDF.tsx` 컴포넌트 내에 **하드코딩**되어 있습니다.
*   **이유**: 초기 개발 단계에서 특정 업체(은성 일렉콤) 전용 시스템으로 구축되었기 때문입니다.
*   **향후 계획**: `Quote` 모델의 `supplierInfo` 필드(Json)를 활용하거나 별도의 `Company` 테이블을 생성하여 관리자 설정 화면에서 동적으로 수정할 수 있도록 기능을 확장할 예정입니다.

```bash
docker compose exec app npx prisma studio
```

## 📂 주요 명령어

- `npm run dev`: 개발 서버 실행
- `npm run build`: 프로덕션 빌드
- `npm run start`: 프로덕션 서버 실행
- `npm run lint`: 린트 검사
- `npm run seed:excel`: 엑셀 파일(`견적서_앱시트.xlsx`)을 읽어 DB 시딩

## ☁️ 배포 (Deployment)

이 프로젝트는 Docker 컨테이너로 패키징되어 Google Cloud Run에 배포됩니다.
자세한 배포 절차는 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)를 참고하세요.

