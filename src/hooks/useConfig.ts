import { useEffect, useState } from 'react'
import type { FrameOption, BgOption } from '../types'

export interface ConfigFrame extends FrameOption {
  active: boolean
}

export interface ConfigBg extends BgOption {
  active: boolean
}

export interface Config {
  frames: ConfigFrame[]
  backgrounds: ConfigBg[]
}

const DEFAULT_CONFIG: Config = {
  frames: [],
  backgrounds: [],
}

const GITHUB_OWNER = 'hyunjinlee-kr'
const GITHUB_REPO = 'born-qquuqqu-deploy'
const API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/config.json?ref=gh-pages`
const RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/gh-pages`
const RAW_CONFIG_URL = `${RAW_BASE}/config.json`

export { GITHUB_OWNER, GITHUB_REPO }

const isGhPages = window.location.hostname.includes('github.io')

function resolvePngUrl(url?: string): string | undefined {
  if (!url) return undefined
  if (isGhPages) return url
  const fileName = url.replace('./', '')
  return `${RAW_BASE}/${fileName}`
}

// GitHub API로 읽기 (토큰 인증, 즉시 반영, 시간당 5000회)
async function fetchConfigViaApi(token: string): Promise<Config> {
  const res = await fetch(`${API_URL}&t=${Date.now()}`, {
    headers: { Authorization: `token ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('API fetch failed')
  const data = await res.json()
  const decoded = new TextDecoder().decode(Uint8Array.from(atob(data.content), c => c.charCodeAt(0)))
  return JSON.parse(decoded)
}

// raw URL로 읽기 (인증 불필요, 5분 캐시 있을 수 있음)
async function fetchConfigViaRaw(): Promise<Config> {
  const res = await fetch(`${RAW_CONFIG_URL}?t=${Date.now()}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('raw fetch failed')
  return res.json()
}

export function useConfig() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('qquqqu_gh_token')

    const load = token
      ? fetchConfigViaApi(token).catch(() => fetchConfigViaRaw())  // 토큰 있으면 API 우선, 실패 시 raw
      : fetchConfigViaRaw()  // 토큰 없으면 raw

    load
      .then(setConfig)
      .catch(() => {
        // 둘 다 실패 시 로컬 config.json 폴백
        fetch(`./config.json?t=${Date.now()}`)
          .then(res => res.json())
          .then(setConfig)
          .catch(() => {})
      })
      .finally(() => setLoading(false))
  }, [])

  const activeFrames: FrameOption[] = (config.frames ?? [])
    .filter(f => f.active)
    .map(({ active: _, ...rest }) => ({
      ...rest,
      pngUrl1x4: resolvePngUrl(rest.pngUrl1x4),
      pngUrl2x2: resolvePngUrl(rest.pngUrl2x2),
    }))

  const activeBackgrounds: BgOption[] = (config.backgrounds ?? [])
    .filter(b => b.active)
    .map(({ active: _, ...rest }) => rest)

  return { config, activeFrames, activeBackgrounds, loading }
}
