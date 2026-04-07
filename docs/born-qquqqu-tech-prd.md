# Born ★ qquqqu — Tech PRD
**Technical Product Requirements Document**
Version 2.0 | 2025. 04

---

## 1. 문서 개요

| 항목 | 내용 |
|------|------|
| 문서 유형 | Tech PRD (기술 요구사항 정의서) |
| 대상 독자 | 프론트엔드 개발자, 백엔드 개발자, DevOps |
| 프로젝트 | Born ★ qquqqu — 빈티지 포토부스 웹앱 |
| 현재 상태 | HTML Prototype (Single File) → Production 전환 |
| v2 변경사항 | 영상 녹화 모드 추가 / 어드민 PNG 프레임 시스템 / 카메라 에러 핸들링 강화 |

---

## 2. 기술 스택

### 2.1 프론트엔드

| 분류 | 기술 | 선택 이유 |
|------|------|-----------|
| Framework | React + TypeScript | 컴포넌트 재사용, 타입 안전성 |
| Bundler | Vite | 빠른 HMR, 경량 번들 |
| Styling | Tailwind CSS | 유틸리티 우선, 빠른 UI 제작 |
| Canvas | HTML5 Canvas API | 포토스트립 이미지 합성 |
| Camera | MediaDevices.getUserMedia | 브라우저 카메라 접근 |
| Video | MediaRecorder API | 3초 영상 클립 녹화 |
| Storage | localStorage / IndexedDB | 어드민 PNG 프레임 캐싱 |
| File | File API + FileReader | 앨범 사진 불러오기 |

### 2.2 백엔드 (Phase 2)

| 분류 | 기술 | 역할 |
|------|------|------|
| Runtime | Node.js + Express | API 서버 |
| Database | PostgreSQL | 프레임 메타데이터, 어드민 계정 |
| Storage | AWS S3 / Cloudflare R2 | 프레임 PNG 파일 저장 |
| Auth | JWT + bcrypt | 어드민 인증 |
| CDN | Cloudflare | 프레임 이미지 배포 |

### 2.3 인프라

- 호스팅: Vercel (프론트) / Railway or Render (백엔드)
- CI/CD: GitHub Actions
- 모니터링: Sentry
- Analytics: Mixpanel or PostHog

---

## 3. 캔버스 렌더링 명세

### 3.1 레이어 렌더 순서

```
① 배경 패턴/색상   — 캔버스 전체 (OUTER 여백 포함)
② 프레임 카드      — OUTER(30px) 안쪽, roundRect clip
③ 사진             — 각 셀 clip 후 drawImageCover() 적용
④ PNG 오버레이     — (Phase 2) 최상단, 알파채널 포함
⑤ 워터마크         — 하단 중앙, opacity 0.2
```

### 3.2 캔버스 사이즈

| 레이아웃 | 캔버스 전체 | OUTER | 프레임 카드 | 셀 크기 |
|----------|-------------|-------|-------------|---------|
| 1×4 | 396 × 1074px | 30px | 336 × 1014px | 312 × 234px (4:3) |
| 2×2 | 692 × 906px | 30px | 632 × 846px | 300 × 400px (3:4) |

### 3.3 셀 절대 좌표 (캔버스 기준)

**1×4** (pad=14, gap=5)

| 셀 | x | y | w | h |
|----|---|---|---|---|
| 1번 | 44 | 66 | 312 | 234 |
| 2번 | 44 | 305 | 312 | 234 |
| 3번 | 44 | 544 | 312 | 234 |
| 4번 | 44 | 783 | 312 | 234 |

**2×2** (pad=16, gap=6)

| 셀 | x | y | w | h |
|----|---|---|---|---|
| 좌상 | 46 | 70 | 300 | 400 |
| 우상 | 352 | 70 | 300 | 400 |
| 좌하 | 46 | 476 | 300 | 400 |
| 우하 | 352 | 476 | 300 | 400 |

### 3.4 PNG 프레임 오버레이 제작 가이드 (Phase 2)

| 항목 | 1×4 | 2×2 |
|------|-----|-----|
| 전체 크기 | **396 × 1074px** | **692 × 906px** |
| 포맷 | PNG-24 (알파채널 필수) | PNG-24 (알파채널 필수) |
| 사진 셀 영역 | alpha = 0 (완전 투명) | alpha = 0 (완전 투명) |
| 최대 파일 크기 | 5MB | 5MB |
| 렌더 타이밍 | 사진 합성 완료 후 최상단 | 사진 합성 완료 후 최상단 |

### 3.5 핵심 렌더 함수

```javascript
// 비율 유지 중앙 크롭 (CSS object-fit:cover 동일)
drawImageCover(ctx, img, x, y, w, h)

// 캔버스 전체에 배경 타일링
drawBgFull(ctx, x, y, w, h)

// 프레임 카드 내부 패턴 (heart / dot / star)
drawStripPattern(ctx, x, y, w, h, bg, color, type)
```

---

## 4. 카메라 & 영상 녹화 명세

### 4.1 카메라 초기화 전략

```javascript
// 1순위: 전면 카메라 HD
getUserMedia({
  video: { facingMode:'user', width:{ideal:1280}, height:{ideal:720} },
  audio: true   // 영상 녹화용 마이크 포함
})

// 실패 시 2순위: 기본 카메라 폴백
getUserMedia({ video: true, audio: true })
```

- **HTTPS / localhost** 환경에서만 동작 (브라우저 보안 정책)
- 미러링: CSS `transform: scaleX(-1)` + Canvas 캡처 시 좌우 반전

### 4.2 카메라 에러 핸들링

| 에러 | 원인 | 사용자 안내 |
|------|------|-------------|
| NotAllowedError | 권한 거부 | 주소창 자물쇠 → 카메라 허용 방법 |
| NotFoundError | 카메라 없음 | 기기 카메라 연결 확인 |
| NotReadableError | 다른 앱 사용 중 | 다른 앱 종료 후 재시도 |
| OverconstrainedError | 설정 미지원 | 재시도 유도 |
| Protocol Error | HTTP 환경 | HTTPS/localhost 접속 안내 |
| API 미지원 | 구형 브라우저 | Chrome 최신 버전 권장 |

→ 에러 발생 시 카메라 뷰 위에 오버레이 + **다시 시도** 버튼 표시

### 4.3 영상 녹화 (MediaRecorder API)

**코덱 우선순위:**
```
1순위: video/webm;codecs=vp9
2순위: video/webm
3순위: video/mp4
```

**녹화 플로우:**
```
Capture 탭
  → 3초 카운트다운 (카메라 뷰 내부)
  → MediaRecorder.start()
  → REC 인디케이터 + 초 카운트 표시
  → 3000ms 후 자동 stop
  → Blob 수집 → videoClips[] 저장
  → 4개 완료 시 결과 화면 이동
```

**영상 결과 렌더링:**
- `URL.createObjectURL(blob)` → `<video>` 태그
- 속성: `autoplay loop muted playsinline`
- 미러링: `transform: scaleX(-1)`
- 저장: 각 클립 개별 `.webm` / `.mp4` 파일로 다운로드

---

## 5. 어드민 시스템 (Phase 2)

### 5.1 시스템 구조

```
[어드민 브라우저]
      ↓ HTTPS + JWT
[Admin API Server (Express)]
      ↓              ↓
[PostgreSQL]   [S3 / R2 Storage]
                      ↓ CDN (Cloudflare)
              [사용자 브라우저에서 PNG 로드]
```

### 5.2 PNG 업로드 플로우

```
어드민 → PNG 파일 선택
  → 클라이언트 검증 (확장자, 5MB 이하, 사이즈 확인)
  → S3 업로드 → CDN URL 발급
  → PostgreSQL frame 레코드 저장
  → GET /api/frames 응답에 포함
  → 사용자 화면 프레임 목록에 노출
```

### 5.3 데이터 모델

**frames 테이블**

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 프레임 고유 ID |
| name | VARCHAR(50) | 노출 이름 (한글 가능) |
| layout | ENUM('1x4','2x2','both') | 지원 레이아웃 |
| png_url_1x4 | TEXT | 1×4 PNG CDN URL |
| png_url_2x2 | TEXT | 2×2 PNG CDN URL |
| thumbnail_url | TEXT | 썸네일 URL |
| is_active | BOOLEAN | 사용자 노출 여부 |
| sort_order | INTEGER | 정렬 순서 |
| created_at | TIMESTAMP | 등록일시 |
| updated_at | TIMESTAMP | 수정일시 |

**admins 테이블**

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 어드민 ID |
| email | VARCHAR(100) | 로그인 이메일 |
| password_hash | TEXT | bcrypt 해시 |
| role | ENUM('super','editor') | 권한 레벨 |
| created_at | TIMESTAMP | 생성일시 |

### 5.4 API 명세

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | /api/admin/login | 로그인 → JWT 발급 | 불필요 |
| GET | /api/frames | 활성 프레임 목록 조회 | 불필요 |
| GET | /api/admin/frames | 전체 목록 (비활성 포함) | JWT |
| POST | /api/admin/frames | 프레임 신규 등록 | JWT |
| PUT | /api/admin/frames/:id | 프레임 정보 수정 | JWT |
| PATCH | /api/admin/frames/:id/toggle | 활성/비활성 토글 | JWT |
| DELETE | /api/admin/frames/:id | 프레임 삭제 | JWT |
| POST | /api/admin/frames/:id/upload | PNG 업로드 (S3) | JWT |

---

## 6. 성능 요구사항

| 지표 | 목표 | 측정 기준 |
|------|------|-----------|
| 포토스트립 생성 | < 2초 | buildStripCanvas() 실행 시간 |
| 카메라 초기화 | < 1.5초 | getUserMedia() 응답 |
| 앨범 사진 로드 (4장) | < 1.5초 | FileReader 완료 |
| 영상 결과 화면 렌더 | < 500ms | Blob → ObjectURL |
| PNG 프레임 로드 | < 500ms | CDN 캐시 기준 |
| 초기 로딩 (LCP) | < 2.5초 | Lighthouse |

---

## 7. 브라우저 지원

| 환경 | 지원 | 비고 |
|------|------|------|
| Chrome Android | ✅ 필수 | 주요 타겟, MediaRecorder 완전 지원 |
| Safari iOS 15+ | ✅ 필수 | MediaRecorder 지원, 권한 UX 상이 |
| Samsung Internet | ✅ 권장 | Android 기본 브라우저 |
| Chrome Desktop | ✅ 지원 | 어드민 주요 환경 |
| Firefox | ⚠️ 부분 | roundRect 폴리필 필요 |
| IE11 | ❌ 미지원 | Canvas / MediaRecorder 미지원 |

---

## 8. 보안

- 카메라/마이크: 사용자 명시적 권한 요청 필수, 에러별 안내
- 사진/영상: 서버 미전송, 클라이언트 내 처리
- 어드민 JWT: 만료 24h, Refresh Token (Phase 2)
- PNG 업로드: 확장자·MIME·크기(5MB) 서버사이드 검증
- CORS: 어드민 API 허용 Origin 화이트리스트
