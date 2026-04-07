import type { FrameOption, BgOption, Layout } from '../types'
import { getCanvasLayout, type CellRect } from './frames'

// object-fit: cover equivalent
export function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number, w: number, h: number,
) {
  const srcRatio = img.naturalWidth / img.naturalHeight
  const dstRatio = w / h
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight
  if (srcRatio > dstRatio) {
    sw = img.naturalHeight * dstRatio
    sx = (img.naturalWidth - sw) / 2
  } else {
    sh = img.naturalWidth / dstRatio
    sy = (img.naturalHeight - sh) / 2
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

// Draw star/heart pattern tiles across given rect
function drawPatternTile(
  ctx: CanvasRenderingContext2D,
  rect: { x: number; y: number; w: number; h: number },
  bg: string,
  patternColor: string,
  type: 'star' | 'heart',
) {
  ctx.fillStyle = bg
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h)

  const size = 18
  const spacing = 32
  ctx.fillStyle = patternColor
  ctx.font = `${size}px serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const char = type === 'star' ? '★' : '♥'

  for (let row = 0; row * spacing < rect.h + spacing; row++) {
    for (let col = 0; col * spacing < rect.w + spacing; col++) {
      const px = rect.x + col * spacing + (row % 2 === 0 ? 0 : spacing / 2)
      const py = rect.y + row * spacing
      ctx.fillText(char, px, py)
    }
  }
}

// Draw frame card inner pattern (for pattern frames)
export function drawStripPattern(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  bg: string, color: string,
  pattern: 'heart' | 'dot' | 'star',
) {
  ctx.fillStyle = bg
  ctx.fillRect(x, y, w, h)

  const size = 14
  const spacing = 26
  ctx.fillStyle = color
  if (pattern === 'dot') {
    for (let row = 0; row * spacing < h + spacing; row++) {
      for (let col = 0; col * spacing < w + spacing; col++) {
        const px = x + col * spacing + (row % 2 === 0 ? 0 : spacing / 2)
        const py = y + row * spacing
        ctx.beginPath()
        ctx.arc(px, py, size / 2.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  } else {
    ctx.font = `${size}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const char = pattern === 'star' ? '★' : '♥'
    for (let row = 0; row * spacing < h + spacing; row++) {
      for (let col = 0; col * spacing < w + spacing; col++) {
        const px = x + col * spacing + (row % 2 === 0 ? 0 : spacing / 2)
        const py = y + row * spacing
        ctx.fillText(char, px, py)
      }
    }
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export async function buildStripCanvas(
  layout: Layout,
  frame: FrameOption,
  bg: BgOption,
  photos: string[],
): Promise<HTMLCanvasElement> {
  const { cw, ch, cells, frameX, frameY, frameW, frameH } = getCanvasLayout(layout)

  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')!

  // Layer 1: outer background
  if (bg.type !== 'none' && bg.bg) {
    if (bg.type === 'star' || bg.type === 'heart') {
      drawPatternTile(ctx, { x: 0, y: 0, w: cw, h: ch }, bg.bg, bg.patternColor!, bg.type)
    } else if (bg.type === 'solid') {
      ctx.fillStyle = bg.bg
      ctx.fillRect(0, 0, cw, ch)
    } else if (bg.type === 'upload' && bg.bg) {
      const bgImg = await loadImage(bg.bg)
      drawImageCover(ctx, bgImg, 0, 0, cw, ch)
    }
  } else {
    ctx.fillStyle = frame.bg
    ctx.fillRect(0, 0, cw, ch)
  }

  // Layer 2: frame card — skip for PNG frames
  if (frame.type !== 'png') {
    ctx.save()
    ctx.beginPath()
    ctx.rect(frameX, frameY, frameW, frameH)
    ctx.closePath()

    if (frame.type === 'pattern' && frame.pattern) {
      ctx.clip()
      drawStripPattern(ctx, frameX, frameY, frameW, frameH, frame.bg, frame.textColor, frame.pattern)
    } else {
      ctx.fillStyle = frame.bg
      ctx.fill()
      ctx.clip()
    }
  }

  // Layer 3: photos
  const images = await Promise.all(photos.map(loadImage))
  for (let i = 0; i < cells.length && i < images.length; i++) {
    const cell = cells[i]
    ctx.save()
    ctx.beginPath()
    ctx.rect(cell.x, cell.y, cell.w, cell.h)
    ctx.clip()
    drawImageCover(ctx, images[i], cell.x, cell.y, cell.w, cell.h)
    ctx.restore()
  }

  if (frame.type !== 'png') ctx.restore()

  // Layer 4: PNG frame overlay — draw at frame card area, not full canvas
  if (frame.type === 'png') {
    const pngUrl = layout === '1x4' ? frame.pngUrl1x4 : frame.pngUrl2x2
    if (pngUrl) {
      const overlayImg = await loadImage(pngUrl)
      ctx.drawImage(overlayImg, frameX, frameY, frameW, frameH)
    }
  }

  // Layer 5: watermark
  ctx.globalAlpha = 0.2
  ctx.fillStyle = frame.textColor
  ctx.font = `bold 14px "Noto Sans KR", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.fillText('Born ★ qquqqu', cw / 2, ch - 8)
  ctx.globalAlpha = 1

  return canvas
}

// Draw frame pattern preview on a small canvas (for frame selector cards)
export function drawFramePreview(
  canvas: HTMLCanvasElement,
  frame: FrameOption,
  layout: Layout,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const { width: w, height: h } = canvas
  ctx.clearRect(0, 0, w, h)

  // PNG frame: load and draw the actual PNG image as preview
  if (frame.type === 'png') {
    const pngUrl = layout === '1x4' ? frame.pngUrl1x4 : frame.pngUrl2x2
    if (pngUrl) {
      const img = new Image()
      img.onload = () => {
        ctx.fillStyle = '#f0f0f0'
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(img, 0, 0, w, h)
      }
      img.src = pngUrl
    } else {
      ctx.fillStyle = '#f0f0f0'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#999'
      ctx.font = `${h * 0.15}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('PNG', w / 2, h / 2)
    }
    return
  }

  if (frame.type === 'pattern' && frame.pattern) {
    drawStripPattern(ctx, 0, 0, w, h, frame.bg, frame.textColor, frame.pattern)
  } else {
    ctx.fillStyle = frame.bg
    ctx.fillRect(0, 0, w, h)
  }

  // draw cell slots
  const previewCells = getPreviewCells(layout, w, h)
  ctx.fillStyle = 'rgba(0,0,0,0.12)'
  for (const cell of previewCells) {
    ctx.fillRect(cell.x, cell.y, cell.w, cell.h)
  }
}

function getPreviewCells(layout: Layout, w: number, h: number): CellRect[] {
  if (layout === '1x4') {
    const pad = Math.floor(w * 0.1)
    const gap = 3
    const cw = w - pad * 2
    const ch = Math.floor((h - pad * 2 - gap * 3) / 4)
    return [0,1,2,3].map(i => ({ x: pad, y: pad + i * (ch + gap), w: cw, h: ch }))
  } else {
    const pad = Math.floor(w * 0.06)
    const gap = 3
    const cw = Math.floor((w - pad * 2 - gap) / 2)
    const ch = Math.floor((h - pad * 2 - gap) / 2)
    return [
      { x: pad,         y: pad,         w: cw, h: ch },
      { x: pad + cw + gap, y: pad,      w: cw, h: ch },
      { x: pad,         y: pad + ch + gap, w: cw, h: ch },
      { x: pad + cw + gap, y: pad + ch + gap, w: cw, h: ch },
    ]
  }
}

// Draw background thumbnail
export function drawBgThumb(canvas: HTMLCanvasElement, bg: BgOption) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const { width: w, height: h } = canvas
  ctx.clearRect(0, 0, w, h)
  if (bg.type === 'none') {
    ctx.fillStyle = '#DDE3E5'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#8AAA96'
    ctx.font = `${h * 0.3}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('✕', w / 2, h / 2)
    return
  }
  if (bg.type === 'upload') {
    ctx.fillStyle = '#E8F8F0'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#2EC27E'
    ctx.font = `${h * 0.35}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('+', w / 2, h / 2)
    return
  }
  if (bg.bg) {
    if ((bg.type === 'star' || bg.type === 'heart') && bg.patternColor) {
      drawPatternTile(ctx, { x: 0, y: 0, w, h }, bg.bg, bg.patternColor, bg.type)
    } else {
      ctx.fillStyle = bg.bg
      ctx.fillRect(0, 0, w, h)
    }
  }
}
