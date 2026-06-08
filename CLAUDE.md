# CLAUDE.md

이 파일은 Claude Code가 이 저장소를 처음 열었을 때 빠르게 맥락을 잡기 위한 가이드입니다.
일반적인 코드 구조는 README/소스 그 자체에서 읽고, 여기에는 **읽어도 모를 정보**(목표, 결정의 배경, 미해결 작업)만 적습니다.

> ⚠️ **2026-06-08 대전환**: 이 프로젝트는 **일본 시장(일본어) → 한국 시장(한국어)** 으로 운영 언어를 전환했습니다.
> 공개 사이트·SEO = **한국어**, 관리자 페이지 = **키릴 몽골어**. 과거의 일본어 기준 서술(SEO 목표, GSC 수치 등)은 모두 *전환 이전의 역사적 맥락*으로만 참고하세요. 자세한 내용은 §1, §6.4, §7(2026-06-08) 참조.

---

## 1. 프로젝트 정체

- **사이트**: [mongolryokou.com](https://mongolryokou.com) (도메인의 `ryokou`는 旅行의 일본어 로마자 — 일본 시절 잔재이며 사이트 내용은 현재 한국어)
- **상호(법인)**: 몽골리아 은하수 / Сүүнзам трэйд (몽골 현지 법인). 영문명 `Milkyway Japan`은 일본 시절 브랜드명, 한국어 표기 브랜드는 **몽골리아 은하수**
- **사업**: 몽골 현지 여행사 (B2C)
- **운영 언어**: **한국어** (관리자 페이지는 **키릴 몽골어**)
- **타겟 시장**: **한국** (일본/EN 페이지 없음)
- **통화**: 한국 원(₩/원, KRW)

> 과거(2026-06-08 이전): 일본인 대상, 운영 언어 일본어, 관리자만 한국어, 통화 엔(¥).

## 2. 비즈니스 목표 (SEO)

전환 후 목표:
> **Google 한국어 검색 「몽골여행」 관련 키워드(몽골투어, 고비사막 투어, 몽골 승마여행 등)에서 상위 노출.**

- `src/constants/seo.ts`, `index.html`의 키워드/메타가 한국어 키워드로 교체됨 (몽골여행, 몽골투어, 고비사막투어, 테렐지, 홉스굴, 울란바토르관광 등)
- **한국어 SEO는 사실상 새 출발**입니다. 새 GSC(Search Console) 데이터를 사용자에게 요청해 우선순위를 데이터 기반으로 정하세요.
- 전략(일반론): 롱테일 키워드(몽골 비자, 고비사막 투어 비용 등)부터 콘텐츠로 점령 → 신뢰도 누적 → 빅 키워드.

> 📜 **역사적 참고 — 일본어 시절 GSC 진단 (2026-05-02, 더 이상 유효하지 않음)**: 3개월 노출 346회, 평균 CTR 41.6%(대부분 브랜드 검색), 1위 키워드 "モンゴル旅行社". 일본어 빅 키워드는 거의 노출 안 됨. 이 수치는 일본어 사이트 기준이며 한국어 전환 후에는 리셋된 것으로 간주.

## 3. 기술 스택 핵심

- React 19 + TypeScript + Vite
- Cloudflare Pages (정적 호스팅) + Pages Functions (서버리스 API)
- D1 (SQLite, Cloudflare 관리형) + Drizzle ORM
- Tailwind CSS
- TanStack Query, react-i18next (i18n: 현재 **ko 단일 로케일**), react-helmet-async (SEO)
- 결제: PayPal + 은행 송금
- 챗: Channel Talk (지연 로딩, 언어 `ko`)
- 폰트: **Noto Sans KR** (구글 폰트) — 일본 시절 Noto Sans JP에서 교체

### i18n 구조 (전환 후)
- `src/i18n.ts`: `lng: 'ko'`, `fallbackLng: 'ko'`, 리소스 `ko`만 등록. `ja.json`은 삭제됨.
- `src/locales/ko.json`: 470개 키 완비.
- 공개 페이지는 `t()` + 일부 하드코딩 문자열 혼재. 전환 시 하드코딩 일본어를 전부 한국어로 번역함(§7).

## 4. 배포 워크플로 — **반드시 지킬 것**

`DEPLOYMENT.md`에 명시되어 있고 오너가 강조하는 규칙:

> **`main`에 직접 푸시 금지.** 항상 feature 브랜치 → PR → Cloudflare 미리보기 검증 → 머지.

- 머지 시 Cloudflare가 자동으로 운영 배포 (1~3분)
- 미리보기 URL 패턴: `https://<branch-slug>.milkyway-japan-axy.pages.dev`
  - 슬래시(`/`)는 하이픈으로 변환됨 (예: `fix/sitemap-categories` → `fix-sitemap-categories`)
- `https://milkyway-japan-axy.pages.dev` (브랜치 prefix 없음) = 운영 별칭(main 미러)
- 운영 도메인: `https://mongolryokou.com` (Cloudflare 캐시 1시간, max-age=3600)

검증 시 캐시 우회: `?bust=$(date +%s)` 쿼리 붙이거나 Cache-Control: no-cache 헤더.

### 저장소
- 원본: `https://github.com/arvijixmeat-maker/MILKYWAY-JAPAN.git`
- 한국어/몽골어 전환본 푸시: `https://github.com/Gantuu26/tripmongolia.git` (2026-06-08, `main`)

## 5. SEO 인프라 (한국어)

### 5.1 메타태그 / 구조화 데이터

| 위치 | 내용 |
|---|---|
| `index.html` | TravelAgency + WebSite JSON-LD, OG(`og:locale=ko_KR`), Twitter, hreflang(`ko`), pre-render SEO content(#root .pre-render-seo, 시각적으로 숨김 + 크롤러용). `lang="ko"`. 전부 한국어. |
| `src/components/seo/SEO.tsx` | 공통 SEO 컴포넌트. `htmlAttributes={{ lang: 'ko' }}`, `og:locale=ko_KR`, `og:site_name="몽골리아 은하수"`. `structuredData` prop으로 JSON-LD 다중 스키마 지원 |
| `src/constants/seo.ts` | `SITE_URL`, 한국어 기본 타이틀/디스크립션/키워드 (트레일링 슬래시 없음) |

### 5.2 페이지별 JSON-LD 현황

| 페이지 | 스키마 |
|---|---|
| `Home.tsx` | (index.html에 TravelAgency + WebSite) |
| `ProductDetail.tsx` | Product + TouristTrip + Offer/AggregateOffer + MerchantReturnPolicy + OfferShippingDetails + BreadcrumbList + aggregateRating/review (있을 때) |
| `TravelGuideDetail.tsx` | BlogPosting + BreadcrumbList |
| `CategoryPage.tsx` | CollectionPage + ItemList + BreadcrumbList |
| `TourProducts.tsx` | CollectionPage + ItemList + BreadcrumbList |
| `TravelGuide.tsx` | CollectionPage + ItemList + BreadcrumbList |
| `FAQ.tsx`, `About.tsx`, `UserReviews.tsx` | 각자 적절한 스키마 보유 |

> JSON-LD의 `inLanguage`, `currenciesAccepted`, `addressCountry` 등 일부 코드성 값은 전환 시 점검 대상 — 한국어 사이트 기준으로 맞출지 추후 확인.

### 5.3 Sitemap (`functions/sitemap.xml.ts`)

- 동적 생성. D1에서 products / categories / magazines를 읽음
- robots.txt에서 참조: `https://mongolryokou.com/sitemap.xml`
- xmlns:image 네임스페이스 선언됨

## 6. ⚠️ 주의해야 할 함정

### 6.1 categories 테이블에 `updated_at` / `created_at` 컬럼 **없음**

`migration_sql/create_all_tables.sql`의 `CREATE TABLE categories`는 시간 컬럼을 정의하지 않음.
이 때문에 `COALESCE(updated_at, created_at)` 같은 SQL이 통째로 실패하고,
sitemap.xml.ts의 try/catch가 에러를 조용히 삼켜서 카테고리 URL이 통째로 누락됐던 버그가 있었음(이미 수정됨).

→ **categories를 시간 기준으로 정렬/조회하지 말 것.** 필요하면 마이그레이션 먼저.

### 6.2 magazines 테이블 컬럼 분기

`functions/api/migrate-db.ts`에서 마이그레이션을 적용. 환경에 따라 `is_published` 또는 `is_active` 컬럼이 있을 수 있어 sitemap.xml.ts는 둘 다 fallback으로 시도함.

### 6.3 API 응답이 snake_case + camelCase 혼재

`/api/products`가 같은 데이터를 두 표기로 다 내려줌 (예: `mainImages`와 `main_images` 둘 다 존재). 프론트는 camelCase 위주로 쓰고, 함수 안에서 D1 직접 쿼리할 때만 snake_case가 나옴. 혼동 주의.

### 6.4 ⭐ 언어 정책 (2026-06-08 전환 핵심)

- **공개 사이트 = 한국어.** 새 문자열 추가 시 한국어 정중체로 작성.
- **관리자 페이지(`Admin*.tsx`, `src/components/admin/*`) = 키릴 몽골어.** 단, 다음은 예외로 **한국어/원본 값 유지**:
  - **공유 데이터 값**(카테고리·상태·지역·옵션 값 등 DB에 저장되거나 공개 사이트와 매칭되는 값)은 **한국어로 보존**. 몽골어로 바꾸면 공개 사이트/DB와 어긋나 기능이 깨짐.
  - **고객 대상 콘텐츠**(이메일 본문, 계약서/일정표/견적 템플릿 본문, 알림 메시지)는 **한국어**(고객이 한국어로 받기 때문).
  - 즉 관리자 = "UI 크롬은 몽골어, 데이터/고객 콘텐츠는 한국어".
- **남아있는 일본어(의도적)**: 공개 코드 일부에 일본어 문자열이 남아 있는데, 이는 **기존 DB 데이터(일본어로 저장된 상품·후기·기간 문자열 등)와 매칭하는 로직용**입니다(예: `duration.includes('泊')`, 지역 필터 keywordMap, `mongoliaPlaces.ts`의 `keywords`). 함부로 지우면 기존 데이터 매칭이 깨짐.
- **DB 콘텐츠는 아직 일본어**: 코드/UI는 한국어로 바뀌었지만, **운영 D1에 저장된 상품·매거진·FAQ 본문 등 실데이터는 여전히 일본어**입니다. 이건 관리자 페이지에서 **한국어로 재입력해야 하는 별도 데이터 작업**(코드 변경 아님).

### 6.5 채팅 위젯 (Channel Talk)

`index.html`에서 stub만 inline으로 로드하고, 실제 SDK는 `requestIdleCallback` 또는 5초 후 lazy load. LCP/TBT 보호. 절대 main bundle에 넣지 말 것. `ChannelIO('boot', { language: 'ko' })`.

## 7. 최근 작업 이력 (오너가 기억해야 할 것)

### 2026-06-08 — 한국어/몽골어 전환 (대규모)

브랜치 `feat/korean-mongolian-locale`, 커밋 `[전체]: 운영 사이트·SEO 한국어 전환, 관리자 페이지 키릴 몽골어 전환` (122개 파일). `Gantuu26/tripmongolia` `main`에 푸시됨.

- **i18n**: 기본 언어 ja→ko, `ja.json` 삭제, `ko.json` 누락 키 29개 보강 → 470키 완비
- **SEO 한국어화**: `index.html`(타이틀·메타·OG·Twitter·JSON-LD·hreflang·pre-render·`lang="ko"`), `SEO.tsx`, `seo.ts`
- **폰트**: Noto Sans JP → **Noto Sans KR** (index.html, tailwind.config.js, index.css, CalendarStyles.css, DestinationsMap.tsx)
- **공개 페이지 전수 번역**: 하드코딩 일본어 → 한국어 (약 60+ 파일). DB 매칭용 로직 문자열만 보존
- **관리자 전수 전환**: 한국어 → 키릴 몽골어 (19개 페이지 + admin 컴포넌트). 데이터 값/고객 콘텐츠는 한국어 보존(§6.4)
- **법무/문서**: `company.ts` 계약·약관·개인정보 문구 한국어화, `formatDate.ts` 한국어 전용 정리
- **부수 수정**: `AdminDashboard.tsx` 가이드 상태 비교를 죽은 코드 `'활동중'` → 실제 DB 값 `'active'`로 수정
- **검증**: `tsc --noEmit` 통과, `vite build` 통과
- **미처리(의도적/별도작업)**: ① 운영 DB 실데이터 일본어 → 한국어 재입력(오너 작업) ② JSON-LD의 `inLanguage`/통화/국가 코드 점검 ③ `docs/design-system/*` 문서가 아직 일본어 폰트·톤을 서술(아래 §9.5 참고)

### 2026-05-02 — (일본어 시절) SEO 작업 시리즈 *[역사적]*

- PR `fix/sitemap-categories`(머지): categories SQL 버그 수정으로 카테고리 URL 복구, 홈 트레일링 슬래시, privacy/terms sitemap 추가 (19→24 URL)
- PR `feat/seo-image-sitemap-and-list-jsonld`(머지): sitemap `xmlns:image` + `<image:image>`, XML 이스케이프, TourProducts/TravelGuide에 CollectionPage+ItemList+BreadcrumbList
- 매거진 5편 점검(모두 일본어 観光 카테고리), 일본어 콘텐츠 로드맵 — **모두 일본어 기준이라 한국어 전환 후 재수립 필요**

## 8. 다음에 이어 할 작업 (오픈된 스레드)

### 🔥 즉시 가능
1. **운영 DB 콘텐츠 한국어화** — 관리자 페이지에서 상품/매거진/FAQ 본문을 한국어로 재입력 (코드는 이미 한국어 UI)
2. **한국어 GSC 세팅/데이터 수집** — 새 시장 기준으로 노출 키워드 파악 후 콘텐츠 우선순위 결정
3. **`Gantuu26/tripmongolia` 배포 파이프라인 연결** — Cloudflare Pages 프로젝트/도메인 결정 (mongolryokou.com 유지 여부 포함)

### 🟠 중기
4. **이미지 alt 한국어 키워드 점검** — ProductDetail / TravelGuideDetail
5. **JSON-LD 코드성 값 점검** — `inLanguage`, `currenciesAccepted`(현재 일부 JPY 잔존 가능), `addressCountry`
6. **백링크/GBP** — 한국 여행 매체·블로그 협업, Google Business Profile

### 🟡 장기 (콘텐츠 채우기)
7. 한국어 매거진 콘텐츠 확장(준비/정보/관광/미식 카테고리). 기존 일본어 5편은 번역 또는 재작성.

## 9. 작업 시 따라야 할 규칙 (오너 명시)

- ✅ feature 브랜치 → PR → Cloudflare 미리보기 검증 → 머지
- ✅ **공개 사이트 = 한국어**, **관리자 = 키릴 몽골어** (단 데이터 값·고객 콘텐츠는 §6.4대로 한국어 보존)
- ✅ 커밋 메시지는 한국어로 (기존 스타일 유지: `[영역]: 설명`)
- ❌ `main` 직접 푸시 금지
- ❌ 운영 데이터/스키마 변경은 마이그레이션 통해서만 (`functions/api/migrate-db.ts`)

## 9.5. 디자인 시스템 — UI 작업 시 필독

UI 컴포넌트를 새로 만들거나 디자인을 변경하기 전에 다음 파일을 **반드시 먼저 읽을 것**:

- [`docs/design-system/SKILL.md`](docs/design-system/SKILL.md) — 핵심 원칙 요약 (1분)
- [`docs/design-system/README.md`](docs/design-system/README.md) — 색상/타입/간격/카드/카피 톤 풀 가이드
- [`docs/design-system/colors_and_type.css`](docs/design-system/colors_and_type.css) — 디자인 토큰 (Tailwind 설정과 일치)

> ⚠️ 이 `docs/design-system/*` 문서들은 아직 **일본어 폰트(Noto Sans JP)·일본어 카피 톤**을 서술하고 있어 **부분적으로 낡았습니다.** 실제 코드는 Noto Sans KR·한국어로 전환됨. 아래 핵심 원칙(전환 반영본)을 우선하세요.

핵심 원칙 (반드시 외워둘 것):
- **단일 primary 컬러: teal `#0f766e`.** 보조 색상 없음. 나머지는 슬레이트 뉴트럴.
- **모바일 우선, max-width 480px.** 데스크톱은 480px 컬럼 + soft shadow 프레임.
- **실사 사진** 위주. 그라데이션/일러스트 X.
- **Material Symbols Outlined** 일반 UI 아이콘 + **3D plasticine 아이콘**(assets/icons/) 숏컷 행 전용. 절대 직접 SVG 그리지 말 것.
- **카드**: `rounded-xl` (12px) + `1px slate-100 border` + `shadow-toss`.
- **Hero 배너**: `rounded-3xl` (24px) + 실사 사진 + 하단 보호 그라데이션.
- **이모지는 필터 칩 라벨에만.** 헤딩/CTA/상품명 X.
- **공개 사이트 카피는 한국어 정중체** (`~합니다` / `~해 주세요`). 1인칭 브랜드 호칭 X. **관리자 UI는 키릴 몽골어.**
- 폰트: **Noto Sans KR**.
- 가격 표기: `₩NNN,NNN~` (한국 원, 콤마, `~`).

## 10. 다른 환경에서 작업 이어가는 법

1. 저장소 클론: `git clone https://github.com/Gantuu26/tripmongolia.git` (또는 원본 `arvijixmeat-maker/MILKYWAY-JAPAN`)
2. 이 파일(CLAUDE.md) 읽고 맥락 파악 — 특히 §6.4 언어 정책
3. 최근 git log 확인: `git log --oneline -20`
4. `npm install` → `npm run dev` (로컬 http://localhost:5173). 단 로컬 vite dev는 Cloudflare Functions/D1 API를 안 띄워 동적 데이터는 로드 안 됨 — 동적 확인은 Cloudflare 미리보기 사용
5. **한국어 GSC 데이터 사용자에게 요청** — 작업 우선순위는 데이터 기반으로 결정
6. 작업 → feature 브랜치 → PR → 미리보기 URL 사용자에게 전달 → 사용자가 머지

---

마지막 업데이트: 2026-06-08 (한국어/몽골어 전환 반영)
