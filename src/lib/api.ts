import type { FrameOption, BgOption } from '../types'

const API = '/api'

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` }
}

// === Public ===

export async function fetchActiveFrames(): Promise<FrameOption[]> {
  const res = await fetch(`${API}/frames`)
  if (!res.ok) return []
  const data = await res.json()
  return data.map(apiFrameToOption)
}

export async function fetchActiveBackgrounds(): Promise<BgOption[]> {
  const res = await fetch(`${API}/backgrounds`)
  if (!res.ok) return []
  return data_to_bg_options(await res.json())
}

// === Admin Auth ===

export async function adminRegister(name: string, email: string, password: string): Promise<{ token: string; role: string }> {
  const res = await fetch(`${API}/admin/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '회원가입 실패' }))
    throw new Error(err.error)
  }
  return res.json()
}

export async function adminLogin(email: string, password: string): Promise<{ token: string; role: string }> {
  const res = await fetch(`${API}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '로그인 실패' }))
    throw new Error(err.error)
  }
  return res.json()
}

// === Admin Frames ===

export async function fetchAllFrames(token: string) {
  const res = await fetch(`${API}/frames/admin`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error(res.status === 401 ? '401' : '프레임 목록 조회 실패')
  return res.json()
}

export async function createFrame(token: string, formData: FormData) {
  const res = await fetch(`${API}/frames/admin`, {
    method: 'POST',
    headers: authHeaders(token),
    body: formData,
  })
  if (!res.ok) throw new Error('프레임 생성 실패')
  return res.json()
}

export async function toggleFrame(token: string, id: string) {
  const res = await fetch(`${API}/frames/admin/${id}/toggle`, {
    method: 'PATCH',
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('토글 실패')
  return res.json()
}

export async function reorderFrames(token: string, ids: string[]) {
  const res = await fetch(`${API}/frames/admin/reorder`, {
    method: 'PUT',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  })
  if (!res.ok) throw new Error('순서 변경 실패')
}

export async function deleteFrameApi(token: string, id: string) {
  const res = await fetch(`${API}/frames/admin/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('삭제 실패')
}

// === Admin Backgrounds ===

export async function fetchAllBackgrounds(token: string) {
  const res = await fetch(`${API}/backgrounds/admin`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error('배경 목록 조회 실패')
  return res.json()
}

export async function createBackgroundApi(token: string, formData: FormData) {
  const res = await fetch(`${API}/backgrounds/admin`, {
    method: 'POST',
    headers: authHeaders(token),
    body: formData,
  })
  if (!res.ok) throw new Error('배경 생성 실패')
  return res.json()
}

export async function toggleBackground(token: string, id: string) {
  const res = await fetch(`${API}/backgrounds/admin/${id}/toggle`, {
    method: 'PATCH',
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('토글 실패')
  return res.json()
}

export async function reorderBackgrounds(token: string, ids: string[]) {
  const res = await fetch(`${API}/backgrounds/admin/reorder`, {
    method: 'PUT',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  })
  if (!res.ok) throw new Error('순서 변경 실패')
}

export async function deleteBackgroundApi(token: string, id: string) {
  const res = await fetch(`${API}/backgrounds/admin/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('삭제 실패')
}

// === Mappers ===

interface ApiFrame {
  id: string
  name: string
  frame_type: 'solid' | 'pattern' | 'png'
  bg: string
  textColor: string
  pattern: 'heart' | 'dot' | 'star' | null
  layout: string
  png_url_1x4: string | null
  png_url_2x2: string | null
  is_active: boolean
  sort_order: number
}

function apiFrameToOption(f: ApiFrame): FrameOption {
  return {
    id: f.id,
    name: f.name,
    bg: f.bg,
    textColor: f.textColor,
    type: f.frame_type,
    pattern: f.pattern ?? undefined,
    pngUrl1x4: f.png_url_1x4 ?? undefined,
    pngUrl2x2: f.png_url_2x2 ?? undefined,
  }
}

interface ApiBg {
  id: string
  label: string
  type: string
  bg: string | null
  patternColor: string | null
  image_url: string | null
}

function data_to_bg_options(data: ApiBg[]): BgOption[] {
  return data.map(b => ({
    id: b.id,
    label: b.label,
    type: (b.type === 'solid' && !b.bg ? 'none' : b.type) as BgOption['type'],
    bg: b.bg ?? undefined,
    patternColor: b.patternColor ?? undefined,
    imageUrl: b.image_url ?? undefined,
  }))
}
