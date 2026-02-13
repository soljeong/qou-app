# Google Cloud Run 배포 재연 가이드

이 문서는 `qou-app`을 Google Cloud Run에 배포하기 위해 수행한 작업과, 이를 터미널에서 다시 실행(재연)하기 위한 단계별 가이드입니다.

## 1. 사전 준비 (Prerequisites)

### 필수 도구 설치
- **Google Cloud SDK**: `gcloud` 명령어를 사용하기 위해 필요합니다.
  - Windows (PowerShell): `winget install Google.CloudSDK`
- **Node.js & npm**: 로컬 빌드 및 의존성 설치용.

### 프로젝트 정보
- **Project ID**: `qou-app-deploy-2026` (새로 생성함)
- **Region**: `asia-northeast3` (Seoul)
- **Repo Name**: `qou-app-repo`
- **Service Name**: `qou-app`
- **Database**: Neon (`DATABASE_URL` 필요)

---

## 2. 코드 및 설정 변경 사항

배포를 성공시키기 위해 다음 파일들이 수정되거나 생성되었습니다.

### A. Dockerfile 생성 (Node 20 + Multi-stage)
`Dockerfile`을 생성하여 Next.js 애플리케이션을 컨테이너화했습니다. 호환성 문제를 해결하기 위해 Node 버전을 `20-alpine`으로 설정했습니다.

```dockerfile
# Dockerfile
FROM node:20-alpine AS base
# ... (중략: 멀티 스테이지 빌드 설정)
```

### B. Prisma 설정 수정 (`prisma/schema.prisma`)
Linux 환경(Cloud Run)에서 Prisma 클라이언트가 정상 작동하도록 `binaryTargets`를 추가했습니다.

```prisma
// prisma/schema.prisma
generator client {
  provider      = "prisma-client-js"
  // linux-musl-openssl-3.0.x: Alpine Linux용 바이너리
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}
```

### C. Next.js 빌드 설정 (`next.config.ts`)
Docker 이미지 크기를 줄이기 위해 `standalone` 모드를 활성화했습니다.

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: "standalone",
};
```

---

## 3. 배포 단계 (터미널 명령어)

터미널(PowerShell 또는 CMD)을 열고 프로젝트 루트(`c:\Users\jeong\repo\qou\qou-app`)에서 다음 명령어들을 순서대로 실행하면 배포를 재연할 수 있습니다.

### 단계 1: Google Cloud 인증 및 프로젝트 설정
```bash
# 1. 로그인 (브라우저 인증)
gcloud auth login

# 2. 프로젝트 선택
gcloud config set project qou-app-deploy-2026
```

### 단계 2: 필수 서비스 활성화 (최초 1회)
```bash
gcloud services enable cloudbuild.googleapis.com run.googleapis.com artifactregistry.googleapis.com
```

### 단계 3: Artifact Registry 저장소 생성 (최초 1회)
이미지를 저장할 저장소를 생성합니다. (이미 존재하면 건너뜀)
```bash
gcloud artifacts repositories create qou-app-repo \
    --repository-format=docker \
    --location=asia-northeast3 \
    --description="Qou App Repository"
```

### 단계 4: Cloud Build로 이미지 빌드 및 푸시
로컬 소스를 Cloud Build에 업로드하여 이미지를 빌드하고 레지스트리에 저장합니다.
```bash
gcloud builds submit --tag asia-northeast3-docker.pkg.dev/qou-app-deploy-2026/qou-app-repo/qou-app .
# 주의: 마지막의 . (현재 디렉토리)를 잊지 마세요!
```

### 단계 5: Cloud Run 서비스 배포
빌드된 이미지를 Cloud Run에 배포합니다. `DATABASE_URL` 환경변수를 함께 설정합니다.
*(주의: 실제 URL은 보안을 위해 `.env` 파일이나 Neon 대시보드에서 확인하세요)*

```bash
gcloud run deploy qou-app \
  --image asia-northeast3-docker.pkg.dev/qou-app-deploy-2026/qou-app-repo/qou-app:latest \
  --platform managed \
  --region asia-northeast3 \
  --allow-unauthenticated \
  --set-env-vars "DATABASE_URL=postgresql://neondb_owner:npg_ogO60awIjqrm@ep-late-heart-aebalfo6-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
```

## 4. 확인
배포가 완료되면 출력된 Service URL로 접속하여 확인합니다.
- **예상 URL**: `https://qou-app-[PROJECT_HASH].asia-northeast3.run.app`
