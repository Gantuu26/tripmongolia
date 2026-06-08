# Trip Mongolia — 신규 사이트 배포 가이드

기존 `milkyway-japan`(라이브 일본어 사이트)과 **완전히 분리된** 새 Cloudflare 환경에
Trip Mongolia(한국어)를 배포하는 절차입니다.

- 코드 저장소: `https://github.com/Gantuu26/tripmongolia` (`main`)
- 새 리소스: D1 `tripmongolia-db`, R2 `tripmongolia-assets`, Pages `tripmongolia`
- 관리자 계정: `gantumaidar@gmail.com` (비밀번호는 `migration_sql/seed_admin.sql`의 해시 기준 — 기존 값 유지)

---

## ⚠️ 먼저: wrangler 인증

현재 이 환경의 `wrangler`는 권한이 부족합니다(`account(read)`만, API 호출 시 `code 10000`).
아래 중 하나로 **유효한 인증**을 먼저 만드세요.

**방법 A — 대화형 로그인 (가장 쉬움)**
```bash
npx wrangler login
```
브라우저가 열리면 Trip Mongolia를 운영할 Cloudflare 계정으로 로그인 후 권한 허용.

**방법 B — API 토큰**
Cloudflare 대시보드 → My Profile → API Tokens → Create Token. 다음 권한 포함:
`Account: D1 Edit`, `Account: Workers R2 Storage Edit`, `Account: Cloudflare Pages Edit`, `User: Memberships Read`.
```powershell
$env:CLOUDFLARE_API_TOKEN = "<생성한 토큰>"
```

확인: `npx wrangler whoami` 가 계정/이메일을 정상 출력하면 OK.

---

## 1. D1 데이터베이스 생성 + 스키마/시드 적용

```bash
# 1) 새 D1 생성 → 출력된 database_id 복사
npx wrangler d1 create tripmongolia-db

# 2) wrangler.toml 의 database_id = "REPLACE_WITH_NEW_D1_ID" 를 복사한 값으로 교체

# 3) 스키마 + 관리자 + 한국어 시드 적용 (--remote = 운영 D1)
npx wrangler d1 execute tripmongolia-db --remote --file=./migration_sql/create_all_tables.sql
npx wrangler d1 execute tripmongolia-db --remote --file=./migration_sql/seed_admin.sql
npx wrangler d1 execute tripmongolia-db --remote --file=./migration_sql/seed_korean_content.sql

# 확인
npx wrangler d1 execute tripmongolia-db --remote --command "SELECT id, name FROM products;"
```

## 2. R2 버킷 생성 (이미지 업로드용)

```bash
npx wrangler r2 bucket create tripmongolia-assets
```

## 3. 빌드 & Pages 배포

**방법 A — CLI 직접 배포**
```bash
npm install
npm run build
npx wrangler pages deploy dist --project-name tripmongolia
```
→ 첫 배포 시 프로젝트가 생성되고 `https://tripmongolia.pages.dev` 형태 URL이 나옵니다.

**방법 B — GitHub 연동 (자동 배포 권장)**
Cloudflare 대시보드 → Workers & Pages → Create → Pages → Connect to Git →
`Gantuu26/tripmongolia` 선택. 빌드 설정:
- Build command: `npm run build`
- Build output directory: `dist`
이후 `main`에 푸시할 때마다 자동 배포됩니다.

## 4. 바인딩 & 환경변수 연결 (Pages 프로젝트 설정 → Settings → Functions / Variables)

- **D1 database binding**: 변수명 `DB` → `tripmongolia-db`
- **R2 bucket binding**: 변수명 `BUCKET` → `tripmongolia-assets`
- **환경변수**: `ENVIRONMENT=production`, `ADMIN_EMAIL=gantumaidar@gmail.com`
- (필요 시) PayPal/이메일 등 시크릿: `npx wrangler pages secret put <NAME> --project-name tripmongolia`

> `wrangler.toml`에 D1/R2 바인딩이 이미 정의돼 있어, CLI 배포(방법 A)는 자동 적용됩니다.
> GitHub 연동(방법 B)은 대시보드에서 한 번 더 바인딩을 지정해야 할 수 있습니다.

## 5. 증분 마이그레이션 실행

배포 후 한 번:
```
https://<배포URL>/api/migrate-db
```
브라우저로 열면 추가 컬럼 마이그레이션이 적용됩니다(멱등 — 여러 번 실행 안전).

## 6. 동작 확인

- 공개: `https://<배포URL>/` — 한국어 + Airbnb 색상, 시드 상품 4개 노출
- 관리자: `https://<배포URL>/admin` — 키릴 몽골어, `gantumaidar@gmail.com`로 로그인

---

## 7. 커스텀 도메인 & SEO (선택)

`index.html`·`src/constants/seo.ts`·`functions/sitemap.xml.ts`의 canonical/URL이
현재 `https://mongolryokou.com` 로 하드코딩돼 있습니다. **새 도메인을 쓸 경우** 이 값들을
새 도메인으로 교체해야 정확한 canonical/sitemap이 생성됩니다. (도메인 확정되면 알려주세요 — 일괄 교체해 드립니다.)

도메인 연결: Pages 프로젝트 → Custom domains → 도메인 추가 후 DNS 안내대로 설정.

---

## 8. Google Search Console (한국어)

1. [search.google.com/search-console](https://search.google.com/search-console) → 속성 추가
   - 도메인 전체를 쓸 거면 **도메인 속성**(DNS TXT 인증), 특정 URL이면 **URL 접두어 속성**.
2. **소유권 인증**:
   - `index.html`의 `<meta name="google-site-verification" ...>` 값은 **기존(구 사이트) 토큰**입니다.
     새 속성에서 발급한 **새 토큰**으로 교체하세요(또는 DNS TXT 방식 사용). → 교체 코드 필요하면 토큰 주시면 반영해 드립니다.
3. **사이트맵 제출**: Search Console → Sitemaps → `https://<도메인>/sitemap.xml` 제출.
4. 색인 요청: 주요 페이지 URL 검사 → 색인 생성 요청.

> GSC는 구글 계정 로그인이 필요해 제가 대신 실행할 수 없습니다. 위 1~4는 직접 진행해 주세요.
> 사이트 쪽 준비(메타 태그 교체, sitemap URL 정정)는 도메인/토큰 주시면 바로 처리합니다.

---

## 현재 상태 요약 (2026-06-08)

- [x] 코드: 한국어 공개 + 키릴 몽골어 관리자 + Airbnb 색상 + Trip Mongolia 브랜드 (`main` 푸시 완료)
- [x] `wrangler.toml` → tripmongolia 리소스로 갱신 (database_id만 채우면 됨)
- [x] 한국어 시드 SQL 준비 (`migration_sql/seed_korean_content.sql`)
- [ ] **D1/R2/Pages 생성·배포** — wrangler 재인증 후 §1~5 실행 (또는 대시보드)
- [ ] **GSC** — §8 (구글 계정 필요)
- [ ] **커스텀 도메인** — 확정 후 SEO URL 일괄 교체
