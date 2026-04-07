# Born ★ qquqqu — UX/UI PRD
**User Experience & Interface Design Requirements**
Version 2.0 | 2025. 04

---

## 1. 디자인 시스템

### 1.1 컬러 팔레트

| 역할 | 토큰명 | HEX | 사용처 |
|------|--------|-----|--------|
| Primary | --acc | `#2EC27E` | 버튼, 선택 상태, 액센트 |
| Primary Light | --acc-light | `#E8F8F0` | 카드 배경, 호버 |
| Primary Mid | --acc-mid | `#A8E6C8` | 프레임 미리보기 슬롯 |
| Primary Dark | --acc-dark | `#1A9E5E` | 버튼 호버 |
| Background | --bg | `#F4FAF6` | 전체 페이지 배경 (시작화면 포함) |
| Surface | --card | `#FFFFFF` | 카드, 입력 영역 |
| Text Primary | --txt | `#1A2E24` | 제목, 본문 |
| Text Secondary | --txt2 | `#4A6358` | 보조 텍스트, 뒤로가기 |
| Text Muted | --muted | `#8AAA96` | 힌트, 비활성, 서브타이틀 |
| Border | --border | `#DDE3E5` | 구분선, 카드 테두리 |
| Shadow | — | `rgba(46,194,126,.10)` | 카드 그림자 |
| Error | — | `#FF3B30` | REC 도트, 삭제 핸들 |

### 1.2 타이포그래피

| 용도 | 폰트 | 크기 | 굵기 |
|------|------|------|------|
| 디스플레이 타이틀 | Playfair Display | 40~66px | 900 |
| 섹션 제목 | Noto Sans KR | 18~22px | 700 |
| 카운터 강조 | Noto Sans KR | 26~38px | 900 |
| 본문 | Noto Sans KR | 13~15px | 400 |
| 보조 텍스트 | Noto Sans KR | 11~13px | 400 |
| 버튼 | Noto Sans KR | 13~17px | 700 |
| 캡션 / 레이블 | Noto Sans KR | 11~12px | 500 |

### 1.3 컴포넌트 스펙

**버튼**

| 타입 | 배경 | 텍스트 | 반경 | 패딩 |
|------|------|--------|------|------|
| Primary | `#2EC27E` | `#FFFFFF` | 16px | 16px, full width |
| Outline | `#FFFFFF` + border 1.5px | `#1A2E24` | 16px | 15px, full width |
| Skip | `#E8F8F0` + border | `#1A9E5E` | 40px | 11px, full width |
| Back | transparent | `#4A6358` | 0 | 0 |
| Mode Toggle Active | `#FFFFFF` + shadow | `#1A9E5E` | 40px | 7px 16px |
| Mode Toggle Inactive | transparent | `#8AAA96` | 40px | 7px 16px |

**카드**
```
background: #FFFFFF
border: 1px solid #DDE3E5
border-radius: 20px
box-shadow: 0 2px 16px rgba(46,194,126,.10)

선택 상태:
  border: 2px solid #2EC27E
  background: #E8F8F0
```

**모드 토글 컨테이너**
```
background: #DDE3E5 (--border)
border-radius: 40px
padding: 3px
display: flex
```

---

## 2. 화면별 UX 명세

### 2.1 시작 화면 (Landing)

| 요소 | 스펙 |
|------|------|
| 배경 | `#F4FAF6` |
| 배경 별 | 40개, 랜덤 위치, `#C8E6D4`, twinkle 애니메이션 |
| 타이틀 | "Born ★ qquqqu" — Playfair Display 900, ★ 8s 무한 회전 |
| 서브타이틀 | "Vintage photobooth with custom backgrounds" — muted |
| CTA | "Enter" — Primary 버튼, 가로 52px 패딩 |
| 레이아웃 | 수직 중앙 정렬, `position: fixed; inset: 0` |
| 진입 애니메이션 | fadeUp: `opacity 0→1` + `translateY 20px→0`, 0.35s ease |

### 2.2 레이아웃 선택

| 요소 | 스펙 |
|------|------|
| 레이아웃 | 2열 카드 그리드, gap 14px, max-width 340px |
| 1×4 미리보기 | 56×36px 슬롯 4개 세로 스택, 색상 `#A8E6C8` |
| 2×2 미리보기 | 2×2 그리드, 각 셀 height 58px, 색상 `#A8E6C8` |
| 기본 선택 | 1×4 선택 상태로 진입 |

### 2.3 프레임 선택

| 요소 | 스펙 |
|------|------|
| 인터랙션 | 캐러셀: 좌우 화살표 + 하단 도트 |
| 중앙 카드 | `scale(1)`, `opacity: 1`, `box-shadow: 0 0 0 3px #2EC27E` |
| 사이드 카드 | `scale(0.72)`, `opacity: 0.4` |
| 전환 | `transform 0.3s, opacity 0.3s` |
| 패턴 프레임 | Canvas로 실제 패턴(♥/●/★) 미리보기 렌더링 |
| 도트 인디케이터 | active: `scale(1.3)` + `#2EC27E` |

### 2.4 배경 선택

| 요소 | 스펙 |
|------|------|
| 섹션 구성 | 건너뛰기 → 별 배경(6) → 하트 배경(6) → 단색(6) → 없음 → 업로드 |
| 그리드 | 3열, gap 8px |
| 썸네일 | aspect-ratio 4:3, border-radius 12px |
| 선택 상태 | `border: 2px solid #2EC27E` |
| 업로드 | 점선 테두리 버튼, 탭 시 파일 선택 |

### 2.5 사진 등록 방법 선택

| 요소 | 스펙 |
|------|------|
| 레이아웃 | 2열 카드 그리드 |
| 직접 촬영 카드 | 📷 아이콘 44px + "직접 촬영" + "카메라로 4장 찍기" |
| 앨범 카드 | 🖼️ 아이콘 44px + "앨범에서 선택" + "사진 4장 불러오기" |
| 앨범 구현 | `input[type=file]`을 카드 내 `position:absolute; inset:0`으로 배치 |
| 로딩 | 처리 중 전체화면 오버레이 + 🖼️ + "사진 불러오는 중..." |

### 2.6 카메라 화면

| 요소 | 스펙 |
|------|------|
| **모드 토글** *(신규)* | 📷 사진 / 🎬 영상 3초 — 상단 pill 토글 |
| 프로그레스 | 4개 도트, 28×6px, 완료 장수만큼 `#2EC27E` fill |
| 카운터 | "1 / 4" — Noto Sans KR 900 |
| 카메라 뷰 | max-width 420px, aspect-ratio 4:3, border-radius 20px |
| 미러링 | CSS `transform: scaleX(-1)` |
| 카운트다운 | 카메라 뷰 내부 absolute, 흰 숫자, 그림자, **블러 없음** |
| 플래시 | white overlay `opacity 1→0`, 0.45s ease-out |
| 필터 탭 | 사진 모드만 노출 (B&W / Y2K / 기본) |
| **REC 인디케이터** *(신규)* | 좌상단, `rgba(0,0,0,.5)` 반투명 pill, 🔴 깜빡이는 도트 + "REC" + 초 카운트 |

**모드별 Capture 버튼 텍스트**

| 모드 | 버튼 텍스트 |
|------|------------|
| 사진 | `Capture` |
| 영상 (대기) | `● 녹화 시작` |
| 영상 (녹화 중) | `녹화 중...` (비활성) |

**카메라 에러 오버레이** *(신규)*
- 카메라 뷰 위에 `rgba(10,20,15,.92)` 오버레이
- 에러 원인별 안내 문구 (줄바꿈 포함)
- **다시 시도** 버튼 (Primary 소형)

### 2.7 결과 화면

| 요소 | 스펙 |
|------|------|
| 레이아웃 | `height: 100dvh`, flex column, 스크롤 없음 |
| 이미지 영역 (사진) | `flex: 1`, `object-fit: contain`, `border-radius: 16px` |
| 영상 영역 *(신규)* | `flex: 1`, 프레임 카드 래퍼 안에 비디오 그리드 |
| 영상 재생 | `autoplay loop muted playsinline`, `transform: scaleX(-1)` |
| 저장 버튼 | 사진: "저장하기" / 영상: "영상 저장" |
| 공유 버튼 | Outline, flex:1 |
| 처음으로 | Outline full width, 13px |

---

## 3. 모션 & 애니메이션

| 요소 | 애니메이션 | 시간 | 이징 |
|------|-----------|------|------|
| 화면 전환 | fadeUp (opacity + translateY 20px) | 0.35s | ease |
| Primary 버튼 호버 | translateY(-2px) + shadow 증가 | 0.15s | ease |
| 버튼 탭 | scale(0.97~0.98) | 0.12s | ease |
| 로고 ★ | 360° 무한 회전 | 8s | linear |
| 별 배경 | opacity .25↔.7 + scale 1↔1.2 | 3~7s | ease-in-out |
| 카운트다운 | scale 1.8→1→0.6 + opacity | 0.9s | ease |
| 프레임 카드 | scale + opacity | 0.3s | ease |
| 도트 활성화 | scale(1.3) + 색상 | 0.2s | ease |
| 플래시 | opacity 1→0 | 0.45s | ease-out |
| REC 도트 깜빡임 *(신규)* | opacity 1↔0.3 | 0.8s | ease-in-out, infinite |
| 썸네일 호버 | scale(1.04) | 0.12s | ease |

---

## 4. 반응형 & 모바일 최적화

### 4.1 뷰포트

```html
<meta name="viewport"
  content="width=device-width, initial-scale=1.0,
           maximum-scale=1.0, minimum-scale=1.0,
           user-scalable=no, viewport-fit=cover">
```

### 4.2 터치 최적화

```css
html            { touch-action: pan-x pan-y; }   /* 핀치줌 방지 */
body            { -webkit-tap-highlight-color: transparent; }
```

- 터치 타겟 최소 **44 × 44px**

### 4.3 높이 처리

| 화면 | 처리 방법 |
|------|-----------|
| 결과 화면 | `height: 100dvh` (동적 뷰포트) |
| 스크롤 화면 | `min-height: 100vh` + `padding-bottom: 80px` |
| 카메라 뷰 | `aspect-ratio: 4/3` 고정 |

### 4.4 레이아웃 원칙

- 카메라 뷰 최대 너비: 420px
- 버튼 최대 너비: 360px
- 좌우 패딩: 20px

---

## 5. 어드민 UX 명세 (Phase 2)

### 5.1 전체 레이아웃

```
[헤더] Born ★ qquqqu Admin  |  로그아웃
──────────────────────────────────────
[사이드바]        [메인 콘텐츠]
  ▸ 프레임 관리     프레임 목록 / 등록 폼
  ▸ 통계 (Phase 3)
```

### 5.2 프레임 목록 화면

- 카드 그리드: 썸네일 + 이름 + 레이아웃 뱃지 + 활성/비활성 토글 + 편집/삭제 버튼
- 정렬: 드래그앤드롭 or 숫자 입력
- 상태 필터: 전체 / 활성 / 비활성

### 5.3 프레임 등록 폼

| 필드 | UI 타입 | 설명 |
|------|---------|------|
| 프레임 이름 | Text input | 최대 50자 |
| 지원 레이아웃 | Checkbox (1×4 / 2×2 / 둘 다) | |
| 1×4 PNG | File upload + 미리보기 | 396×1074px, 5MB |
| 2×2 PNG | File upload + 미리보기 | 692×906px, 5MB |
| 정렬 순서 | Number input | |
| 활성 여부 | Toggle switch | 등록 즉시 노출 여부 |

### 5.4 어드민 로그인

- 이메일 + 비밀번호 입력
- 로그인 실패 시 인라인 에러 메시지
- JWT 토큰 localStorage 저장 (만료 24h)

---

## 6. 접근성

| 항목 | 기준 | 구현 |
|------|------|------|
| 색상 대비 | WCAG AA (4.5:1) | `#2EC27E` on `#FFFFFF` 통과 |
| 터치 타겟 | 44px 이상 | 버튼 padding으로 확보 |
| 카메라 권한 | 명확한 안내 | 에러별 오버레이 + 재시도 버튼 |
| 갤러리 접근 | 네이티브 팝업 | `input[type=file]` 네이티브 처리 |
| 로딩 피드백 | 처리 중 표시 | 앨범 선택 로딩 오버레이 |
| 진행 상태 | 시각적 표시 | 카메라 화면 4개 프로그레스 도트 |

---

## 7. 전체 화면 플로우 다이어그램

```
[Landing]
  ↓ Enter
[레이아웃 선택]  ← back ─────────────────────┐
  ↓ 다음                                       │
[프레임 선택]    ← back ──────────────────┐    │
  ↓ 선택하기                               │    │
[배경 선택]      ← back ─────────────┐    │    │
  ↓ 선택완료 / 건너뛰기               │    │    │
[사진 등록 방법] ← back ────────┐    │    │    │
  ├─ 📷 직접 촬영                │    │    │    │
  │    ↓                        │    │    │    │
  │  [카메라 화면]               │    │    │    │
  │    ├─ 📷 사진 모드            │    │    │    │
  │    └─ 🎬 영상 3초 모드        │    │    │    │
  │    ↓ 4장/4클립 완료           │    │    │    │
  └─ 🖼️ 앨범 선택 ────────────────┘    │    │    │
       ↓ 4장 선택                       │    │    │
     [결과 화면]                         │    │    │
       ├─ 저장하기                       │    │    │
       ├─ 공유하기                       │    │    │
       ├─ ← 다시 찍기 ───────────────────┘    │    │
       └─ 처음으로 ──────────────────────────────► [Landing]
```
