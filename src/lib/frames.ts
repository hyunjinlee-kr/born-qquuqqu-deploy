import type { FrameOption } from '../types'

/**
 * === FRAMES (템플릿) 목록 ===
 *
 * 새 프레임 추가 방법:
 * 1. solid/pattern → 아래 배열에 객체 추가
 * 2. png 프레임   → public./frames/ 에 {name}-1x4.png, {name}-2x2.png 넣고
 *                    아래 배열에 pngUrl1x4, pngUrl2x2 경로 추가
 */
export const FRAMES: FrameOption[] = [
  // ── PNG 프레임 ──
  { id: 'png-black',   name: '블랙',   bg: '#ffffff', textColor: '#1a2e24', type: 'png', pngUrl1x4: './frames/black-1x4.png',   pngUrl2x2: './frames/black-2x2.png' },
  { id: 'png-white',   name: '화이트', bg: '#ffffff', textColor: '#1a2e24', type: 'png', pngUrl1x4: './frames/white-1x4.png',   pngUrl2x2: './frames/white-2x2.png' },
  { id: 'png-green',   name: '그린',   bg: '#ffffff', textColor: '#1a2e24', type: 'png', pngUrl1x4: './frames/green-1x4.png',   pngUrl2x2: './frames/green-2x2.png' },
  { id: 'png-pink',    name: '핑크',   bg: '#ffffff', textColor: '#1a2e24', type: 'png', pngUrl1x4: './frames/pink-1x4.png',    pngUrl2x2: './frames/pink-2x2.png' },
  { id: 'png-yellow',  name: '옐로우', bg: '#ffffff', textColor: '#1a2e24', type: 'png', pngUrl1x4: './frames/yellow-1x4.png',  pngUrl2x2: './frames/yellow-2x2.png' },
  { id: 'png-blue',    name: '블루',   bg: '#ffffff', textColor: '#1a2e24', type: 'png', pngUrl1x4: './frames/blue-1x4.png',    pngUrl2x2: './frames/blue-2x2.png' },
  { id: 'png-chunsam', name: '춘삼이', bg: '#ffffff', textColor: '#1a2e24', type: 'png', pngUrl1x4: './frames/chunsam-1x4.png', pngUrl2x2: './frames/chunsam-2x2.png' },

  // ── Solid 프레임 (숨김) ──
  // { id: 'black',  name: '블랙(단색)',  bg: '#1a1a1a', textColor: '#f0f0f0', type: 'solid' },
  // { id: 'white',  name: '화이트(단색)', bg: '#ffffff', textColor: '#1a2e24', type: 'solid' },
  // { id: 'mint',   name: '민트',        bg: '#e8f8f0', textColor: '#1a5e3a', type: 'solid' },
  // { id: 'navy',   name: '네이비',      bg: '#1a2744', textColor: '#c8d8ff', type: 'solid' },
  // { id: 'cream',  name: '크림',        bg: '#fdf6ec', textColor: '#4a3010', type: 'solid' },
  // { id: 'rose',   name: '로즈',        bg: '#fdeef0', textColor: '#6a1a28', type: 'solid' },

  // ── Pattern 프레임 ──
  { id: 'heart', name: '하트', bg: '#fff0f5', textColor: '#c0185a', type: 'pattern', pattern: 'heart' },
  { id: 'dot',   name: '도트', bg: '#f0f4ff', textColor: '#2244aa', type: 'pattern', pattern: 'dot' },
  { id: 'star',  name: '별',   bg: '#fffbe8', textColor: '#7a5a00', type: 'pattern', pattern: 'star' },
]

export const DEFAULT_FRAME = FRAMES[0]

// Canvas size constants (PRD spec)
export const CANVAS_OUTER = 80

export interface CellRect { x: number; y: number; w: number; h: number }

export interface CanvasLayout {
  cw: number
  ch: number
  cells: CellRect[]
  frameX: number   // inner frame card origin
  frameY: number
  frameW: number
  frameH: number
}

export function getCanvasLayout(layout: '1x4' | '2x2'): CanvasLayout {
  if (layout === '1x4') {
    // Figma spec: cell 304×214, pad 15/17, gap 25, bottom 91
    const cellW = 304, cellH = 214
    const padLR = 15, padTop = 17, gap = 15, padBottom = 91
    const frameW = padLR + cellW + padLR              // 334
    const frameH = padTop + cellH * 4 + gap * 3 + padBottom // 1039
    const cw = frameW + CANVAS_OUTER * 2               // 494
    const ch = frameH + CANVAS_OUTER * 2               // 1199
    const frameX = CANVAS_OUTER, frameY = CANVAS_OUTER
    const cellX = CANVAS_OUTER + padLR
    const ys = [0, 1, 2, 3].map(i => CANVAS_OUTER + padTop + i * (cellH + gap))
    const cells = ys.map(y => ({ x: cellX, y, w: cellW, h: cellH }))
    return { cw, ch, cells, frameX, frameY, frameW, frameH }
  } else {
    // Figma spec: cell 293×392, pad 15/17, gap 16, bottom 92, frame 632×909
    const cellW = 293, cellH = 392
    const padLR = 15, padTop = 17, gap = 16
    void 92 // padBottom — included in frameH
    const frameW = 632, frameH = 909
    const cw = frameW + CANVAS_OUTER * 2
    const ch = frameH + CANVAS_OUTER * 2
    const frameX = CANVAS_OUTER, frameY = CANVAS_OUTER
    const cellX1 = CANVAS_OUTER + padLR
    const cellX2 = cellX1 + cellW + gap
    const cellY1 = CANVAS_OUTER + padTop
    const cellY2 = cellY1 + cellH + gap
    const cells: CellRect[] = [
      { x: cellX1, y: cellY1, w: cellW, h: cellH },
      { x: cellX2, y: cellY1, w: cellW, h: cellH },
      { x: cellX1, y: cellY2, w: cellW, h: cellH },
      { x: cellX2, y: cellY2, w: cellW, h: cellH },
    ]
    return { cw, ch, cells, frameX, frameY, frameW, frameH }
  }
}
