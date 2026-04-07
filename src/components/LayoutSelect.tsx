import type { Layout } from '../types'

interface Props {
  layout: Layout
  onSelect: (l: Layout) => void
  onNext: () => void
  onBack: () => void
}

const LAYOUTS: { id: Layout; label: string; desc: string }[] = [
  { id: '1x4', label: '1 × 4', desc: '세로형' },
  { id: '2x2', label: '2 × 2', desc: '그리드형' },
]

function Preview1x4({ selected }: { selected: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-[3px] py-2">
      {[0,1,2,3].map(i => (
        <div
          key={i}
          className="rounded-sm transition-colors"
          style={{
            width: 56, height: 36,
            background: selected ? '#A8E6C8' : '#DDE3E5',
          }}
        />
      ))}
    </div>
  )
}

function Preview2x2({ selected }: { selected: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-[3px] py-2">
      {[0,1,2,3].map(i => (
        <div
          key={i}
          className="rounded-sm transition-colors"
          style={{
            width: 52, height: 58,
            background: selected ? '#A8E6C8' : '#DDE3E5',
          }}
        />
      ))}
    </div>
  )
}

export default function LayoutSelect({ layout, onSelect, onNext, onBack }: Props) {
  return (
    <div className="flex flex-col min-h-screen bg-bg animate-fadeUp">
      <div className="px-5 pt-5 pb-2">
        <button onClick={onBack} className="text-txt2 text-sm flex items-center gap-1">
          ← 뒤로
        </button>
      </div>

      <div className="flex-1 flex flex-col px-5 md:px-10 pb-8">
        <h2 className="text-[22px] md:text-[26px] font-bold text-txt mt-4 mb-1">레이아웃 선택</h2>
        <p className="text-muted text-[13px] md:text-[14px] mb-6">사진 배치 방식을 선택하세요</p>

        <div className="grid grid-cols-2 gap-[14px] md:gap-5 max-w-[340px] md:max-w-[460px] mx-auto w-full">
          {LAYOUTS.map(({ id, label, desc }) => {
            const selected = layout === id
            return (
              <button
                key={id}
                onClick={() => onSelect(id)}
                className="rounded-card p-4 flex flex-col items-center gap-1 border transition-all duration-200"
                style={{
                  background: selected ? '#E8F8F0' : '#FFFFFF',
                  border: selected ? '2px solid #2EC27E' : '1px solid #DDE3E5',
                  boxShadow: selected ? '0 2px 16px rgba(46,194,126,.12)' : '0 2px 16px rgba(46,194,126,.06)',
                }}
              >
                {id === '1x4'
                  ? <Preview1x4 selected={selected} />
                  : <Preview2x2 selected={selected} />
                }
                <span className="font-bold text-[15px] md:text-[17px] text-txt mt-1">{label}</span>
                <span className="text-muted text-[12px] md:text-[13px]">{desc}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-auto pt-8 max-w-[360px] md:max-w-[460px] mx-auto w-full">
          <button
            onClick={onNext}
            className="w-full bg-acc text-white font-bold text-[15px] rounded-2xl py-4
                       transition-all hover:-translate-y-0.5 active:scale-[0.97]"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  )
}
