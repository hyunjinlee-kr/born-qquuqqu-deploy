import { useEffect, useRef } from 'react'

interface Props { onEnter: () => void }

export default function Landing({ onEnter }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    // Generate twinkling stars
    const stars: HTMLDivElement[] = []
    for (let i = 0; i < 40; i++) {
      const star = document.createElement('div')
      const size = Math.random() * 4 + 2
      const duration = 3 + Math.random() * 4
      const delay = Math.random() * 5
      star.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: #C8E6D4;
        border-radius: 50%;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: twinkle ${duration}s ${delay}s ease-in-out infinite;
        --duration: ${duration}s;
        pointer-events: none;
      `
      container.appendChild(star)
      stars.push(star)
    }
    return () => { stars.forEach(s => s.remove()) }
  }, [])

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-bg animate-fadeUp"
      ref={containerRef}
      style={{ zIndex: 0, minHeight: '100vh' }}
    >
      <div className="relative z-10 flex flex-col items-center gap-5 md:gap-6 text-center px-6">
        <div className="flex items-center gap-3">
          <img
            src="./logo_bk.png"
            alt="Born ★ qquqqu"
            className="select-none"
            style={{ height: 80, maxWidth: '70vw', objectFit: 'contain' }}
            draggable={false}
          />
          <span
            className="inline-block animate-spin-slow text-[36px] md:text-[44px] select-none"
            style={{ color: '#2EC27E' }}
          >
            ★
          </span>
        </div>

        <p className="text-muted text-[13px] md:text-[15px] leading-relaxed max-w-[240px] md:max-w-[320px]">
          본꾸꾸 셀프 사진관
        </p>

        <button
          onClick={onEnter}
          className="mt-4 bg-acc text-white font-bold text-[15px] rounded-2xl
                     px-[52px] py-[16px] transition-all duration-150
                     hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.97]"
          style={{ boxShadow: '0 4px 20px rgba(46,194,126,.3)' }}
        >
          Enter
        </button>
      </div>
    </div>
  )
}
