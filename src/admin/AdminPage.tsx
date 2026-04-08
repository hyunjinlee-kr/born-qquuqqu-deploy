import { useEffect, useRef, useState, type DragEvent } from 'react'
import { drawFramePreview, drawBgThumb } from '../lib/canvas'
import type { FrameOption, BgOption } from '../types'
import type { Config, ConfigFrame, ConfigBg } from '../hooks/useConfig'
import { GITHUB_OWNER, GITHUB_REPO } from '../hooks/useConfig'

const ADMIN_PASSWORD = 'qquqqu2024'

// ── GitHub API ──
async function ghFetch(path: string, token: string, options?: RequestInit) {
  return fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/${path}`, {
    ...options,
    headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json', ...(options?.headers || {}) },
    cache: 'no-store',
  })
}

async function fetchConfigFromGitHub(token: string): Promise<{ config: Config; sha: string }> {
  const res = await ghFetch(`contents/config.json?ref=gh-pages&t=${Date.now()}`, token)
  if (!res.ok) throw new Error('config.json을 찾을 수 없습니다')
  const data = await res.json()
  const decoded = new TextDecoder().decode(Uint8Array.from(atob(data.content), c => c.charCodeAt(0)))
  return { config: JSON.parse(decoded), sha: data.sha }
}

async function saveConfigToGitHub(token: string, config: Config, sha: string) {
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(config, null, 2) + '\n')))
  const res = await ghFetch('contents/config.json', token, {
    method: 'PUT',
    body: JSON.stringify({ message: 'admin: update config.json', content, sha, branch: 'gh-pages' }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || '저장 실패')
  }
}

async function uploadPngToGitHub(token: string, fileName: string, base64Data: string) {
  const checkRes = await ghFetch(`contents/frames/${fileName}?ref=gh-pages`, token)
  let sha: string | undefined
  if (checkRes.ok) sha = (await checkRes.json()).sha
  const body: Record<string, string> = { message: `admin: upload ${fileName}`, content: base64Data, branch: 'gh-pages' }
  if (sha) body.sha = sha
  const res = await ghFetch(`contents/frames/${fileName}`, token, { method: 'PUT', body: JSON.stringify(body) })
  if (!res.ok) throw new Error('PNG 업로드 실패')
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ── 드래그 정렬 훅 ──
function useDragSort<T>(items: T[], setItems: (items: T[]) => void) {
  const dragIdx = useRef<number | null>(null)
  const overIdx = useRef<number | null>(null)

  function onDragStart(idx: number) { dragIdx.current = idx }
  function onDragOver(e: DragEvent, idx: number) { e.preventDefault(); overIdx.current = idx }
  function onDragEnd() {
    if (dragIdx.current === null || overIdx.current === null || dragIdx.current === overIdx.current) {
      dragIdx.current = null; overIdx.current = null; return
    }
    const arr = [...items]
    const [moved] = arr.splice(dragIdx.current, 1)
    arr.splice(overIdx.current, 0, moved)
    setItems(arr)
    dragIdx.current = null; overIdx.current = null
  }
  return { onDragStart, onDragOver, onDragEnd }
}

// ── iOS 토글 스위치 ──
function Toggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className="relative inline-flex items-center w-[44px] h-[26px] rounded-full transition-colors duration-200 flex-shrink-0"
      style={{ background: active ? '#4CD964' : '#ccc' }}>
      <span className="inline-block w-[22px] h-[22px] bg-white rounded-full shadow-md transition-all duration-200"
        style={{ marginLeft: active ? 20 : 2 }} />
    </button>
  )
}

// GitHub raw URL 변환
function toRawUrl(path?: string) {
  if (!path) return null
  const fileName = path.replace('./', '').replace(/^frames\//, '')
  return `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/gh-pages/frames/${fileName}`
}

// ── 프레임 리스트 아이템 ──
function FrameItem({ frame, active, onToggle, onDelete, idx, drag }: {
  frame: FrameOption; active: boolean; onToggle: () => void; onDelete: () => void
  idx: number; drag: ReturnType<typeof useDragSort>
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isPng = frame.type === 'png'
  const thumbUrl = isPng ? toRawUrl(frame.pngUrl1x4 ?? frame.pngUrl2x2) : null

  useEffect(() => {
    if (!isPng) {
      const c = canvasRef.current
      if (c) drawFramePreview(c, frame, '2x2')
    }
  }, [frame, isPng])

  return (
    <div draggable onDragStart={() => drag.onDragStart(idx)} onDragOver={e => drag.onDragOver(e, idx)} onDragEnd={drag.onDragEnd}
      className="bg-white rounded-2xl border border-border p-4 flex items-center gap-4 cursor-default">
      <div className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted select-none text-[18px] leading-none" style={{ touchAction: 'none' }}>⠿</div>
      <div className="flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
        {isPng && thumbUrl ? (
          <img src={thumbUrl} alt={frame.name} className="w-full h-full object-cover" />
        ) : isPng ? (
          <span className="text-muted text-[11px]">PNG</span>
        ) : (
          <canvas ref={canvasRef} width={64} height={80} style={{ display: 'block' }} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-txt text-[14px] truncate">{frame.name}</p>
        <p className="text-muted text-[12px]">
          {isPng ? 'PNG 오버레이' : frame.type === 'solid' ? '단색' : '패턴'}
          {isPng && (
            <span className="ml-1 text-[11px]">
              ({frame.pngUrl1x4 && frame.pngUrl2x2 ? '세로형 + 그리드형' : frame.pngUrl1x4 ? '세로형' : '그리드형'})
            </span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Toggle active={active} onToggle={onToggle} />
        <button onClick={onDelete} className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-red-50 text-red-500 hover:bg-red-100 transition-all">삭제</button>
      </div>
    </div>
  )
}

// ── 배경 리스트 아이템 ──
function BgItem({ bg, active, onToggle, onDelete, idx, drag }: {
  bg: BgOption; active: boolean; onToggle: () => void; onDelete: () => void
  idx: number; drag: ReturnType<typeof useDragSort>
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = canvasRef.current
    if (c) drawBgThumb(c, bg)
  }, [bg])

  const typeLabel = bg.type === 'star' ? '별 패턴' : bg.type === 'heart' ? '하트 패턴' : bg.type === 'solid' ? '단색' : bg.type === 'none' ? '없음' : '커스텀'

  return (
    <div draggable onDragStart={() => drag.onDragStart(idx)} onDragOver={e => drag.onDragOver(e, idx)} onDragEnd={drag.onDragEnd}
      className="bg-white rounded-2xl border border-border p-4 flex items-center gap-4 cursor-default">
      <div className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted select-none text-[18px] leading-none" style={{ touchAction: 'none' }}>⠿</div>
      <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-border">
        <canvas ref={canvasRef} width={48} height={48} style={{ display: 'block' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-txt text-[14px] truncate">{bg.label}</p>
        <p className="text-muted text-[11px]">{typeLabel}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Toggle active={active} onToggle={onToggle} />
        <button onClick={onDelete} className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-red-50 text-red-500 hover:bg-red-100 transition-all">삭제</button>
      </div>
    </div>
  )
}

// ── 프레임 추가 폼 ──
function AddFrameForm({ onAdd, uploading }: { onAdd: (frame: ConfigFrame, png1x4?: File, png2x2?: File) => void; uploading: boolean }) {
  const [name, setName] = useState('')
  const [type, setType] = useState<'png' | 'solid' | 'pattern'>('png')
  const [layout, setLayout] = useState<'1x4' | '2x2' | 'both'>('both')
  const [pattern, setPattern] = useState<'heart' | 'dot' | 'star'>('heart')
  const [png1x4, setPng1x4] = useState<File | null>(null)
  const [png2x2, setPng2x2] = useState<File | null>(null)
  const [preview1x4, setPreview1x4] = useState<string | null>(null)
  const [preview2x2, setPreview2x2] = useState<string | null>(null)

  function handleFile1x4(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setPng1x4(f)
    setPreview1x4(f ? URL.createObjectURL(f) : null)
  }
  function handleFile2x2(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setPng2x2(f)
    setPreview2x2(f ? URL.createObjectURL(f) : null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const id = `${type}-${Date.now()}`
    const frame: ConfigFrame = {
      id, name: name.trim(), bg: '#ffffff', textColor: '#1a2e24', type, active: true,
      ...(type === 'pattern' ? { pattern } : {}),
      ...(type === 'png' ? {
        pngUrl1x4: (layout === '1x4' || layout === 'both') ? `./frames/${id}-1x4.png` : undefined,
        pngUrl2x2: (layout === '2x2' || layout === 'both') ? `./frames/${id}-2x2.png` : undefined,
      } : {}),
    }
    onAdd(frame, png1x4 ?? undefined, png2x2 ?? undefined)
    setName(''); setPng1x4(null); setPng2x2(null); setPreview1x4(null); setPreview2x2(null)
  }

  const typeOptions = [
    { value: 'png' as const, label: 'PNG 오버레이' },
    { value: 'solid' as const, label: '단색' },
    { value: 'pattern' as const, label: '패턴' },
  ]

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-5 mb-6">
      <h3 className="font-bold text-txt text-[16px] mb-4">새 프레임 등록</h3>
      <div className="grid gap-4">
        <div>
          <label className="block text-[12px] font-bold text-txt2 mb-1">프레임 이름</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="예: 벚꽃 프레임"
            className="w-full px-3 py-2.5 rounded-xl border border-border text-[14px] outline-none focus:border-acc" />
        </div>
        <div>
          <label className="block text-[12px] font-bold text-txt2 mb-2">프레임 타입</label>
          <div className="flex gap-2">
            {typeOptions.map(opt => (
              <button key={opt.value} type="button" onClick={() => setType(opt.value)}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold border transition-all"
                style={type === opt.value
                  ? { background: '#E8F8F0', borderColor: '#2EC27E', color: '#1A9E5E' }
                  : { background: '#fff', borderColor: '#DDE3E5', color: '#4A6358' }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {type === 'pattern' && (
          <div>
            <label className="block text-[12px] font-bold text-txt2 mb-2">패턴 종류</label>
            <div className="flex gap-2">
              {([{ v: 'heart' as const, l: '♥ 하트' }, { v: 'dot' as const, l: '● 도트' }, { v: 'star' as const, l: '★ 별' }]).map(p => (
                <button key={p.v} type="button" onClick={() => setPattern(p.v)}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-bold border transition-all"
                  style={pattern === p.v
                    ? { background: '#E8F8F0', borderColor: '#2EC27E', color: '#1A9E5E' }
                    : { background: '#fff', borderColor: '#DDE3E5', color: '#4A6358' }}>
                  {p.l}
                </button>
              ))}
            </div>
          </div>
        )}
        {type === 'png' && (
          <>
            <div>
              <label className="block text-[12px] font-bold text-txt2 mb-2">레이아웃 타입</label>
              <div className="flex gap-2">
                {([
                  { value: '1x4' as const, label: '세로형 (1x4)' },
                  { value: '2x2' as const, label: '그리드형 (2x2)' },
                  { value: 'both' as const, label: '세로형 + 그리드형' },
                ]).map(opt => (
                  <button key={opt.value} type="button" onClick={() => setLayout(opt.value)}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-bold border transition-all"
                    style={layout === opt.value
                      ? { background: '#E8F8F0', borderColor: '#2EC27E', color: '#1A9E5E' }
                      : { background: '#fff', borderColor: '#DDE3E5', color: '#4A6358' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={`grid gap-3 ${layout === 'both' ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {(layout === '1x4' || layout === 'both') && (
                <div>
                  <label className="block text-[12px] font-bold text-txt2 mb-1">세로형 PNG (334x1039)</label>
                  <label className="block w-full aspect-[4/10] max-h-[280px] rounded-xl border-2 border-dashed border-border bg-acc-light cursor-pointer overflow-hidden hover:border-acc transition-colors">
                    <input type="file" accept="image/png" className="hidden" onChange={handleFile1x4} />
                    {preview1x4 ? (
                      <img src={preview1x4} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-acc text-[13px] font-bold gap-1">
                        <span className="text-2xl">+</span>세로형 업로드
                      </div>
                    )}
                  </label>
                </div>
              )}
              {(layout === '2x2' || layout === 'both') && (
                <div>
                  <label className="block text-[12px] font-bold text-txt2 mb-1">그리드형 PNG (632x909)</label>
                  <label className="block w-full aspect-[4/5] max-h-[280px] rounded-xl border-2 border-dashed border-border bg-acc-light cursor-pointer overflow-hidden hover:border-acc transition-colors">
                    <input type="file" accept="image/png" className="hidden" onChange={handleFile2x2} />
                    {preview2x2 ? (
                      <img src={preview2x2} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-acc text-[13px] font-bold gap-1">
                        <span className="text-2xl">+</span>그리드형 업로드
                      </div>
                    )}
                  </label>
                </div>
              )}
            </div>
          </>
        )}
        {type === 'png' && (
          <p className="text-muted text-[11px]">PNG-24 + 알파채널 필수. 사진 셀 영역은 완전 투명(alpha=0)으로 제작. 최대 5MB.</p>
        )}
        <button type="submit" disabled={!name.trim() || (type === 'png' && (
          (layout === '1x4' && !png1x4) || (layout === '2x2' && !png2x2) || (layout === 'both' && (!png1x4 || !png2x2))
        )) || uploading}
          className="w-full bg-acc text-white font-bold text-[14px] rounded-xl py-3 transition-all hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-50">
          {uploading ? '등록 중...' : '프레임 등록'}
        </button>
      </div>
    </form>
  )
}

// ── 배경 추가 폼 ──
function AddBgForm({ onAdd }: { onAdd: (bg: ConfigBg) => void }) {
  const [label, setLabel] = useState('')
  const [mode, setMode] = useState<'solid' | 'star' | 'heart'>('solid')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [patternColor, setPatternColor] = useState('#c8e6d4')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim()) return
    const id = `${mode}-${Date.now()}`
    const newBg: ConfigBg = {
      id, label: label.trim(), type: mode, bg: bgColor, active: true,
      ...(mode !== 'solid' ? { patternColor } : {}),
    }
    onAdd(newBg)
    setLabel('')
  }

  const typeOptions = [
    { value: 'solid' as const, label: '단색' },
    { value: 'star' as const, label: '★ 별 패턴' },
    { value: 'heart' as const, label: '♥ 하트 패턴' },
  ]

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-5 mb-6">
      <h3 className="font-bold text-txt text-[16px] mb-4">새 배경 등록</h3>
      <div className="grid gap-4">
        <div>
          <label className="block text-[12px] font-bold text-txt2 mb-1">배경 이름</label>
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder="예: 봄 꽃밭"
            className="w-full px-3 py-2.5 rounded-xl border border-border text-[14px] outline-none focus:border-acc" />
        </div>
        <div>
          <label className="block text-[12px] font-bold text-txt2 mb-2">타입</label>
          <div className="flex gap-2">
            {typeOptions.map(opt => (
              <button key={opt.value} type="button" onClick={() => setMode(opt.value)}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold border transition-all"
                style={mode === opt.value
                  ? { background: '#E8F8F0', borderColor: '#2EC27E', color: '#1A9E5E' }
                  : { background: '#fff', borderColor: '#DDE3E5', color: '#4A6358' }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-[12px] font-bold text-txt2 mb-1">배경색</label>
            <div className="flex items-center gap-2">
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
              <input value={bgColor} onChange={e => setBgColor(e.target.value)} className="flex-1 px-3 py-2.5 rounded-xl border border-border text-[14px] outline-none focus:border-acc" />
            </div>
          </div>
          {mode !== 'solid' && (
            <div className="flex-1">
              <label className="block text-[12px] font-bold text-txt2 mb-1">패턴색</label>
              <div className="flex items-center gap-2">
                <input type="color" value={patternColor} onChange={e => setPatternColor(e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                <input value={patternColor} onChange={e => setPatternColor(e.target.value)} className="flex-1 px-3 py-2.5 rounded-xl border border-border text-[14px] outline-none focus:border-acc" />
              </div>
            </div>
          )}
        </div>
        <button type="submit" disabled={!label.trim()}
          className="w-full bg-acc text-white font-bold text-[14px] rounded-xl py-3 transition-all hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-50">
          배경 등록
        </button>
      </div>
    </form>
  )
}

// ── 메인 어드민 페이지 ──
export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [ghToken, setGhToken] = useState(localStorage.getItem('qquqqu_gh_token') ?? '')
  const [needToken] = useState(!localStorage.getItem('qquqqu_gh_token'))
  const [loginError, setLoginError] = useState('')

  const [config, setConfig] = useState<Config>({ frames: [], backgrounds: [] })
  const safeFrames = config.frames ?? []
  const safeBgs = config.backgrounds ?? []
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [tab, setTab] = useState<'frames' | 'backgrounds'>('frames')
  const [showForm, setShowForm] = useState(false)

  const frameDrag = useDragSort(safeFrames, (frames) => setConfig(prev => ({ ...prev, frames })))
  const bgDrag = useDragSort(safeBgs, (backgrounds) => setConfig(prev => ({ ...prev, backgrounds })))

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (password !== ADMIN_PASSWORD) { setLoginError('비밀번호가 틀렸습니다'); return }
    if (needToken && !ghToken.trim()) { setLoginError('GitHub 토큰을 입력해주세요'); return }
    if (ghToken.trim()) localStorage.setItem('qquqqu_gh_token', ghToken.trim())
    setLoginError(''); setAuthed(true)
  }

  async function loadConfig() {
    const token = localStorage.getItem('qquqqu_gh_token')
    if (!token) return
    setLoading(true); setMessage('')
    try {
      const { config: c } = await fetchConfigFromGitHub(token)
      setConfig(c)
    } catch (e: unknown) {
      setMessage(`불러오기 실패: ${e instanceof Error ? e.message : '알 수 없는 오류'}`)
    } finally { setLoading(false) }
  }

  useEffect(() => { if (authed) loadConfig() }, [authed])

  function toggleFrame(id: string) {
    setConfig(prev => ({ ...prev, frames: prev.frames.map(f => f.id === id ? { ...f, active: !f.active } : f) }))
  }
  function toggleBg(id: string) {
    setConfig(prev => ({ ...prev, backgrounds: prev.backgrounds.map(b => b.id === id ? { ...b, active: !b.active } : b) }))
  }
  function deleteFrame(id: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return
    setConfig(prev => ({ ...prev, frames: prev.frames.filter(f => f.id !== id) }))
  }
  function deleteBg(id: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return
    setConfig(prev => ({ ...prev, backgrounds: prev.backgrounds.filter(b => b.id !== id) }))
  }

  async function handleAddFrame(frame: ConfigFrame, png1x4?: File, png2x2?: File) {
    const token = localStorage.getItem('qquqqu_gh_token')
    if (!token) return
    if (frame.type === 'png' && (png1x4 || png2x2)) {
      setUploading(true); setMessage('')
      try {
        const uploads: Promise<void>[] = []
        if (png1x4) uploads.push(fileToBase64(png1x4).then(d => uploadPngToGitHub(token, `${frame.id}-1x4.png`, d)))
        if (png2x2) uploads.push(fileToBase64(png2x2).then(d => uploadPngToGitHub(token, `${frame.id}-2x2.png`, d)))
        await Promise.all(uploads)
      } catch (e: unknown) {
        setMessage(`PNG 업로드 실패: ${e instanceof Error ? e.message : '알 수 없는 오류'}`)
        setUploading(false); return
      }
      setUploading(false)
    }
    setConfig(prev => ({ ...prev, frames: [...prev.frames, frame] }))
    setShowForm(false)
    setMessage('프레임이 추가되었습니다. "저장하기"를 눌러 적용하세요.')
  }

  function handleAddBg(bg: ConfigBg) {
    setConfig(prev => ({ ...prev, backgrounds: [...prev.backgrounds, bg] }))
    setShowForm(false)
    setMessage('배경이 추가되었습니다. "저장하기"를 눌러 적용하세요.')
  }

  async function handleSave() {
    const token = localStorage.getItem('qquqqu_gh_token')
    if (!token) return
    setSaving(true); setMessage('')
    try {
      const latest = await fetchConfigFromGitHub(token)
      await saveConfigToGitHub(token, config, latest.sha)
      setMessage('저장 완료! 노출 PC에서 새로고침하면 반영됩니다.')
    } catch (e: unknown) {
      setMessage(`저장 실패: ${e instanceof Error ? e.message : '알 수 없는 오류'}`)
    } finally { setSaving(false) }
  }

  // ── 로그인 화면 ──
  if (!authed) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-5">
        <form onSubmit={handleLogin} className="bg-white rounded-2xl border border-border shadow-lg p-8 w-full max-w-[380px]">
          <h1 className="text-[28px] font-black text-txt text-center mb-1" style={{ fontFamily: '"Playfair Display", serif' }}>
            Born <span className="text-acc">★</span> qquqqu
          </h1>
          <p className="text-muted text-[13px] text-center mb-8">Admin 로그인</p>
          {loginError && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[13px]">{loginError}</div>
          )}
          <div className="flex flex-col gap-4 mb-6">
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="비밀번호"
              className="w-full px-4 py-3 rounded-xl border border-border text-[14px] text-txt outline-none focus:border-acc transition-colors" />
            {needToken && (
              <input type="password" value={ghToken} onChange={e => setGhToken(e.target.value)}
                placeholder="GitHub 토큰 (최초 1회)"
                className="w-full px-4 py-3 rounded-xl border border-border text-[14px] text-txt outline-none focus:border-acc transition-colors" />
            )}
          </div>
          <button type="submit"
            className="w-full bg-acc text-white font-bold text-[15px] rounded-2xl py-3.5 transition-all hover:-translate-y-0.5 active:scale-[0.97]">
            로그인
          </button>
        </form>
      </div>
    )
  }

  // ── 메인 관리 화면 ──
  const tabs = [
    { id: 'frames' as const, label: '프레임 관리' },
    { id: 'backgrounds' as const, label: '배경 관리' },
  ]

  return (
    <div className="min-h-screen bg-bg">
      {/* 헤더 */}
      <header className="bg-white border-b border-border px-5 py-3 flex items-center justify-between sticky top-0 z-10">
        <h1 className="font-bold text-txt text-[16px]">
          Born <span className="text-acc">★</span> qquqqu <span className="text-muted text-[13px] font-normal ml-1">Admin</span>
        </h1>
        <div className="flex gap-3">
          <button onClick={() => { localStorage.removeItem('qquqqu_gh_token'); window.location.reload() }}
            className="text-[13px] text-txt2 hover:text-txt transition-colors">토큰 초기화</button>
          <button onClick={() => { window.location.hash = ''; window.location.reload() }}
            className="text-[13px] text-txt2 hover:text-txt transition-colors">나가기</button>
        </div>
      </header>

      {/* 탭 */}
      <nav className="bg-white border-b border-border px-5 flex gap-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setShowForm(false) }}
            className="px-4 py-3 text-[14px] font-bold border-b-2 transition-all"
            style={tab === t.id
              ? { borderColor: '#2EC27E', color: '#1A9E5E' }
              : { borderColor: 'transparent', color: '#8AAA96' }}>
            {t.label}
          </button>
        ))}
      </nav>

      {/* 콘텐츠 */}
      <main className="max-w-[800px] mx-auto p-5">
        {loading ? (
          <p className="text-muted text-center py-12">불러오는 중...</p>
        ) : (
          <>
            {/* 섹션 헤더 */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[20px] font-bold text-txt">
                {tab === 'frames' ? '프레임 관리' : '배경 관리'}
              </h2>
              <button onClick={() => setShowForm(!showForm)}
                className="bg-acc text-white font-bold text-[13px] px-4 py-2 rounded-xl transition-all hover:-translate-y-0.5 active:scale-[0.97]">
                {showForm ? '닫기' : tab === 'frames' ? '+ 프레임 추가' : '+ 배경 추가'}
              </button>
            </div>

            {/* 추가 폼 */}
            {showForm && tab === 'frames' && <AddFrameForm onAdd={handleAddFrame} uploading={uploading} />}
            {showForm && tab === 'backgrounds' && <AddBgForm onAdd={handleAddBg} />}

            {/* 리스트 */}
            <div className="space-y-3">
              {tab === 'frames' && safeFrames.map((f, i) => (
                <FrameItem key={f.id} frame={f} active={f.active} idx={i} drag={frameDrag}
                  onToggle={() => toggleFrame(f.id)} onDelete={() => deleteFrame(f.id)} />
              ))}
              {tab === 'backgrounds' && safeBgs.map((b, i) => (
                <BgItem key={b.id} bg={b} active={b.active} idx={i} drag={bgDrag}
                  onToggle={() => toggleBg(b.id)} onDelete={() => deleteBg(b.id)} />
              ))}
            </div>

            {/* 메시지 */}
            {message && (
              <p className={`text-[13px] text-center mt-6 mb-4 ${message.includes('실패') ? 'text-red-500' : 'text-acc'}`}>{message}</p>
            )}

            {/* 저장 버튼 */}
            <button onClick={handleSave} disabled={saving}
              className="w-full mt-6 bg-acc text-white font-bold text-[15px] rounded-2xl py-3.5 transition-all hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-50">
              {saving ? '저장 중...' : '저장하기'}
            </button>
          </>
        )}
      </main>
    </div>
  )
}
