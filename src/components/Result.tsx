import { useEffect, useRef, useState } from 'react'
import type { Layout, FrameOption, BgOption, CameraMode } from '../types'
import { buildStripCanvas } from '../lib/canvas'
import { getCanvasLayout } from '../lib/frames'

interface Props {
  layout: Layout
  frame: FrameOption
  bg: BgOption
  photos: string[]
  videoClips: Blob[]
  mode: CameraMode
  onRetake: () => void
  onHome: () => void
}

export default function Result({ layout, frame, bg, photos, videoClips, mode, onRetake, onHome }: Props) {
  const [imgSrc, setImgSrc] = useState('')
  const [mergedVideoUrl, setMergedVideoUrl] = useState('')
  const [videoUrls, setVideoUrls] = useState<string[]>([])
  const [building, setBuilding] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videosRef = useRef<HTMLVideoElement[]>([])

  useEffect(() => {
    if (mode === 'photo') {
      buildStripCanvas(layout, frame, bg, photos).then(canvas => {
        setImgSrc(canvas.toDataURL('image/jpeg', 0.95))
        setBuilding(false)
      })
    } else {
      const urls = videoClips.map(blob => URL.createObjectURL(blob))
      setVideoUrls(urls)
      setBuilding(false)
      return () => urls.forEach(URL.revokeObjectURL)
    }
  }, [])

  // Merge video clips into single video via canvas recording
  useEffect(() => {
    if (mode !== 'video' || videoUrls.length === 0) return

    const { cw, ch, cells, frameX, frameY, frameW, frameH } = getCanvasLayout(layout)
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = cw
    canvas.height = ch

    const ctx = canvas.getContext('2d')!
    const videoEls: HTMLVideoElement[] = []

    // Create hidden video elements for each clip
    videoUrls.forEach((url, i) => {
      const v = document.createElement('video')
      v.src = url
      v.muted = true
      v.playsInline = true
      v.loop = true
      v.play()
      videoEls.push(v)
      videosRef.current[i] = v
    })

    // Wait for all videos to be ready, then start recording
    Promise.all(videoEls.map(v => new Promise<void>(resolve => {
      if (v.readyState >= 2) resolve()
      else v.addEventListener('loadeddata', () => resolve(), { once: true })
    }))).then(() => {
      // Draw frame background
      const drawFrame = () => {
        // Background
        if (bg.type !== 'none' && bg.bg) {
          ctx.fillStyle = bg.bg
          ctx.fillRect(0, 0, cw, ch)
        } else {
          ctx.fillStyle = frame.bg
          ctx.fillRect(0, 0, cw, ch)
        }

        // Frame card
        ctx.fillStyle = frame.bg
        ctx.fillRect(frameX, frameY, frameW, frameH)

        // Draw each video into its cell
        videoEls.forEach((v, i) => {
          if (i < cells.length) {
            const cell = cells[i]
            ctx.save()
            ctx.beginPath()
            ctx.rect(cell.x, cell.y, cell.w, cell.h)
            ctx.clip()

            // Mirror + cover
            ctx.translate(cell.x + cell.w, cell.y)
            ctx.scale(-1, 1)
            const vRatio = v.videoWidth / v.videoHeight
            const cRatio = cell.w / cell.h
            let sw = v.videoWidth, sh = v.videoHeight
            if (vRatio > cRatio) { sw = v.videoHeight * cRatio }
            else { sh = v.videoWidth / cRatio }
            const sx = (v.videoWidth - sw) / 2
            const sy = (v.videoHeight - sh) / 2
            ctx.drawImage(v, sx, sy, sw, sh, 0, 0, cell.w, cell.h)
            ctx.restore()
          }
        })

        // Watermark
        ctx.globalAlpha = 0.2
        ctx.fillStyle = frame.textColor
        ctx.font = 'bold 14px "Noto Sans KR", sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.fillText('Born ★ qquqqu', cw / 2, ch - 8)
        ctx.globalAlpha = 1
      }

      // Record canvas as video
      const stream = canvas.captureStream(30)
      const mimeType =
        MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' :
        MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4'
      const recorder = new MediaRecorder(stream, { mimeType })
      const chunks: BlobPart[] = []
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType })
        setMergedVideoUrl(URL.createObjectURL(blob))
      }

      // Animate and record for 3 seconds
      recorder.start()
      let startTime = 0
      const animate = (ts: number) => {
        if (!startTime) startTime = ts
        drawFrame()
        if (ts - startTime < 3200) {
          requestAnimationFrame(animate)
        } else {
          recorder.stop()
          videoEls.forEach(v => { v.pause(); v.src = '' })
        }
      }
      requestAnimationFrame(animate)
    })

    return () => {
      videoEls.forEach(v => { v.pause(); v.src = '' })
    }
  }, [videoUrls])

  function handleDownload() {
    if (mode === 'photo') {
      const a = document.createElement('a')
      a.href = imgSrc
      a.download = `born-qquqqu-${Date.now()}.jpg`
      a.click()
    } else if (mergedVideoUrl) {
      const a = document.createElement('a')
      a.href = mergedVideoUrl
      a.download = `born-qquqqu-${Date.now()}.webm`
      a.click()
    }
  }

  async function handleShare() {
    if (!navigator.share) {
      alert('공유 기능은 모바일 브라우저에서 지원됩니다.')
      return
    }
    try {
      if (mode === 'photo' && imgSrc) {
        const res = await fetch(imgSrc)
        const blob = await res.blob()
        const file = new File([blob], 'born-qquqqu.jpg', { type: 'image/jpeg' })
        await navigator.share({ files: [file], title: 'Born ★ qquqqu' })
      } else if (mergedVideoUrl) {
        const res = await fetch(mergedVideoUrl)
        const blob = await res.blob()
        const file = new File([blob], 'born-qquqqu.webm', { type: 'video/webm' })
        await navigator.share({ files: [file], title: 'Born ★ qquqqu' })
      }
    } catch {}
  }

  if (building) {
    return (
      <div className="fixed inset-0 bg-bg flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-acc border-t-transparent rounded-full animate-spin" />
        <p className="text-txt text-[14px] font-bold">포토스트립 완성 중...</p>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col bg-bg"
      style={{ height: '100dvh', overflow: 'hidden' }}
    >
      {/* Hidden canvas for video merging */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Result image / video area */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-4 md:p-8" style={{ maxWidth: 1000, margin: '0 auto', width: '100%' }}>
        {mode === 'photo' && imgSrc ? (
          <img
            src={imgSrc}
            alt="포토스트립"
            className="rounded-2xl"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          />
        ) : mergedVideoUrl ? (
          <video
            src={mergedVideoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="rounded-2xl"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-acc border-t-transparent rounded-full animate-spin" />
            <p className="text-txt text-[14px] font-bold">영상 합성 중...</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex-shrink-0 px-5 pb-6 pt-2 flex flex-col gap-2 max-w-[360px] md:max-w-[460px] mx-auto w-full">
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            disabled={mode === 'video' && !mergedVideoUrl}
            className="flex-1 bg-acc text-white font-bold text-[14px] rounded-2xl py-3.5
                       transition-all hover:-translate-y-0.5 active:scale-[0.97]
                       disabled:opacity-50"
          >
            {mode === 'photo' ? '저장하기' : '영상 저장'}
          </button>
          <button
            onClick={handleShare}
            disabled={mode === 'video' && !mergedVideoUrl}
            className="flex-1 border border-border bg-white text-txt font-bold text-[14px] rounded-2xl py-3.5
                       transition-all hover:bg-acc-light active:scale-[0.97]
                       disabled:opacity-50"
          >
            공유하기
          </button>
        </div>
        <button
          onClick={onRetake}
          className="w-full border border-border bg-white text-txt2 font-bold text-[13px] rounded-2xl py-3
                     transition-all hover:bg-acc-light active:scale-[0.97]"
        >
          ← 다시 찍기
        </button>
        <button
          onClick={onHome}
          className="w-full text-muted text-[13px] py-2 transition-all hover:text-txt2"
        >
          처음으로
        </button>
      </div>
    </div>
  )
}
