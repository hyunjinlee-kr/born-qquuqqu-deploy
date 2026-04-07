import { useEffect, useMemo, useRef } from 'react'
import type { FrameOption, Layout } from '../types'
import { drawFramePreview } from '../lib/canvas'
import { FRAMES } from '../lib/frames'

interface Props {
  layout: Layout
  frame: FrameOption
  onSelect: (f: FrameOption) => void
  onNext: () => void
  onBack: () => void
  activeIds: string[]
}

function FrameThumb({ frame, layout, selected, onClick }: {
  frame: FrameOption
  layout: Layout
  selected: boolean
  onClick: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawFramePreview(canvas, frame, layout)
  }, [frame, layout])

  const w = layout === '1x4' ? 100 : 140
  const h = layout === '1x4' ? 200 : 140

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 transition-all active:scale-95"
    >
      <div
        className="rounded-xl overflow-hidden transition-all duration-200"
        style={{
          border: selected ? '3px solid #2EC27E' : '3px solid transparent',
          boxShadow: selected ? 'none' : '0 2px 8px rgba(0,0,0,.08)',
        }}
      >
        <canvas
          ref={canvasRef}
          width={w}
          height={h}
          style={{ display: 'block' }}
        />
      </div>
      <span
        className="text-[11px] font-bold transition-colors duration-200"
        style={{ color: selected ? '#2EC27E' : '#4A6358' }}
      >
        {frame.name}
      </span>
    </button>
  )
}

export default function FrameSelect({ layout, frame, onSelect, onNext, onBack, activeIds }: Props) {
  const visibleFrames = useMemo(
    () => FRAMES.filter(f => activeIds.includes(f.id)),
    [activeIds]
  )

  useEffect(() => {
    if (visibleFrames.length > 0 && (!frame.id || frame.id === '_default' || !activeIds.includes(frame.id))) {
      onSelect(visibleFrames[0])
    }
  }, [visibleFrames])

  return (
    <div className="flex flex-col min-h-screen bg-bg animate-fadeUp">
      <div className="px-5 md:px-10 pt-5 pb-2">
        <button onClick={onBack} className="text-txt2 text-sm flex items-center gap-1">
          ← 뒤로
        </button>
      </div>

      <div className="flex-1 flex flex-col px-5 md:px-10 pb-8">
        <h2 className="text-[22px] md:text-[26px] font-bold text-txt mt-4 mb-1">프레임 선택</h2>
        <p className="text-muted text-[13px] md:text-[14px] mb-6">마음에 드는 프레임을 선택하세요</p>

        <div className="flex-1 overflow-y-auto pb-4">
          <div className="grid grid-cols-3 gap-4 md:gap-5 max-w-[600px] mx-auto">
            {visibleFrames.map(f => (
              <FrameThumb
                key={f.id}
                frame={f}
                layout={layout}
                selected={frame.id === f.id}
                onClick={() => onSelect(f)}
              />
            ))}
          </div>
        </div>

        <div className="mt-auto pt-4 max-w-[360px] md:max-w-[460px] mx-auto w-full">
          <button
            onClick={onNext}
            className="w-full bg-acc text-white font-bold text-[15px] rounded-2xl py-4
                       transition-all hover:-translate-y-0.5 active:scale-[0.97]"
          >
            선택하기
          </button>
        </div>
      </div>
    </div>
  )
}
