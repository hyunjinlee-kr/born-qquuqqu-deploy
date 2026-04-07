# Born ★ qquqqu

빈티지 포토부스 웹앱 — 사진 촬영 & 프레임 합성 & 다운로드

## 프로젝트 소개

카메라로 4장의 사진을 촬영하거나 앨범에서 선택한 뒤, 프레임과 배경을 조합해 포토부스 스트립 이미지를 만들어 다운로드할 수 있는 웹앱입니다.

**100% 클라이언트 사이드** — 서버 없이 브라우저에서 모든 처리가 이루어집니다.

### 주요 기능
- 레이아웃 선택 (1x4 세로 / 2x2 격자)
- 프레임 선택 (PNG 오버레이 / 단색 / 패턴)
- 배경 선택 (단색 / 별 패턴 / 하트 패턴 / 사용자 업로드)
- 카메라 촬영 (3초 카운트다운, 필터 적용)
- 앨범에서 사진 선택
- Canvas로 포토부스 이미지 합성
- JPEG 다운로드 / 공유

---

## 기술 스택

| 항목 | 기술 |
|------|------|
| UI | React 18 + TypeScript |
| 빌드 | Vite 5 |
| 스타일 | Tailwind CSS 3 |
| 이미지 합성 | Canvas API (브라우저 내장) |

---

## 시작하기

### 1. 설치

```bash
git clone https://github.com/hyunjinlee-kr/born-qquuqqu-deploy.git
cd born-qquuqqu-deploy
npm install
```

### 2. 로컬 개발

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### 3. 빌드

```bash
npm run build
```

`dist/` 폴더에 정적 파일이 생성됩니다.

### 4. 빌드 결과 미리보기

```bash
npm run preview
```

### 5. GitHub Pages 배포

```bash
npm run deploy
```

빌드 → `dist/` 내용을 `gh-pages` 브랜치에 push → 배포 완료

---

## 프로젝트 구조

```
qquqqu/
├── public/
│   ├── logo_bk.png              # 로고 이미지
│   └── frames/                  # PNG 프레임 이미지
│       ├── black-1x4.png
│       ├── black-2x2.png
│       └── ...
├── src/
│   ├── components/
│   │   ├── Landing.tsx          # 시작 화면
│   │   ├── LayoutSelect.tsx     # 레이아웃 선택 (1x4/2x2)
│   │   ├── FrameSelect.tsx      # 프레임 선택
│   │   ├── BgSelect.tsx         # 배경 선택
│   │   ├── SourceSelect.tsx     # 촬영/앨범 선택
│   │   ├── Camera.tsx           # 카메라 촬영
│   │   └── Result.tsx           # 결과 화면 (다운로드/공유)
│   ├── lib/
│   │   ├── frames.ts            # ⭐ 프레임 목록 (여기서 추가/수정)
│   │   ├── backgrounds.ts       # ⭐ 배경 목록 (여기서 추가/수정)
│   │   └── canvas.ts            # Canvas 합성 로직
│   ├── types.ts                 # TypeScript 타입 정의
│   ├── App.tsx                  # 메인 앱 (화면 전환)
│   ├── main.tsx                 # 엔트리포인트
│   └── index.css                # 글로벌 스타일
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── deploy.js                    # gh-pages 배포 스크립트
```

---

## 템플릿 추가 가이드

### PNG 프레임 추가하기

PNG 프레임은 사진 위에 오버레이되는 이미지 프레임입니다.

**Step 1.** PNG 파일 준비
- 1x4 레이아웃용: **334 × 1039px** (투명 배경 PNG)
- 2x2 레이아웃용: **632 × 909px** (투명 배경 PNG)
- 사진이 들어갈 영역은 투명하게, 프레임 테두리/장식만 그려져 있어야 합니다

**Step 2.** 파일을 `public/frames/`에 저장
```
public/frames/
├── newframe-1x4.png    ← 1x4용
└── newframe-2x2.png    ← 2x2용
```

**Step 3.** `src/lib/frames.ts`의 `FRAMES` 배열에 추가
```typescript
export const FRAMES: FrameOption[] = [
  // ... 기존 프레임들 ...

  // ✅ 새 프레임 추가
  {
    id: 'png-newframe',           // 고유 ID (중복 불가)
    name: '새 프레임',             // 화면에 표시될 이름
    bg: '#ffffff',                // 프레임 뒤 배경색
    textColor: '#1a2e24',         // 워터마크 텍스트 색상
    type: 'png',                  // PNG 프레임 타입
    pngUrl1x4: './frames/newframe-1x4.png',   // 1x4용 경로
    pngUrl2x2: './frames/newframe-2x2.png',   // 2x2용 경로
  },
]
```

**Step 4.** 확인 및 배포
```bash
npm run dev    # 개발 서버에서 확인
npm run deploy # 확인 후 배포
```

---

### 단색 프레임 추가하기

이미지 없이 배경색만으로 구성된 프레임입니다.

```typescript
// src/lib/frames.ts 의 FRAMES 배열에 추가
{
  id: 'lavender',               // 고유 ID
  name: '라벤더',                // 표시 이름
  bg: '#E6E6FA',                // 프레임 배경색
  textColor: '#4B0082',         // 워터마크 색상
  type: 'solid',
},
```

---

### 패턴 프레임 추가하기

배경에 하트/도트/별 패턴이 반복되는 프레임입니다.

```typescript
// src/lib/frames.ts 의 FRAMES 배열에 추가
{
  id: 'heart-pink',              // 고유 ID
  name: '핑크하트',               // 표시 이름
  bg: '#FFE4E1',                 // 배경색
  textColor: '#FF1493',          // 패턴 + 워터마크 색상
  type: 'pattern',
  pattern: 'heart',              // 'heart' | 'dot' | 'star'
},
```

---

### 배경 추가하기

프레임 바깥 영역의 배경입니다. `src/lib/backgrounds.ts`의 `BG_OPTIONS` 배열에 추가합니다.

**단색 배경:**
```typescript
{ id: 'solid-pink', label: '핑크', type: 'solid', bg: '#FFB6C1' },
```

**별 패턴 배경:**
```typescript
{ id: 'star-pink', label: '핑크 별', type: 'star', bg: '#FFB6C1', patternColor: '#FF69B4' },
```

**하트 패턴 배경:**
```typescript
{ id: 'heart-gold', label: '골드 하트', type: 'heart', bg: '#FFF8DC', patternColor: '#FFD700' },
```

---

## Canvas 합성 구조

포토부스 이미지는 5개 레이어로 합성됩니다:

```
┌─────────────────────────┐
│  Layer 5: 워터마크       │  "Born ★ qquqqu" (20% 투명도)
│  Layer 4: PNG 오버레이   │  png 타입일 때만
│  Layer 3: 사진 4장       │  object-fit: cover 방식
│  Layer 2: 프레임 카드    │  단색/패턴 배경
│  Layer 1: 외부 배경      │  사용자가 선택한 배경
└─────────────────────────┘
```

### 캔버스 크기

| 레이아웃 | 캔버스 | 프레임 카드 | 사진 셀 |
|----------|--------|-------------|---------|
| 1x4 | 494 × 1199px | 334 × 1039px | 304 × 214px × 4장 |
| 2x2 | 792 × 1069px | 632 × 909px | 293 × 392px × 4장 |

---

## 사용자 흐름

```
시작 → 레이아웃 선택 → 프레임 선택 → 배경 선택 → 촬영/앨범 → 결과 (다운로드/공유)
         (1x4/2x2)    (16종)       (20종+업로드)   (카메라/앨범)
```

---

## npm 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 로컬 개발 서버 (HMR, 코드 수정 시 자동 반영) |
| `npm run build` | TypeScript 체크 + 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run deploy` | 빌드 + gh-pages 자동 배포 |
