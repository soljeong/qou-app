# 데이터베이스 설계

> PostgreSQL 15 + Prisma ORM 기반.
> 3개의 테이블로 구성되며, `Quote` ↔ `QuoteItem` 간 1:N 관계가 핵심 구조입니다.

---

## 1. ERD (Entity Relationship Diagram)

```d2
direction: right

User: {
  shape: sql_table
  id: "UUID\n{PK, default: uuid()}"
  email: "VARCHAR\n{unique, not null}"
  name: "VARCHAR\n{nullable}"
  createdAt: "TIMESTAMP\n{default: now()}"
  updatedAt: "TIMESTAMP\n{auto-update}"
}

Quote: {
  shape: sql_table
  id: "UUID\n{PK, default: uuid()}"
  quoteNo: "VARCHAR\n{unique, not null}"
  date: "TIMESTAMP\n{not null}"
  recipientName: "VARCHAR\n{not null}"
  recipientContact: "VARCHAR\n{nullable}"
  supplierInfo: "JSONB\n{not null}"
  subtotal: "FLOAT8\n{not null}"
  discount: "FLOAT8\n{not null, default: 0}"
  supplyPrice: "FLOAT8\n{not null}"
  vat: "FLOAT8\n{not null}"
  total: "FLOAT8\n{not null}"
  notes: "TEXT\n{nullable}"
  createdAt: "TIMESTAMP\n{default: now()}"
  updatedAt: "TIMESTAMP\n{auto-update}"
}

QuoteItem: {
  shape: sql_table
  id: "UUID\n{PK, default: uuid()}"
  quoteId: "UUID\n{FK → Quote.id, not null}"
  name: "VARCHAR\n{not null}"
  process: "VARCHAR\n{not null}"
  qty: "INTEGER\n{not null}"
  unitPrice: "FLOAT8\n{nullable}"
  amount: "FLOAT8\n{not null}"
  note: "VARCHAR\n{nullable}"
  order: "INTEGER\n{not null}"
}

Quote -> QuoteItem: "1 : N\n(quoteId FK)"
```

---

## 2. 각 테이블 상세 설명

### 2.1 `User` 테이블

현재는 최소 스펙으로 정의되어 있으며 인증 기능과 연동될 예정입니다.

```d2
User_detail: "User 테이블" {
  shape: sql_table
  id: "UUID PK | gen_random_uuid() 자동 생성"
  email: "VARCHAR | UNIQUE | 로그인 식별자"
  name: "VARCHAR NULL | 표시용 이름 (선택)"
  createdAt: "TIMESTAMPTZ | 생성 시각 (자동)"
  updatedAt: "TIMESTAMPTZ | 마지막 수정 시각 (자동)"
}
```

### 2.2 `Quote` 테이블

견적서의 헤더 정보를 저장합니다. 품목 합계, 할인, 부가세, 최종금액은 모두 **비정규화된 계산 결과**로 저장됩니다.

```d2
Quote_detail: "Quote 테이블" {
  shape: sql_table
  id: "UUID PK | 견적서 고유 ID"
  quoteNo: "VARCHAR UNIQUE | ES-YYMM-MMSEQ-YEARSEQ 형식"
  date: "TIMESTAMPTZ | 견적 발행일"
  recipientName: "VARCHAR | 수신처 업체명 (필수)"
  recipientContact: "VARCHAR NULL | 담당자명 (선택)"
  supplierInfo: "JSONB | 공급자 정보 (현재 빈 객체 {})"
  subtotal: "FLOAT8 | 품목 합계 (Σ item.amount)"
  discount: "FLOAT8 DEFAULT 0 | 특별 할인액"
  supplyPrice: "FLOAT8 | 공급가액 = subtotal - discount"
  vat: "FLOAT8 | 부가세 = floor(supplyPrice × 0.1)"
  total: "FLOAT8 | 최종금액 = supplyPrice + vat"
  notes: "TEXT NULL | 견적서 하단 메모 (전통형 출력)"
  createdAt: "TIMESTAMPTZ | 레코드 생성 시각"
  updatedAt: "TIMESTAMPTZ | 레코드 수정 시각"
}
```

**quoteNo 형식 예시:**

| 필드 | 값 | 설명 |
|------|-----|------|
| prefix | `ES-2506` | 회사코드 + 연도2자리 + 월2자리 |
| mmSeq | `003` | 해당 월 내 3번째 견적 |
| yearSeq | `0012` | 해당 연도 내 12번째 견적 |
| **결과** | `ES-2506-003-0012` | 최종 견적번호 |

### 2.3 `QuoteItem` 테이블

견적서의 품목(라인 아이템)을 저장합니다. `order` 필드로 표시 순서를 관리합니다.

```d2
QuoteItem_detail: "QuoteItem 테이블" {
  shape: sql_table
  id: "UUID PK | 품목 고유 ID"
  quoteId: "UUID FK | Quote.id 참조"
  name: "VARCHAR | 품명 (필수)"
  process: "VARCHAR | 공정명 (가공 방식 등)"
  qty: "INTEGER | 수량 (1 이상)"
  unitPrice: "FLOAT8 NULL | 단가 (null = 별도 견적, 0 = 무상)"
  amount: "FLOAT8 | 금액 (unitPrice != null이면 qty × unitPrice)"
  note: "VARCHAR NULL | 비고"
  order: "INTEGER | 화면 표시 순서 (0부터 시작)"
}
```

**unitPrice 의미:**

| unitPrice 값 | 의미 |
|-------------|------|
| `null` | 별도 견적 (단가 미공개, amount는 수동 입력) |
| `0` | 무상 제공 |
| `> 0` | 정상 단가, amount = qty × unitPrice 자동 계산 |

---

## 3. 인덱스 및 제약조건

```d2
direction: down

constraints: "제약조건 및 인덱스" {
  shape: rectangle
  style.fill: "#f5f5f5"

  pk_user: "User.id → PRIMARY KEY (UUID)" {shape: rectangle}
  uk_user_email: "User.email → UNIQUE INDEX" {shape: rectangle}

  pk_quote: "Quote.id → PRIMARY KEY (UUID)" {shape: rectangle}
  uk_quote_no: "Quote.quoteNo → UNIQUE INDEX\n(견적번호 중복 방지)" {shape: rectangle}

  pk_item: "QuoteItem.id → PRIMARY KEY (UUID)" {shape: rectangle}
  fk_item_quote: "QuoteItem.quoteId → FK(Quote.id)\n(CASCADE DELETE는 명시적으로 미설정)" {shape: rectangle}
  idx_item_order: "QuoteItem 조회 시 ORDER BY order ASC" {shape: rectangle}
}
```

---

## 4. 마이그레이션 구조

```d2
direction: down

migrations: "prisma/migrations/" {
  shape: rectangle

  m1: "초기 스키마 생성\n(User, Quote, QuoteItem 테이블)" {shape: document}
  m2: "DB 마이그레이션\n(스키마 변경 반영)" {shape: document}
  m3: "기존 데이터 시드\n(Excel 데이터 임포트)" {shape: document}

  m1 -> m2 -> m3
}

seed: "prisma/seed-from-excel.ts" {
  shape: document
  style.fill: "#e8f5e9"
}

seed -> migrations.m3: "XLSX 파일 읽기 → DB 삽입"
```

---

## 5. 데이터 흐름 (CRUD)

```d2
direction: right

create_flow: "견적서 생성 흐름" {
  shape: rectangle

  form_input: "폼 입력\n(QuoteFormValues)" {shape: oval}
  validate: "Zod 유효성 검사" {shape: rectangle}
  gen_no: "견적번호 생성\n(DB 조회 후 seq 계산)" {shape: rectangle}
  calc: "합계 계산\n(subtotal→vat→total)" {shape: rectangle}
  db_write: "prisma.quote.create()\n(Quote + QuoteItems 동시 생성)" {shape: cylinder}
  revalidate: "revalidatePath('/quotes')\n(캐시 무효화)" {shape: rectangle}

  form_input -> validate -> gen_no -> calc -> db_write -> revalidate
}

update_flow: "견적서 수정 흐름" {
  shape: rectangle

  form_input2: "폼 입력\n(QuoteFormValues)" {shape: oval}
  validate2: "Zod 유효성 검사" {shape: rectangle}
  calc2: "합계 재계산" {shape: rectangle}
  tx: "prisma.$transaction()" {
    shape: rectangle
    style.fill: "#fff3e0"
    step1: "quote.update(헤더 정보)" {shape: rectangle}
    step2: "quoteItem.deleteMany(기존 전체 삭제)" {shape: rectangle}
    step3: "quoteItem.createMany(신규 일괄 삽입)" {shape: rectangle}
    step1 -> step2 -> step3
  }
  revalidate2: "revalidatePath('/quotes')" {shape: rectangle}

  form_input2 -> validate2 -> calc2 -> tx -> revalidate2
}
```
