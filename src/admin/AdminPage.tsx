import { useEffect, useRef, useState, type DragEvent } from 'react'
import { drawFramePreview, drawBgThumb } from '../lib/canvas'
import type { FrameOption, BgOption } from '../types'
import type { Config, ConfigFrame, ConfigBg } from '../hooks/useConfig'
import { GITHUB_OWNER, GITHUB_REPO } from '../hooks/useConfig'

const ADMIN_PASSWORD = 'qquqqu2024'

// ── GitHub API 헬퍼 ──
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

  function onDragStart(idx: number) {
    dragIdx.current = idx
  }
  function onDragOver(e: DragEvent, idx: number) {
    e.preventDefault()
    overIdx.current = idx
  }
  function onDragEnd() {
    if (dragIdx.current === null || overIdx.current === null || dragIdx.current === overIdx.current) {
      dragIdx.current = null
      overIdx.current = null
      return
    }
    const arr = [...items]
    const [moved] = arr.splice(dragIdx.current, 1)
    arr.splice(overIdx.current, 0, moved)
    setItems(arr)
    dragIdx.current = null
    overIdx.current = null
  }
  return { onDragStart, onDragOver, onDragEnd }
}

// ── 프레임 리스트 아이템 ──
function FrameItem({ frame, active, onToggle, onDelete, idx, drag }: {
  frame: FrameOption; active: boolean; onToggle: () => void; onDelete: () => void
  idx: number; drag: ReturnType<typeof useDragSort>
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = canvasRef.current
    if (c) drawFramePreview(c, frame, '2x2')
  }, [frame])

  return (
    <div
      draggable
      onDragStart={() => drag.onDragStart(idx)}
      onDragOver={e => drag.onDragOver(e, idx)}
      onDragEnd={drag.onDragEnd}
      className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 border border-border"
    >
      <span className="cursor-grab text-muted text-[14px] select-none">⠿</span>
      <canvas ref={canvasRef} width={48} height={48} className="rounded-lg flex-shrink-0" style={{ display: 'block' }} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-txt truncate">{frame.name}</p>
        <p className="text-[11px] text-muted">{frame.type === 'png' ? 'PNG' : frame.type === 'solid' ? '단색' : '패턴'}</p>
      </div>
      <button onClick={onToggle}
        className="w-10 h-6 rounded-full transition-colors flex-shrink-0"
        style={{ background: active ? '#2EC27E' : '#DDE3E5' }}
      >
        <div className="w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5"
          style={{ transform: active ? 'translateX(18px)' : 'translateX(2px)' }} />
      </button>
      <button onClick={onDelete} className="text-[11px] text-red-400 hover:text-red-600 flex-shrink-0">삭제</button>
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

  const typeLabel = bg.type === 'star' ? '별 패턴' : bg.type === 'heart' ? '하트 패턴' : bg.type === 'solid' ? '단색' : bg.type === 'none' ? '없음' : bg.type

  return (
    <div
      draggable
      onDragStart={() => drag.onDragStart(idx)}
      onDragOver={e => drag.onDragOver(e, idx)}
      onDragEnd={drag.onDragEnd}
      className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 border border-border"
    >
      <span className="cursor-grab text-muted text-[14px] select-none">⠿</span>
      <canvas ref={canvasRef} width={40} height={40} className="rounded-lg flex-shrink-0" style={{ display: 'block' }} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-txt truncate">{bg.label}</p>
        <p className="text-[11px] text-muted">{typeLabel}</p>
      </div>
      <button onClick={onToggle}
        className="w-10 h-6 rounded-full transition-colors flex-shrink-0"
        style={{ background: active ? '#2EC27E' : '#DDE3E5' }}
      >
        <div className="w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5"
          style={{ transform: active ? 'translateX(18px)' : 'translateX(2px)' }} />
      </button>
      <button onClick={onDelete} className="text-[11px] text-red-400 hover:text-red-600 flex-shrink-0">삭제</button>
    </div>
  )
}

// ── 프레임 추가 폼 ──
function AddFrameForm({ onAdd, uploading }: { onAdd: (frame: ConfigFrame, png1x4?: File, png2x2?: File) => void; uploading: boolean }) {
  const [name, setName] = useState('')
  const [type, setType] = useState<'png' | 'solid' | 'pattern'>('png')
  const [bg, setBg] = useState('#ffffff')
  const [textColor, setTextColor] = useState('#1a2e24')
  const [pattern, setPattern] = useState<'heart' | 'dot' | 'star'>('heart')
  const [png1x4, setPng1x4] = useState<File | null>(null)
  const [png2x2, setPng2x2] = useState<File | null>(null)

  function handleSubmit() {
    if (!name.trim()) return
    const id = `${type}-${Date.now()}`
    const frame: ConfigFrame = {
      id, name: name.trim(), bg, textColor, type, active: true,
      ...(type === 'pattern' ? { pattern } : {}),
      ...(type === 'png' ? { pngUrl1x4: `./frames/${id}-1x4.png`, pngUrl2x2: `./frames/${id}-2x2.png` } : {}),
    }
    onAdd(frame, png1x4 ?? undefined, png2x2 ?? undefined)
    setName(''); setPng1x4(null); setPng2x2(null)
  }

  return (
    <div className="bg-white rounded-xl border border-border p-4 mb-4">
      <h3 className="text-[14px] font-bold text-txt mb-3">프레임 추가</h3>
      <div className="space-y-3">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="프레임 이름"
          className="w-full border border-border rounded-lg px-3 py-2 text-[13px] outline-none focus:border-acc" />
        <div className="flex gap-2">
          {(['png', 'solid', 'pattern'] as const).map(t => (
            <button key={t} onClick={() => setType(t)} className="px-3 py-1.5 rounded-lg text-[12px] font-bold"
              style={{ background: type === t ? '#2EC27E' : '#f0f0f0', color: type === t ? '#fff' : '#4A6358' }}>
              {t === 'png' ? 'PNG' : t === 'solid' ? '단색' : '패턴'}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 text-[12px] text-txt2">
            배경색 <input type="color" value={bg} onChange={e => setBg(e.target.value)} className="w-8 h-8 rounded border-0 cursor-pointer" />
          </label>
          <label className="flex items-center gap-2 text-[12px] text-txt2">
            텍스트색 <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-8 h-8 rounded border-0 cursor-pointer" />
          </label>
        </div>
        {type === 'pattern' && (
          <div className="flex gap-2">
            {(['heart', 'dot', 'star'] as const).map(p => (
              <button key={p} onClick={() => setPattern(p)} className="px-3 py-1.5 rounded-lg text-[12px] font-bold"
                style={{ background: pattern === p ? '#2EC27E' : '#f0f0f0', color: pattern === p ? '#fff' : '#4A6358' }}>
                {p === 'heart' ? '♥ 하트' : p === 'dot' ? '● 도트' : '★ 별'}
              </button>
            ))}
          </div>
        )}
        {type === 'png' && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[12px] text-txt2">
              1x4 PNG (334x1039): <input type="file" accept=".png" onChange={e => setPng1x4(e.target.files?.[0] ?? null)} className="text-[12px]" />
            </label>
            <label className="flex items-center gap-2 text-[12px] text-txt2">
              2x2 PNG (632x909): <input type="file" accept=".png" onChange={e => setPng2x2(e.target.files?.[0] ?? null)} className="text-[12px]" />
            </label>
          </div>
        )}
        <button onClick={handleSubmit}
          disabled={!name.trim() || (type === 'png' && (!png1x4 || !png2x2)) || uploading}
          className="w-full bg-acc text-white font-bold rounded-lg py-2.5 text-[13px] disabled:opacity-50 disabled:cursor-not-allowed">
          {uploading ? '업로드 중...' : '추가하기'}
        </button>
      </div>
    </div>
  )
}

// ── 배경 추가 폼 ──
function AddBgForm({ onAdd }: { onAdd: (bg: ConfigBg) => void }) {
  const [label, setLabel] = useState('')
  const [type, setType] = useState<'solid' | 'star' | 'heart'>('solid')
  const [bg, setBg] = useState('#ffffff')
  const [patternColor, setPatternColor] = useState('#c8e6d4')

  function handleSubmit() {
    if (!label.trim()) return
    const id = `${type}-${Date.now()}`
    const newBg: ConfigBg = {
      id, label: label.trim(), type, bg, active: true,
      ...(type !== 'solid' ? { patternColor } : {}),
    }
    onAdd(newBg)
    setLabel('')
  }

  return (
    <div className="bg-white rounded-xl border border-border p-4 mb-4">
      <h3 className="text-[14px] font-bold text-txt mb-3">배경 추가</h3>
      <div className="space-y-3">
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="배경 이름"
          className="w-full border border-border rounded-lg px-3 py-2 text-[13px] outline-none focus:border-acc" />
        <div className="flex gap-2">
          {(['solid', 'star', 'heart'] as const).map(t => (
            <button key={t} onClick={() => setType(t)} className="px-3 py-1.5 rounded-lg text-[12px] font-bold"
              style={{ background: type === t ? '#2EC27E' : '#f0f0f0', color: type === t ? '#fff' : '#4A6358' }}>
              {t === 'solid' ? '단색' : t === 'star' ? '★ 별' : '♥ 하트'}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 text-[12px] text-txt2">
            배경색 <input type="color" value={bg} onChange={e => setBg(e.target.value)} className="w-8 h-8 rounded border-0 cursor-pointer" />
          </label>
          {type !== 'solid' && (
            <label className="flex items-center gap-2 text-[12px] text-txt2">
              패턴색 <input type="color" value={patternColor} onChange={e => setPatternColor(e.target.value)} className="w-8 h-8 rounded border-0 cursor-pointer" />
            </label>
          )}
        </div>
        <button onClick={handleSubmit} disabled={!label.trim()}
          className="w-full bg-acc text-white font-bold rounded-lg py-2.5 text-[13px] disabled:opacity-50 disabled:cursor-not-allowed">
          추가하기
        </button>
      </div>
    </div>
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
  const [showAddFrame, setShowAddFrame] = useState(false)
  const [showAddBg, setShowAddBg] = useState(false)

  const frameDrag = useDragSort(safeFrames, (frames) => setConfig(prev => ({ ...prev, frames })))
  const bgDrag = useDragSort(safeBgs, (backgrounds) => setConfig(prev => ({ ...prev, backgrounds })))

  function handleLogin() {
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
    if (!confirm('이 프레임을 삭제하시겠습니까?')) return
    setConfig(prev => ({ ...prev, frames: prev.frames.filter(f => f.id !== id) }))
  }
  function deleteBg(id: string) {
    if (!confirm('이 배경을 삭제하시겠습니까?')) return
    setConfig(prev => ({ ...prev, backgrounds: prev.backgrounds.filter(b => b.id !== id) }))
  }

  async function handleAddFrame(frame: ConfigFrame, png1x4?: File, png2x2?: File) {
    const token = localStorage.getItem('qquqqu_gh_token')
    if (!token) return
    if (frame.type === 'png' && png1x4 && png2x2) {
      setUploading(true); setMessage('')
      try {
        const [d1, d2] = await Promise.all([fileToBase64(png1x4), fileToBase64(png2x2)])
        await Promise.all([uploadPngToGitHub(token, `${frame.id}-1x4.png`, d1), uploadPngToGitHub(token, `${frame.id}-2x2.png`, d2)])
      } catch (e: unknown) {
        setMessage(`PNG 업로드 실패: ${e instanceof Error ? e.message : '알 수 없는 오류'}`)
        setUploading(false); return
      }
      setUploading(false)
    }
    setConfig(prev => ({ ...prev, frames: [...prev.frames, frame] }))
    setShowAddFrame(false)
    setMessage('프레임이 추가되었습니다. "저장하기"를 눌러 적용하세요.')
  }

  function handleAddBg(bg: ConfigBg) {
    setConfig(prev => ({ ...prev, backgrounds: [...prev.backgrounds, bg] }))
    setShowAddBg(false)
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
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-[340px]">
          <h1 className="text-xl font-bold text-txt mb-1">관리자 로그인</h1>
          <p className="text-muted text-[13px] mb-6">Born ★ qquqqu Admin</p>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="비밀번호"
            className="w-full border border-border rounded-xl px-4 py-3 text-[14px] mb-3 outline-none focus:border-acc" />
          {needToken && (
            <input type="password" value={ghToken} onChange={e => setGhToken(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="GitHub 토큰 (최초 1회)"
              className="w-full border border-border rounded-xl px-4 py-3 text-[14px] mb-3 outline-none focus:border-acc" />
          )}
          {loginError && <p className="text-red-500 text-[12px] mb-3">{loginError}</p>}
          <button onClick={handleLogin} className="w-full bg-acc text-white font-bold rounded-xl py-3 text-[14px]">로그인</button>
        </div>
      </div>
    )
  }

  // ── 메인 관리 화면 ──
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[640px] mx-auto px-5 py-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-txt">템플릿 관리</h1>
            <p className="text-muted text-[12px]">Born ★ qquqqu Admin</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { localStorage.removeItem('qquqqu_gh_token'); window.location.reload() }}
              className="text-[12px] text-muted border border-border rounded-lg px-3 py-1.5">토큰 초기화</button>
            <button onClick={() => { window.location.hash = ''; window.location.reload() }}
              className="text-[12px] text-muted border border-border rounded-lg px-3 py-1.5">나가기</button>
          </div>
        </div>

        {loading ? (
          <p className="text-muted text-center py-12">불러오는 중...</p>
        ) : (
          <>
            {/* 프레임 섹션 */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[16px] font-bold text-txt">프레임</h2>
                <div className="flex items-center gap-3">
                  <span className="text-[12px] text-muted">{safeFrames.filter(f => f.active).length}/{safeFrames.length}개 활성</span>
                  <button onClick={() => setShowAddFrame(!showAddFrame)}
                    className="text-[12px] font-bold text-white bg-acc rounded-lg px-3 py-1.5">
                    {showAddFrame ? '닫기' : '+ 추가'}
                  </button>
                </div>
              </div>
              {showAddFrame && <AddFrameForm onAdd={handleAddFrame} uploading={uploading} />}
              <div className="space-y-2">
                {safeFrames.map((f, i) => (
                  <FrameItem key={f.id} frame={f} active={f.active} idx={i} drag={frameDrag}
                    onToggle={() => toggleFrame(f.id)} onDelete={() => deleteFrame(f.id)} />
                ))}
              </div>
            </section>

            {/* 배경 섹션 */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[16px] font-bold text-txt">배경</h2>
                <div className="flex items-center gap-3">
                  <span className="text-[12px] text-muted">{safeBgs.filter(b => b.active).length}/{safeBgs.length}개 활성</span>
                  <button onClick={() => setShowAddBg(!showAddBg)}
                    className="text-[12px] font-bold text-white bg-acc rounded-lg px-3 py-1.5">
                    {showAddBg ? '닫기' : '+ 추가'}
                  </button>
                </div>
              </div>
              {showAddBg && <AddBgForm onAdd={handleAddBg} />}
              <div className="space-y-2">
                {safeBgs.map((b, i) => (
                  <BgItem key={b.id} bg={b} active={b.active} idx={i} drag={bgDrag}
                    onToggle={() => toggleBg(b.id)} onDelete={() => deleteBg(b.id)} />
                ))}
              </div>
            </section>

            {/* 메시지 */}
            {message && (
              <p className={`text-[13px] text-center mb-4 ${message.includes('실패') ? 'text-red-500' : 'text-acc'}`}>{message}</p>
            )}

            {/* 저장 버튼 */}
            <button onClick={handleSave} disabled={saving}
              className="w-full bg-acc text-white font-bold rounded-2xl py-4 text-[15px] transition-all hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? '저장 중...' : '저장하기'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
