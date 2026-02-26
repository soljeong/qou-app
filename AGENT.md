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
