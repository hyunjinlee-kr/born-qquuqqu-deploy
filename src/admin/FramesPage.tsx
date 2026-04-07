import { useEffect, useState, useRef } from 'react'
import { fetchAllFrames, createFrame, toggleFrame, deleteFrameApi, reorderFrames } from '../lib/api'

interface DbFrame {
  id: string
  name: string
  layout: string
  png_url_1x4: string | null
  png_url_2x2: string | null
  is_active: boolean
  sort_order: number
}

interface Props {
  token: string
  onAuthError?: () => void
}

export default function FramesPage({ token, onAuthError }: Props) {
  const [frames, setFrames] = useState<DbFrame[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const dragItem = useRef<number | null>(null)
  const dragOver = useRef<number | null>(null)

  async function load() {
    setLoading(true)
    try {
      setFrames(await fetchAllFrames(token))
    } catch (err) {
      if (err instanceof Error && err.message.includes('401')) {
        onAuthError?.()
      }
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleToggle(id: string) {
    await toggleFrame(token, id)
    load()
  }

  function handleDragStart(idx: number) { dragItem.current = idx }
  function handleDragEnter(idx: number) { dragOver.current = idx }
  async function handleDragEnd() {
    if (dragItem.current === null || dragOver.current === null || dragItem.current === dragOver.current) {
      dragItem.current = null; dragOver.current = null; return
    }
    const reordered = [...frames]
    const [removed] = reordered.splice(dragItem.current, 1)
    reordered.splice(dragOver.current, 0, removed)
    setFrames(reordered)
    dragItem.current = null; dragOver.current = null
    await reorderFrames(token, reordered.map(f => f.id))
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return
    await deleteFrameApi(token, id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[20px] font-bold text-txt">프레임 관리</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-acc text-white font-bold text-[13px] px-4 py-2 rounded-xl
                     transition-all hover:-translate-y-0.5 active:scale-[0.97]"
        >
          {showForm ? '닫기' : '+ 프레임 추가'}
        </button>
      </div>

      {showForm && <FrameForm token={token} onCreated={() => { setShowForm(false); load() }} />}

      {loading ? (
        <p className="text-muted text-[14px]">불러오는 중...</p>
      ) : frames.length === 0 ? (
        <p className="text-muted text-[14px]">등록된 프레임이 없습니다</p>
      ) : (
        <div className="grid gap-3">
          {frames.map((f, idx) => (
            <div
              key={f.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragEnter={() => handleDragEnter(idx)}
              onDragEnd={handleDragEnd}
              onDragOver={e => e.preventDefault()}
              className="bg-white rounded-card border border-border p-4 flex items-center gap-4 cursor-default"
            >
              {/* Drag handle */}
              <div className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted select-none text-[18px] leading-none" style={{ touchAction: 'none' }}>
                ⠿
              </div>
              {/* Thumbnail */}
              <div className="flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                {f.png_url_1x4 ? (
                  <img src={f.png_url_1x4} alt="" className="w-full h-full object-cover" />
                ) : f.png_url_2x2 ? (
                  <img src={f.png_url_2x2} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-muted text-[11px]">PNG</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-txt text-[14px] truncate">{f.name}</p>
                <p className="text-muted text-[12px]">
                  {f.layout === '1x4' ? '세로형' : f.layout === '2x2' ? '그리드형' : '세로형 + 그리드형'} · 순서: {f.sort_order}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggle(f.id)}
                  className="relative inline-flex items-center w-[44px] h-[26px] rounded-full transition-colors duration-200 flex-shrink-0"
                  style={{ background: f.is_active ? '#4CD964' : '#ccc' }}
                >
                  <span
                    className="inline-block w-[22px] h-[22px] bg-white rounded-full shadow-md transition-all duration-200"
                    style={{ marginLeft: f.is_active ? 20 : 2 }}
                  />
                </button>
                <button
                  onClick={() => handleDelete(f.id)}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-red-50 text-red-500
                             hover:bg-red-100 transition-all"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FrameForm({ token, onCreated }: { token: string; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [layout, setLayout] = useState('both')
  const [sortOrder, setSortOrder] = useState(0)
  const [preview1x4, setPreview1x4] = useState('')
  const [preview2x2, setPreview2x2] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const file1x4Ref = useRef<HTMLInputElement>(null)
  const file2x2Ref = useRef<HTMLInputElement>(null)

  function handleFilePreview(e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) {
    const file = e.target.files?.[0]
    if (file) setter(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const formData = new FormData()
    formData.append('name', name)
    formData.append('layout', layout)
    formData.append('sort_order', String(sortOrder))
    if (file1x4Ref.current?.files?.[0]) formData.append('png_1x4', file1x4Ref.current.files[0])
    if (file2x2Ref.current?.files?.[0]) formData.append('png_2x2', file2x2Ref.current.files[0])

    try {
      await createFrame(token, formData)
      onCreated()
    } catch {
      alert('프레임 등록 실패')
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-card border border-border p-5 mb-6">
      <h3 className="font-bold text-txt text-[16px] mb-4">새 프레임 등록</h3>

      <div className="grid gap-4">
        <div>
          <label className="block text-[12px] font-bold text-txt2 mb-1">프레임 이름</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="예: 벚꽃 프레임"
            required
            className="w-full px-3 py-2.5 rounded-xl border border-border text-[14px] outline-none focus:border-acc"
          />
        </div>

        <div>
          <label className="block text-[12px] font-bold text-txt2 mb-2">레이아웃 타입</label>
          <div className="flex gap-2">
            {[
              { value: '1x4', label: '세로형 (1×4)' },
              { value: '2x2', label: '그리드형 (2×2)' },
              { value: 'both', label: '둘 다' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setLayout(opt.value)}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold border transition-all"
                style={layout === opt.value
                  ? { background: '#E8F8F0', borderColor: '#2EC27E', color: '#1A9E5E' }
                  : { background: '#fff', borderColor: '#DDE3E5', color: '#4A6358' }
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[12px] font-bold text-txt2 mb-1">정렬 순서</label>
          <input
            type="number"
            value={sortOrder}
            onChange={e => setSortOrder(Number(e.target.value))}
            className="w-full px-3 py-2.5 rounded-xl border border-border text-[14px] outline-none focus:border-acc"
          />
        </div>

        <div className={`grid gap-3 ${layout === 'both' ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {/* 1x4 PNG */}
          {(layout === '1x4' || layout === 'both') && (
            <div>
              <label className="block text-[12px] font-bold text-txt2 mb-1">세로형 PNG (334×1009)</label>
              <label className="block w-full aspect-[4/10] max-h-[280px] rounded-xl border-2 border-dashed border-border
                                bg-acc-light cursor-pointer overflow-hidden hover:border-acc transition-colors">
                <input
                  ref={file1x4Ref}
                  type="file"
                  accept="image/png"
                  onChange={e => handleFilePreview(e, setPreview1x4)}
                  className="hidden"
                />
                {preview1x4 ? (
                  <img src={preview1x4} alt="" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-acc text-[13px] font-bold gap-1">
                    <span className="text-2xl">+</span>
                    세로형 업로드
                  </div>
                )}
              </label>
            </div>
          )}

          {/* 2x2 PNG */}
          {(layout === '2x2' || layout === 'both') && (
            <div>
              <label className="block text-[12px] font-bold text-txt2 mb-1">그리드형 PNG (632×909)</label>
              <label className="block w-full aspect-[4/5] max-h-[280px] rounded-xl border-2 border-dashed border-border
                                bg-acc-light cursor-pointer overflow-hidden hover:border-acc transition-colors">
                <input
                  ref={file2x2Ref}
                  type="file"
                  accept="image/png"
                  onChange={e => handleFilePreview(e, setPreview2x2)}
                  className="hidden"
                />
                {preview2x2 ? (
                  <img src={preview2x2} alt="" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-acc text-[13px] font-bold gap-1">
                    <span className="text-2xl">+</span>
                    그리드형 업로드
                  </div>
                )}
              </label>
            </div>
          )}
        </div>

        <p className="text-muted text-[11px]">
          PNG-24 + 알파채널 필수. 사진 셀 영역은 완전 투명(alpha=0)으로 제작. 최대 5MB.
        </p>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-acc text-white font-bold text-[14px] rounded-xl py-3
                     transition-all hover:-translate-y-0.5 active:scale-[0.97]
                     disabled:opacity-50"
        >
          {submitting ? '등록 중...' : '프레임 등록'}
        </button>
      </div>
    </form>
  )
}
