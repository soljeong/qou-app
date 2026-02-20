# 배포 가이드

이 문서는 qou-app을 Docker 이미지로 빌드하고 Google Cloud Run에 배포하는 절차를 설명합니다.

## 사전 준비

### 필수 도구
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (`gcloud` CLI)
- Node.js 20 이상, npm
- Docker (로컬 테스트 시)

### 프로젝트 정보

| 항목 | 값 |
| :--- | :--- |
| GCP Project ID | `qou-app-deploy-2026` |
| Region | `asia-northeast3` (Seoul) |
| Artifact Registry | `qou-app-repo` |
| Cloud Run Service | `qou-app` |
| Database | Neon PostgreSQL |

## 배포에 필요한 설정

### Dockerfile

멀티스테이지 빌드를 사용합니다. `node:20-alpine` 기반이며 Next.js의 `standalone` 출력을 활용합니다.

- `next.config.ts`에 `output: "standalone"` 설정 필요
- Prisma `binaryTargets`에 `linux-musl-openssl-3.0.x` 포함 필요 (Alpine Linux용)

### 환경 변수

Cloud Run 서비스에 다음 환경 변수를 설정해야 합니다.

| 변수 | 설명 |
| :--- | :--- |
| `DATABASE_URL` | Neon PostgreSQL pooled URL |
| `AUTH_GOOGLE_ID` | Google OAuth 클라이언트 ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth 클라이언트 시크릿 |
| `AUTH_SECRET` | NextAuth 시크릿 키 |

> `DIRECT_DATABASE_URL`은 마이그레이션 실행 시에만 필요하며 Cloud Run에는 설정하지 않아도 됩니다.

## 배포 단계

### 1. Google Cloud 인증 및 프로젝트 설정

```bash
gcloud auth login
gcloud config set project qou-app-deploy-2026
```

### 2. 필수 서비스 활성화 (최초 1회)

```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com
```

### 3. Artifact Registry 저장소 생성 (최초 1회)

```bash
gcloud artifacts repositories create qou-app-repo \
  --repository-format=docker \
  --location=asia-northeast3 \
  --description="Qou App Repository"
```

### 4. 이미지 빌드 및 푸시

Cloud Build를 사용하여 원격에서 빌드합니다.

```bash
gcloud builds submit \
  --tag asia-northeast3-docker.pkg.dev/qou-app-deploy-2026/qou-app-repo/qou-app \
  .
```

### 5. Cloud Run에 배포

```bash
gcloud run deploy qou-app \
  --image asia-northeast3-docker.pkg.dev/qou-app-deploy-2026/qou-app-repo/qou-app:latest \
  --platform managed \
  --region asia-northeast3 \
  --allow-unauthenticated \
  --set-env-vars "DATABASE_URL=<pooled-url>" \
  --set-env-vars "AUTH_GOOGLE_ID=<client-id>" \
  --set-env-vars "AUTH_GOOGLE_SECRET=<client-secret>" \
  --set-env-vars "AUTH_SECRET=<secret>"
```

배포가 완료되면 서비스 URL이 출력됩니다.

### 6. 데이터베이스 마이그레이션

Cloud Run 배포 후 DB 스키마를 최신 상태로 맞추려면 로컬에서 마이그레이션을 실행합니다.

```bash
# DIRECT_DATABASE_URL이 .env에 설정되어 있어야 합니다
npx prisma migrate deploy
```

## 로컬 Docker 테스트

```bash
# 이미지 빌드
docker build -t qou-app .

# 컨테이너 실행
docker run -p 3000:3000 \
  -e DATABASE_URL="<your-database-url>" \
  -e AUTH_GOOGLE_ID="<your-client-id>" \
  -e AUTH_GOOGLE_SECRET="<your-client-secret>" \
  -e AUTH_SECRET="<your-secret>" \
  qou-app
```

`http://localhost:3000`에서 확인합니다.

## Prisma 운영 참고사항

### db push vs migrate

이 프로젝트는 **마이그레이션 기반 운영**을 사용합니다.

| 명령어 | 용도 | 이력 |
| :--- | :--- | :--- |
| `prisma db push` | 개발 중 빠른 동기화 | 남지 않음 |
| `prisma migrate dev` | 마이그레이션 생성 + 적용 | SQL 파일로 남음 |
| `prisma migrate deploy` | 운영 DB에 마이그레이션 적용 | SQL 파일 기반 |

운영 DB 스키마 변경은 항상 `migrate dev` → `migrate deploy` 순서로 진행합니다.

### Neon URL 분리

Neon은 두 종류의 연결 URL을 제공합니다.

- **Pooled URL** (`DATABASE_URL`): 앱 런타임 쿼리용. pgbouncer를 경유하여 연결을 재사용합니다.
- **Direct URL** (`DIRECT_DATABASE_URL`): 마이그레이션/DDL용. pgbouncer 제약 없이 Prisma migration 엔진이 안정적으로 동작합니다.

`prisma/schema.prisma`에서 `url`과 `directUrl`을 분리하여 설정되어 있습니다.

### 스키마 변경 절차

```bash
# 1. schema.prisma 수정

# 2. 마이그레이션 생성 (로컬)
npx prisma migrate dev --name <변경_설명>

# 3. 생성된 SQL 확인 (prisma/migrations/ 하위)

# 4. 코드 커밋 및 머지

# 5. 운영 DB에 적용
npx prisma migrate deploy
```

### 이미 db push로 적용한 경우 복구

DB에는 반영되었지만 마이그레이션 이력이 없는 경우:

```bash
# 마이그레이션 파일만 생성 (실행하지 않음)
npx prisma migrate dev --name <변경명> --create-only

# 이미 적용된 것으로 기록
npx prisma migrate resolve --applied <timestamp>_<변경명>
```
