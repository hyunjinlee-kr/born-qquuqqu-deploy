import { useEffect, useState, useRef } from 'react'
import { fetchAllBackgrounds, createBackgroundApi, deleteBackgroundApi, toggleBackground, reorderBackgrounds } from '../lib/api'

interface DbBg {
  id: string
  label: string
  type: string
  bg: string | null
  patternColor: string | null
  image_url: string | null
  is_active: boolean
  sort_order: number
}

interface Props {
  token: string
}

export default function BackgroundsPage({ token }: Props) {
  const [bgs, setBgs] = useState<DbBg[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const dragItem = useRef<number | null>(null)
  const dragOver = useRef<number | null>(null)

  async function load() {
    setLoading(true)
    try {
      setBgs(await fetchAllBackgrounds(token))
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function handleDragStart(idx: number) { dragItem.current = idx }
  function handleDragEnter(idx: number) { dragOver.current = idx }
  async function handleDragEnd() {
    if (dragItem.current === null || dragOver.current === null || dragItem.current === dragOver.current) {
      dragItem.current = null; dragOver.current = null; return
    }
    const reordered = [...bgs]
    const [removed] = reordered.splice(dragItem.current, 1)
    reordered.splice(dragOver.current, 0, removed)
    setBgs(reordered)
    dragItem.current = null; dragOver.current = null
    await reorderBackgrounds(token, reordered.map(b => b.id))
    load()
  }

  async function handleToggle(id: string) {
    await toggleBackground(token, id)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return
    await deleteBackgroundApi(token, id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[20px] font-bold text-txt">배경 관리</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-acc text-white font-bold text-[13px] px-4 py-2 rounded-xl
                     transition-all hover:-translate-y-0.5 active:scale-[0.97]"
        >
          {showForm ? '닫기' : '+ 배경 추가'}
        </button>
      </div>

      {showForm && <BgForm token={token} onCreated={() => { setShowForm(false); load() }} />}

      {loading ? (
        <p className="text-muted text-[14px]">불러오는 중...</p>
      ) : bgs.length === 0 ? (
        <p className="text-muted text-[14px]">등록된 커스텀 배경이 없습니다</p>
      ) : (
        <div className="grid gap-3">
          {bgs.map((b, idx) => (
            <div
              key={b.id}
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
              {/* Color preview */}
              <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-border">
                {b.image_url ? (
                  <img src={b.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full" style={{ background: b.bg || '#ddd' }} />
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-txt text-[14px] truncate">{b.label}</p>
                <p className="text-muted text-[11px]">
                  {b.type === 'star' ? '별 패턴' : b.type === 'heart' ? '하트 패턴' : b.type === 'solid' ? '단색' : '커스텀'}
                </p>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggle(b.id)}
                  className="relative inline-flex items-center w-[44px] h-[26px] rounded-full transition-colors duration-200 flex-shrink-0"
                  style={{ background: b.is_active ? '#4CD964' : '#ccc' }}
                >
                  <span
                    className="inline-block w-[22px] h-[22px] bg-white rounded-full shadow-md transition-all duration-200"
                    style={{ marginLeft: b.is_active ? 20 : 2 }}
                  />
                </button>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-red-50 text-red-500 hover:bg-red-100"
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

function BgForm({ token, onCreated }: { token: string; onCreated: () => void }) {
  const [label, setLabel] = useState('')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [mode, setMode] = useState<'color' | 'image'>('image')
  const [preview, setPreview] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFilePreview(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const formData = new FormData()
    formData.append('label', label)
    formData.append('type', mode === 'image' ? 'custom' : 'solid')
    formData.append('sort_order', '0')

    if (mode === 'image' && fileRef.current?.files?.[0]) {
      formData.append('image', fileRef.current.files[0])
    } else {
      formData.append('bg', bgColor)
    }

    try {
      await createBackgroundApi(token, formData)
      onCreated()
    } catch {
      alert('배경 등록 실패')
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-card border border-border p-5 mb-6">
      <h3 className="font-bold text-txt text-[16px] mb-4">새 배경 등록</h3>

      <div className="grid gap-4">
        <div>
          <label className="block text-[12px] font-bold text-txt2 mb-1">배경 이름</label>
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="예: 봄 꽃밭"
            required
            className="w-full px-3 py-2.5 rounded-xl border border-border text-[14px] outline-none focus:border-acc"
          />
        </div>

        <div>
          <label className="block text-[12px] font-bold text-txt2 mb-2">타입</label>
          <div className="flex gap-2">
            {(['image', 'color'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className="px-4 py-2 rounded-xl text-[13px] font-bold border transition-all"
                style={mode === m
                  ? { background: '#E8F8F0', borderColor: '#2EC27E', color: '#1A9E5E' }
                  : { background: '#fff', borderColor: '#DDE3E5', color: '#4A6358' }
                }
              >
                {m === 'image' ? '이미지 업로드' : '단색'}
              </button>
            ))}
          </div>
        </div>

        {mode === 'image' ? (
          <div>
            <label className="block w-full aspect-[4/3] rounded-xl border-2 border-dashed border-border
                              bg-acc-light cursor-pointer overflow-hidden hover:border-acc transition-colors">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFilePreview}
                className="hidden"
              />
              {preview ? (
                <img src={preview} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-acc text-[14px] font-bold">
                  + 이미지 선택
                </div>
              )}
            </label>
          </div>
        ) : (
          <div>
            <label className="block text-[12px] font-bold text-txt2 mb-1">색상</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={bgColor}
                onChange={e => setBgColor(e.target.value)}
                className="w-12 h-12 rounded-lg border border-border cursor-pointer"
              />
              <input
                value={bgColor}
                onChange={e => setBgColor(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl border border-border text-[14px] outline-none focus:border-acc"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-acc text-white font-bold text-[14px] rounded-xl py-3
                     transition-all hover:-translate-y-0.5 active:scale-[0.97]
                     disabled:opacity-50"
        >
          {submitting ? '등록 중...' : '배경 등록'}
        </button>
      </div>
    </form>
  )
}
