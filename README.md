# Qou - 견적서 관리 시스템

견적서를 작성하고, 관리하고, PDF로 출력하는 웹 애플리케이션입니다.

## 주요 기능

### 견적서 관리
- **견적서 작성/수정**: 수신처, 견적일, 품목을 입력하여 견적서를 작성합니다.
- **품목 관리**: 품명, 공정, 수량, 단가를 입력하면 금액이 자동 계산됩니다. 품목을 동적으로 추가/삭제할 수 있습니다.
- **별도견적(PP)**: 단가를 알 수 없는 경우 단가를 비워두면 금액을 직접 입력할 수 있으며, PDF에서 단가란에 "PP"가 표시됩니다.
- **할인 적용**: 견적서 하단에 할인 금액을 입력하면 공급가액에 반영됩니다.
- **스프레드시트 붙여넣기**: 엑셀/구글시트에서 복사한 데이터를 품목 테이블에 `Ctrl+V`로 한 번에 붙여넣을 수 있습니다.
- **분할 뷰(Split View)**: 목록에서 견적서를 클릭하면 우측에 실시간 미리보기가 표시됩니다.

### PDF 출력
- A4 규격에 최적화된 레이아웃으로 PDF를 생성합니다.
- 한글 폰트(Noto Sans KR)를 로컬에서 로드하여 글자 깨짐 없이 출력합니다.
- 동일 품명이 연속되면 시각적으로 행이 병합되어 표시됩니다.

### 인증
- Google OAuth로 로그인합니다. 로그인하지 않으면 견적서 페이지에 접근할 수 없습니다.

## 기술 스택

| 구분 | 기술 |
| :--- | :--- |
| 프레임워크 | Next.js 16 (App Router, React 19) |
| 언어 | TypeScript |
| 스타일링 | Tailwind CSS v4 |
| UI 컴포넌트 | shadcn/ui |
| 데이터베이스 | PostgreSQL (Neon) |
| ORM | Prisma v6 |
| 인증 | NextAuth v5 (Google OAuth) |
| PDF | @react-pdf/renderer, jspdf |
| 배포 | Docker → Google Cloud Run |

## 시작하기

### 사전 준비

- Node.js 20 이상
- PostgreSQL 데이터베이스 (또는 [Neon](https://neon.tech) 계정)
- Google OAuth 클라이언트 ([Google Cloud Console](https://console.cloud.google.com/apis/credentials)에서 생성)

### 설치

```bash
# 의존성 설치 (postinstall 스크립트가 prisma generate를 자동 실행합니다)
npm install
```

### 환경 변수 설정

프로젝트 루트에 `.env` 파일을 만들고 아래 값을 설정합니다.

```env
# 데이터베이스
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
DIRECT_DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Google OAuth
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# NextAuth
AUTH_SECRET="openssl rand -base64 32 으로 생성"
```

> Neon을 사용하는 경우 `DATABASE_URL`에는 pooled URL, `DIRECT_DATABASE_URL`에는 direct URL을 사용합니다.

### 데이터베이스 설정

```bash
# 마이그레이션 적용
npx prisma migrate dev

# (선택) 엑셀 데이터로 시딩
npm run seed:excel
```

### 개발 서버 실행

```bash
npm run dev
```

`http://localhost:3000`에서 애플리케이션에 접근할 수 있습니다.

## 주요 명령어

| 명령어 | 설명 |
| :--- | :--- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 검사 |
| `npx prisma studio` | DB GUI |
| `npx prisma migrate dev` | 마이그레이션 생성 및 적용 |
| `npm run seed:excel` | 엑셀 파일로 DB 시딩 |

## 배포

Docker 컨테이너로 패키징하여 Google Cloud Run에 배포합니다.

### Docker 빌드

```bash
docker build -t qou-app .
```

### 런타임 환경 변수

Docker/Cloud Run에서 다음 환경변수를 설정해야 합니다:

| 환경변수 | 설명 |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL pooled 연결 URL |
| `AUTH_GOOGLE_ID` | Google OAuth 클라이언트 ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth 클라이언트 시크릿 |
| `AUTH_SECRET` | NextAuth 시크릿 키 |

> Dockerfile에 `AUTH_TRUST_HOST=true`와 `TZ=Asia/Seoul`이 이미 설정되어 있습니다.

## 프로젝트 구조

```
src/
├── app/            # 페이지 (App Router)
├── actions/        # Server Actions (견적서 CRUD)
├── components/
│   ├── layout/     # Header, Footer
│   ├── quote/      # 견적서 폼, 테이블, 미리보기
│   ├── pdf/        # PDF 렌더링 컴포넌트
│   └── ui/         # shadcn/ui 공통 컴포넌트
├── lib/            # 유틸리티, Prisma 클라이언트, Zod 스키마
├── auth.ts         # NextAuth 설정
└── middleware.ts   # 인증 미들웨어
prisma/
├── schema.prisma   # DB 스키마
├── migrations/     # 마이그레이션 파일
└── seed-from-excel.ts  # 엑셀 시딩 스크립트
```

## 문제 해결

### Hydration Error (날짜 불일치)
서버(UTC)와 클라이언트(KST) 시간대 차이로 발생할 수 있습니다. Docker 환경에서는 `TZ=Asia/Seoul` 환경변수를 설정하세요.

### PDF 폰트 깨짐
폰트 파일이 `public/fonts/`에 있는지 확인하세요. 외부 URL에서 폰트를 로드하면 CORS 문제가 발생할 수 있습니다.
