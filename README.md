# qou-app (견적서 관리 애플리케이션)

`qou-app`은 소비자가 생성한 견적서를 관리하고 PDF로 출력하거나 엑셀 데이터를 임포트하여 활용할 수 있는 심플하지만 강력한 웹 애플리케이션입니다.

## 🚀 기술 스택 (Tech Stack)

- **Framework**: [Next.js 16](https://nextjs.org) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com)
- **Database**: PostgreSQL (via [Neon](https://neon.tech)), [Prisma ORM](https://www.prisma.io)
- **Deploy**: Google Cloud Run (Dockerized)
- **Forms**: React Hook Form + Zod
- **Utils**: date-fns, lucide-react, react-pdf

## 🛠️ 시작하기 (Getting Started)

### 사전 요구 사항
- Node.js 20+
- npm 또는 pnpm

### 설치 및 실행

1. **저장소 클론 및 패키지 설치**
   ```bash
   git clone <repo-url>
   cd qou-app
   npm install
   ```

2. **환경 변수 설정**
   `.env` 파일을 생성하고 데이터베이스 연결 문자열을 설정해야 합니다.
   ```env
   DATABASE_URL="postgresql://user:password@host:port/db?sslmode=require"
   ```

3. **로컬 개발 서버 실행**
   ```bash
   npm run dev
   ```
   브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인합니다.

## 📂 주요 명령어

- `npm run dev`: 개발 서버 실행
- `npm run build`: 프로덕션 빌드
- `npm run start`: 프로덕션 서버 실행
- `npm run lint`: 린트 검사
- `npm run seed:excel`: 엑셀 파일(`견적서_앱시트.xlsx`)을 읽어 DB 시딩

## ☁️ 배포 (Deployment)

이 프로젝트는 Docker 컨테이너로 패키징되어 Google Cloud Run에 배포됩니다.
자세한 배포 절차는 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)를 참고하세요.

## 🤖 AI 에이전트 참고용
에이전트가 프로젝트 컨텍스트를 빠르게 파악하려면 [AI_CONTEXT.md](./AI_CONTEXT.md) 파일을 참고하세요.
