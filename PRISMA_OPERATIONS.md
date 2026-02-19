# Prisma 운영 가이드 (qou-app)

이 문서는 이 프로젝트에서 Prisma를 안전하게 운영하기 위한 표준 절차를 정리합니다.  
현재 저장소는 `prisma/migrations`를 사용하는 **마이그레이션 기반 운영**을 전제로 합니다.

## 1) 원칙

- 개발/테스트용 임시 반영이 아니라면 `prisma db push`를 기본 수단으로 쓰지 않습니다.
- 스키마 변경은 항상 마이그레이션 파일(SQL)로 남깁니다.
- 공유 DB(Neon 포함) 반영은 `prisma migrate deploy`만 사용합니다.

## 2) `db push` vs `migrate` 차이

- `prisma db push`
  - `schema.prisma`를 DB에 바로 동기화합니다.
  - 빠르지만 변경 이력(SQL migration)이 남지 않습니다.
  - 팀/운영 환경에서 추적성과 재현성이 떨어집니다.

- `prisma migrate dev` / `prisma migrate deploy`
  - 변경을 SQL migration 파일로 생성/관리합니다.
  - 코드 리뷰, 롤백 전략, 환경 간 일관성 유지에 유리합니다.

이 프로젝트의 기본값은 `migrate`입니다.

## 3) directUrl을 왜 써야 하나 (Neon 핵심)

Neon은 보통 두 종류의 연결 문자열을 제공합니다.

- `DATABASE_URL` (pooled, pgbouncer 경유)
  - 앱 런타임 쿼리에 적합
  - 연결 재사용/스케일링에 유리

- `DIRECT_DATABASE_URL` (직접 연결)
  - 마이그레이션 DDL 실행에 적합
  - pgbouncer 제약 없이 Prisma migration 엔진이 안정적으로 동작

Prisma는 `datasource`에 `url`과 `directUrl`을 분리해 둘 수 있습니다.  
운영 권장: 앱은 pooled URL을 쓰고, migration은 direct URL을 쓰게 분리합니다.

## 4) schema.prisma 권장 설정

`prisma/schema.prisma`의 `datasource db`를 아래처럼 구성합니다.

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}
```

## 5) 환경 변수 예시

`.env` 또는 배포 환경 변수에 아래를 설정합니다.

```env
# 앱 런타임(보통 pooled URL)
DATABASE_URL="postgresql://..."

# 마이그레이션/DDL용(직접 연결 URL)
DIRECT_DATABASE_URL="postgresql://..."
```

주의:
- 두 값을 같은 URL로 넣어도 동작은 가능하지만, Neon에서는 분리 권장입니다.
- 실제 URL 문자열은 Neon 대시보드에서 복사해 사용합니다.

## 6) 표준 변경 절차 (권장)

1. `prisma/schema.prisma` 수정
2. migration 파일 생성
3. 생성된 SQL 검토
4. 브랜치 PR 머지
5. 대상 DB(Neon)에 deploy

PowerShell 예시:

```powershell
# 1) migration 파일 생성 (로컬)
npx prisma migrate dev --name add_xxx

# 2) 상태 확인
npx prisma migrate status

# 3) 운영/공유 DB 반영
npx prisma migrate deploy
```

## 7) 이미 `db push`를 해버린 경우 복구

상황: DB는 이미 바뀌었는데, migration 이력이 없는 경우.

절차:

1. 동일한 변경에 대한 migration 파일을 생성 (`--create-only` 권장)
2. 해당 migration을 DB에 다시 실행하지 말고, 적용된 것으로 표시

```powershell
# migration 파일만 생성
npx prisma migrate dev --name <change_name> --create-only

# 이미 DB에 반영된 migration으로 기록만 맞춤
npx prisma migrate resolve --applied <timestamp>_<change_name>
```

그 후부터는 `migrate deploy` 흐름으로 복귀합니다.

## 8) 배포/CI 권장 명령

- 앱 배포 전(또는 배포 단계 초반) 실행:

```powershell
npx prisma migrate deploy
npx prisma generate
```

## 9) 이 프로젝트에서 기억할 점

- 현재 `prisma/migrations`가 존재하므로 migration 기반 운영이 맞습니다.
- seed는 필요 시 `package.json`의 Prisma seed 설정을 사용합니다.
- 운영 DB에서 구조 변경은 `db push` 대신 migration으로만 처리합니다.
