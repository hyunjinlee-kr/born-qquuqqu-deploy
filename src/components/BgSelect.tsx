import { useEffect, useRef } from 'react'
import type { BgOption } from '../types'
import { drawBgThumb } from '../lib/canvas'
import { BG_OPTIONS } from '../lib/backgrounds'

interface Props {
  bg: BgOption
  onSelect: (bg: BgOption) => void
  onNext: () => void
  onSkip: () => void
  onBack: () => void
}

function BgThumb({ bg, selected, onClick }: { bg: BgOption; selected: boolean; onClick: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    drawBgThumb(c, bg)
  }, [bg])

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
          width={100}
          height={100}
          style={{ display: 'block' }}
        />
      </div>
      <span
        className="text-[11px] font-bold transition-colors duration-200"
        style={{ color: selected ? '#2EC27E' : '#4A6358' }}
      >
        {bg.label}
      </span>
    </button>
  )
}

function UploadThumb({ selected, onFile }: {
  selected: boolean
  onFile: (url: string) => void
}) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    onFile(url)
  }

  return (
    <label className="flex flex-col items-center gap-2 cursor-pointer transition-all active:scale-95">
      <div
        className="rounded-xl overflow-hidden transition-all duration-200 flex items-center justify-center"
        style={{
          width: 100,
          height: 100,
          border: selected ? '3px solid #2EC27E' : '3px dashed #DDE3E5',
          background: '#E8F8F0',
        }}
      >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />
        <div className="flex flex-col items-center gap-0.5 pointer-events-none">
          <span className="text-acc text-xl">+</span>
        </div>
      </div>
      <span className="text-[11px] font-bold text-acc">업로드</span>
    </label>
  )
}

export default function BgSelect({ bg, onSelect, onNext, onSkip, onBack }: Props) {

  function handleUpload(url: string) {
    onSelect({ id: 'upload', label: '커스텀', type: 'upload', bg: url })
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg animate-fadeUp">
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <button onClick={onBack} className="text-txt2 text-sm flex items-center gap-1">
          ← 뒤로
        </button>
        <button
          onClick={onSkip}
          className="text-[12px] font-bold text-acc-dark px-4 py-2 rounded-full border border-border bg-acc-light"
        >
          건너뛰기
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 px-5 md:px-10">
        <h2 className="text-[22px] md:text-[26px] font-bold text-txt mt-4 mb-1">배경 선택</h2>
        <p className="text-muted text-[13px] md:text-[14px] mb-6">프레임 외부 배경을 선택하세요</p>

        <div className="grid grid-cols-4 gap-4 md:gap-5 max-w-[600px] mx-auto">
          {BG_OPTIONS.map(b => (
            <BgThumb key={b.id} bg={b} selected={bg.id === b.id} onClick={() => onSelect(b)} />
          ))}
          <UploadThumb
            selected={bg.id === 'upload'}
            onFile={handleUpload}
          />
        </div>
      </div>

      <div className="sticky bottom-0 bg-bg border-t border-border px-5 py-4">
        <button
          onClick={onNext}
          className="w-full max-w-[360px] md:max-w-[460px] mx-auto block bg-acc text-white font-bold text-[15px] rounded-2xl py-4
                     transition-all hover:-translate-y-0.5 active:scale-[0.97]"
        >
          선택완료
        </button>
      </div>
    </div>
  )
}
