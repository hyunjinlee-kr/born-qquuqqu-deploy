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

// GitHub API로 직접 읽기 (캐시 없음, 즉시 반영)
const GITHUB_OWNER = 'hyunjinlee-kr'
const GITHUB_REPO = 'born-qquuqqu-deploy'
const API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/config.json?ref=gh-pages`
const RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/gh-pages`

export { GITHUB_OWNER, GITHUB_REPO }

// gh-pages 배포 환경이 아니면(로컬 dev) PNG 경로를 raw URL로 변환
const isGhPages = window.location.hostname.includes('github.io')

function resolvePngUrl(url?: string): string | undefined {
  if (!url) return undefined
  if (isGhPages) return url // gh-pages에서는 상대경로 그대로
  // 로컬에서는 GitHub raw URL로 변환
  const fileName = url.replace('./', '')
  return `${RAW_BASE}/${fileName}`
}

export function useConfig() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}&t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        const decoded = new TextDecoder().decode(Uint8Array.from(atob(data.content), c => c.charCodeAt(0)))
        const content = JSON.parse(decoded)
        setConfig(content)
      })
      .catch(() => {
        fetch(`./config.json?t=${Date.now()}`)
          .then(res => res.json())
          .then(setConfig)
          .catch(() => {})
      })
      .finally(() => setLoading(false))
  }, [])

  // 활성 프레임/배경만 필터링 + PNG URL 변환
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
