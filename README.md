# Qou - 견적서 관리 웹 애플리케이션

스프레드시트 방식의 편리함과 현대적인 웹 아키텍처를 결합한 견적서 생성 및 관리 시스템입니다.
자동화된 계산과 정교한 A4 레이아웃 PDF 출력을 제공합니다.

## 주요 기능

- **실시간 견적 작성 (Split View)**: 목록 패널과 실시간 PDF 미리보기 패널을 동시에 사용하여 직관적으로 문서를 작성합니다.
- **스프레드시트 텍스트 붙여넣기**: 엑셀, 구글 시트 등 외부 스프레드시트의 데이터를 `Ctrl+V`로 품목 테이블에 한 번에 붙여넣을 수 있습니다.
- **정교한 금액 처리**:
  - 단가를 비워두고 'PP(별도견적)' 표기를 남기거나, 값을 강제로 직접 입력할 수 있습니다.
  - 전표 내역 소계부터 할인액 적용과 세금 계산(부가세 10%, 공급가 합산)을 자동으로 수행합니다.
- **고품질 PDF 출력**: A4 규격에 맞게 최적화되며, 한글 폰트(`Noto Sans KR`)를 사용하여 깨지지 않는 고화질 견적서를 만들어냅니다.
  - 동일한 요소들은 시각적으로 깔끔하게 묶이는 **행 병합 기능**을 자동으로 제공합니다.
- **안전한 인증**: 시스템 내 모든 견적 문서는 접속 권한이 있는 Google 계정 보유자(OAuth Login)만 제어할 수 있습니다.

## 기술 스택
- **프레임워크**: Next.js 16 (App Router), React 19
- **UI 및 스타일**: Tailwind CSS v4, shadcn/ui
- **DB 및 ORM**: PostgreSQL (Neon 연동), Prisma v6
- **인증**: NextAuth v5 (Google OAuth)
- **배포망**: Docker 컨테이너 및 Google Cloud Run

## 개발 시작 및 환경 설정

직접 로컬 구동 시 `.env` 설정과 마이그레이션 반영이 필요합니다.
*(부모 디렉토리의 `docker-compose.yml`을 통한 컨테이너형 개발을 권장합니다.)*

### 1. 패키지 설치
```bash
npm install
```
(`postinstall` 스크립트를 통해 `prisma generate`가 자동 실행됩니다.)

### 2. .env 환경 변수 설정
프로젝트 최상단에 `.env` 파일을 복사/생성하여 아래 내용을 구성하세요.
```env
# 데이터베이스 (Neon DB 혹은 로컬 Postgres)
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
DIRECT_DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Google Auth 인증 클라이언트
AUTH_GOOGLE_ID="your-client-id"
AUTH_GOOGLE_SECRET="your-client-secret"
AUTH_SECRET="your-nextauth-secret" # (openssl rand -base64 32 등으로 무작위 생성)
```

### 3. 마이그레이션 적용 및 서버 실행
```bash
# DB 마이그레이션
npx prisma migrate dev

# 애플리케이션 개발 모드 실행
npm run dev
```

서버 실행 후, 웹 브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속하여 기능을 이용할 수 있습니다.

## Google Cloud Run 배포

이 프로젝트는 Docker 컨테이너 래핑을 통하여 Google Cloud Run에 배포할 수 있도록 구성되어 있습니다. `Dockerfile` 기반의 standalone 빌드를 쓰며, Cloud Build를 이용한 CI/CD에 최적화되어 있습니다.
