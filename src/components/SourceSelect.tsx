import { useState } from 'react'
import type { Layout } from '../types'

interface Props {
  layout: Layout
  onCamera: () => void
  onAlbum: (photos: string[]) => void
  onBack: () => void
}

export default function SourceSelect({ onCamera, onAlbum, onBack }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length !== 4) {
      setError(`사진 4장을 선택해주세요 (현재 ${files.length}장 선택됨)`)
      e.target.value = ''
      return
    }
    setError('')
    setLoading(true)

    Promise.all(
      files.map(f => new Promise<string>((res, rej) => {
        const reader = new FileReader()
        reader.onload = () => res(reader.result as string)
        reader.onerror = rej
        reader.readAsDataURL(f)
      }))
    ).then(photos => {
      setLoading(false)
      onAlbum(photos)
    }).catch(() => {
      setLoading(false)
      setError('사진을 불러오는 중 오류가 발생했습니다')
    })
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg animate-fadeUp">
      {loading && (
        <div className="fixed inset-0 bg-white/90 z-50 flex flex-col items-center justify-center gap-3">
          <span className="text-3xl">🖼️</span>
          <p className="text-txt font-bold text-[15px]">사진 불러오는 중...</p>
        </div>
      )}

      <div className="px-5 pt-5 pb-2">
        <button onClick={onBack} className="text-txt2 text-sm flex items-center gap-1">
          ← 뒤로
        </button>
      </div>

      <div className="flex-1 flex flex-col px-5 md:px-10 pb-8">
        <h2 className="text-[22px] md:text-[26px] font-bold text-txt mt-4 mb-1">사진 등록</h2>
        <p className="text-muted text-[13px] md:text-[14px] mb-6">촬영하거나 앨범에서 선택하세요</p>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[13px]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-[14px] md:gap-5 max-w-[340px] md:max-w-[460px] mx-auto w-full">
          {/* Camera card */}
          <button
            onClick={onCamera}
            className="rounded-card border border-border bg-white p-6 flex flex-col items-center gap-3
                       transition-all hover:border-acc hover:bg-acc-light active:scale-95"
            style={{ boxShadow: '0 2px 16px rgba(46,194,126,.06)' }}
          >
            <span className="text-4xl">📷</span>
            <div className="text-center">
              <p className="font-bold text-txt text-[14px]">직접 촬영</p>
              <p className="text-muted text-[12px] mt-0.5">카메라로 4장 찍기</p>
            </div>
          </button>

          {/* Album card — input overlay trick */}
          <label
            className="relative rounded-card border border-border bg-white p-6 flex flex-col items-center gap-3
                       cursor-pointer transition-all hover:border-acc hover:bg-acc-light active:scale-95"
            style={{ boxShadow: '0 2px 16px rgba(46,194,126,.06)' }}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFiles}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <span className="text-4xl pointer-events-none">🖼️</span>
            <div className="text-center pointer-events-none">
              <p className="font-bold text-txt text-[14px]">앨범에서 선택</p>
              <p className="text-muted text-[12px] mt-0.5">사진 4장 불러오기</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}
