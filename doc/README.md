# Qou-App 문서 인덱스

> **Qou-App** — 소규모 사업자를 위한 견적서(Quote) 관리 웹 애플리케이션 기술 문서

모든 다이어그램은 [D2 언어](https://d2lang.com)로 작성되었습니다.
VS Code에서는 [D2 Extension](https://marketplace.visualstudio.com/items?itemName=terrastruct.d2)을 사용하면 렌더링이 가능합니다.

---

## 문서 목록

| 문서 | 설명 |
|------|------|
| [overview.md](./overview.md) | 전체 아키텍처, 기술 스택, 디렉토리 구조, 핵심 비즈니스 로직 |
| [class-diagram.md](./class-diagram.md) | UML 클래스 다이어그램 (도메인 모델, 컴포넌트 계층, Server Actions) |
| [database.md](./database.md) | SQL 테이블 설계, ERD, 인덱스/제약조건, CRUD 흐름 |
| [sequence-diagrams.md](./sequence-diagrams.md) | 시퀀스 다이어그램 (목록 조회, 생성, 수정, PDF 다운로드, 붙여넣기) |

---

## 빠른 시작

```bash
# 1. Docker Compose로 DB + App 실행
cd qou/
docker compose up

# 2. DB 마이그레이션
docker exec -it <app_container> npx prisma migrate dev

# 3. 시드 데이터 삽입 (Excel 기반)
docker exec -it <app_container> npm run seed:excel

# 4. 브라우저에서 접속
# http://localhost:3000/quotes
```

---

## 핵심 개념 요약

- **견적번호**: `ES-YYMM-MMSEQ-YEARSEQ` 형식으로 자동 생성
- **금액 계산**: `소계 → 할인 → 공급가액 → VAT(10%) → 최종합계`
- **품목 수정**: 기존 전체 삭제 후 재삽입 (Replace Pattern, Prisma Transaction)
- **PDF 생성**: HTML→PNG→PDF (기본) / @react-pdf 네이티브 (뷰어 페이지)
- **미리보기 템플릿**: 전통형 / 현대형 / 실무형 (3종)
