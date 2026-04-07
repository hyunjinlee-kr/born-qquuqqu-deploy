import { useEffect, useRef, useState } from 'react'
import { FRAMES } from '../lib/frames'
import { BG_OPTIONS } from '../lib/backgrounds'
import { drawFramePreview, drawBgThumb } from '../lib/canvas'
import type { FrameOption, BgOption } from '../types'

const ADMIN_PASSWORD = 'qquqqu2024'

interface Config {
  activeFrames: string[]
  activeBackgrounds: string[]
}

// ── GitHub API 설정 ──
interface GitHubSettings {
  owner: string
  repo: string
  token: string
}

function getGitHubSettings(): GitHubSettings | null {
  const raw = localStorage.getItem('qquqqu_github')
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

function saveGitHubSettings(s: GitHubSettings) {
  localStorage.setItem('qquqqu_github', JSON.stringify(s))
}

// ── GitHub API로 config.json 읽기/쓰기 ──
async function fetchConfigFromGitHub(s: GitHubSettings): Promise<{ config: Config; sha: string }> {
  const res = await fetch(`https://api.github.com/repos/${s.owner}/${s.repo}/contents/config.json?ref=gh-pages`, {
    headers: { Authorization: `token ${s.token}` },
  })
  if (!res.ok) throw new Error('config.json을 찾을 수 없습니다')
  const data = await res.json()
  const content = JSON.parse(atob(data.content))
  return { config: content, sha: data.sha }
}

async function saveConfigToGitHub(s: GitHubSettings, config: Config, sha: string) {
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(config, null, 2) + '\n')))
  const res = await fetch(`https://api.github.com/repos/${s.owner}/${s.repo}/contents/config.json`, {
    method: 'PUT',
    headers: {
      Authorization: `token ${s.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'admin: update config.json',
      content,
      sha,
      branch: 'gh-pages',
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || '저장 실패')
  }
  const data = await res.json()
  return data.content.sha as string
}

// ── 프레임 미리보기 ──
function FrameThumbSmall({ frame, active, onToggle }: { frame: FrameOption; active: boolean; onToggle: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = canvasRef.current
    if (c) drawFramePreview(c, frame, '2x2')
  }, [frame])

  return (
    <button onClick={onToggle} className="flex flex-col items-center gap-1.5 transition-all">
      <div
        className="rounded-lg overflow-hidden transition-all duration-200"
        style={{
          width: 80, height: 80,
          opacity: active ? 1 : 0.3,
          border: active ? '3px solid #2EC27E' : '3px solid #DDE3E5',
        }}
      >
        <canvas ref={canvasRef} width={80} height={80} style={{ display: 'block' }} />
      </div>
      <span className="text-[10px] font-bold" style={{ color: active ? '#2EC27E' : '#8AAA96' }}>
        {frame.name}
      </span>
    </button>
  )
}

// ── 배경 미리보기 ──
function BgThumbSmall({ bg, active, onToggle }: { bg: BgOption; active: boolean; onToggle: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = canvasRef.current
    if (c) drawBgThumb(c, bg)
  }, [bg])

  return (
    <button onClick={onToggle} className="flex flex-col items-center gap-1.5 transition-all">
      <div
        className="rounded-lg overflow-hidden transition-all duration-200"
        style={{
          width: 64, height: 64,
          opacity: active ? 1 : 0.3,
          border: active ? '3px solid #2EC27E' : '3px solid #DDE3E5',
        }}
      >
        <canvas ref={canvasRef} width={64} height={64} style={{ display: 'block' }} />
      </div>
      <span className="text-[10px] font-bold" style={{ color: active ? '#2EC27E' : '#8AAA96' }}>
        {bg.label}
      </span>
    </button>
  )
}

// ── 메인 어드민 페이지 ──
export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [pwError, setPwError] = useState(false)

  const [ghSettings, setGhSettings] = useState<GitHubSettings | null>(getGitHubSettings)
  const [owner, setOwner] = useState(ghSettings?.owner ?? '')
  const [repo, setRepo] = useState(ghSettings?.repo ?? '')
  const [token, setToken] = useState(ghSettings?.token ?? '')
  const [showSettings, setShowSettings] = useState(!ghSettings)

  const [config, setConfig] = useState<Config>({ activeFrames: [], activeBackgrounds: [] })
  const [sha, setSha] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true)
      setPwError(false)
    } else {
      setPwError(true)
    }
  }

  function handleSaveSettings() {
    const s = { owner: owner.trim(), repo: repo.trim(), token: token.trim() }
    if (!s.owner || !s.repo || !s.token) return
    saveGitHubSettings(s)
    setGhSettings(s)
    setShowSettings(false)
    loadConfig(s)
  }

  async function loadConfig(s: GitHubSettings) {
    setLoading(true)
    setMessage('')
    try {
      const { config: c, sha: sh } = await fetchConfigFromGitHub(s)
      setConfig(c)
      setSha(sh)
    } catch (e: unknown) {
      setMessage(`불러오기 실패: ${e instanceof Error ? e.message : '알 수 없는 오류'}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authed && ghSettings) loadConfig(ghSettings)
  }, [authed])

  function toggleFrame(id: string) {
    setConfig(prev => ({
      ...prev,
      activeFrames: prev.activeFrames.includes(id)
        ? prev.activeFrames.filter(x => x !== id)
        : [...prev.activeFrames, id],
    }))
  }

  function toggleBg(id: string) {
    setConfig(prev => ({
      ...prev,
      activeBackgrounds: prev.activeBackgrounds.includes(id)
        ? prev.activeBackgrounds.filter(x => x !== id)
        : [...prev.activeBackgrounds, id],
    }))
  }

  async function handleSave() {
    if (!ghSettings) return
    setSaving(true)
    setMessage('')
    try {
      const newSha = await saveConfigToGitHub(ghSettings, config, sha)
      setSha(newSha)
      setMessage('저장 완료! 노출 PC에서 새로고침하면 반영됩니다.')
    } catch (e: unknown) {
      setMessage(`저장 실패: ${e instanceof Error ? e.message : '알 수 없는 오류'}`)
    } finally {
      setSaving(false)
    }
  }

  // ── 로그인 화면 ──
  if (!authed) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-[340px]">
          <h1 className="text-xl font-bold text-txt mb-1">관리자 로그인</h1>
          <p className="text-muted text-[13px] mb-6">Born ★ qquqqu Admin</p>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="비밀번호 입력"
            className="w-full border border-border rounded-xl px-4 py-3 text-[14px] mb-3 outline-none focus:border-acc"
          />
          {pwError && <p className="text-red-500 text-[12px] mb-3">비밀번호가 틀렸습니다</p>}
          <button
            onClick={handleLogin}
            className="w-full bg-acc text-white font-bold rounded-xl py-3 text-[14px]"
          >
            로그인
          </button>
        </div>
      </div>
    )
  }

  // ── GitHub 설정 화면 ──
  if (showSettings || !ghSettings) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-[400px]">
          <h1 className="text-xl font-bold text-txt mb-1">GitHub 연동 설정</h1>
          <p className="text-muted text-[12px] mb-6">최초 1회만 설정하면 됩니다</p>
          <div className="space-y-3">
            <input
              value={owner}
              onChange={e => setOwner(e.target.value)}
              placeholder="GitHub 소유자 (예: hyunjinlee-kr)"
              className="w-full border border-border rounded-xl px-4 py-3 text-[13px] outline-none focus:border-acc"
            />
            <input
              value={repo}
              onChange={e => setRepo(e.target.value)}
              placeholder="리포지토리 이름 (예: born-qquuqqu-deploy)"
              className="w-full border border-border rounded-xl px-4 py-3 text-[13px] outline-none focus:border-acc"
            />
            <input
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="GitHub Token (repo 권한 필요)"
              className="w-full border border-border rounded-xl px-4 py-3 text-[13px] outline-none focus:border-acc"
            />
          </div>
          <button
            onClick={handleSaveSettings}
            className="w-full bg-acc text-white font-bold rounded-xl py-3 text-[14px] mt-4"
          >
            저장
          </button>
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
            <button
              onClick={() => setShowSettings(true)}
              className="text-[12px] text-muted border border-border rounded-lg px-3 py-1.5"
            >
              설정
            </button>
            <button
              onClick={() => { window.location.hash = ''; window.location.reload() }}
              className="text-[12px] text-muted border border-border rounded-lg px-3 py-1.5"
            >
              나가기
            </button>
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
                <span className="text-[12px] text-muted">
                  {config.activeFrames.length}/{FRAMES.length}개 활성
                </span>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {FRAMES.map(f => (
                  <FrameThumbSmall
                    key={f.id}
                    frame={f}
                    active={config.activeFrames.includes(f.id)}
                    onToggle={() => toggleFrame(f.id)}
                  />
                ))}
              </div>
            </section>

            {/* 배경 섹션 */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[16px] font-bold text-txt">배경</h2>
                <span className="text-[12px] text-muted">
                  {config.activeBackgrounds.length}/{BG_OPTIONS.length}개 활성
                </span>
              </div>
              <div className="grid grid-cols-6 gap-3">
                {BG_OPTIONS.map(b => (
                  <BgThumbSmall
                    key={b.id}
                    bg={b}
                    active={config.activeBackgrounds.includes(b.id)}
                    onToggle={() => toggleBg(b.id)}
                  />
                ))}
              </div>
            </section>

            {/* 메시지 */}
            {message && (
              <p className={`text-[13px] text-center mb-4 ${message.includes('실패') ? 'text-red-500' : 'text-acc'}`}>
                {message}
              </p>
            )}

            {/* 저장 버튼 */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-acc text-white font-bold rounded-2xl py-4 text-[15px]
                         transition-all hover:-translate-y-0.5 active:scale-[0.97]
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '저장 중...' : '저장하기'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
