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
const RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/gh-pages`

// 포토부스용: raw URL로 직접 읽기 (rate limit 없음)
const RAW_CONFIG_URL = `${RAW_BASE}/config.json`

export { GITHUB_OWNER, GITHUB_REPO }

// gh-pages 배포 환경이 아���면(로컬 dev) PNG 경로를 raw URL로 변환
const isGhPages = window.location.hostname.includes('github.io')

function resolvePngUrl(url?: string): string | undefined {
  if (!url) return undefined
  if (isGhPages) return url
  const fileName = url.replace('./', '')
  return `${RAW_BASE}/${fileName}`
}

export function useConfig() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // raw.githubusercontent.com으로 읽기 (API 아님, rate limit 없음)
    fetch(`${RAW_CONFIG_URL}?t=${Date.now()}`, { cache: 'no-store' })
      .then(res => {
        if (!res.ok) throw new Error('fetch failed')
        return res.json()
      })
      .then(setConfig)
      .catch(() => {
        // raw URL 실패 시 로컬 config.json 폴백
        fetch(`./config.json?t=${Date.now()}`)
          .then(res => res.json())
          .then(setConfig)
          .catch(() => {})
      })
      .finally(() => setLoading(false))
  }, [])

  // 활성 프레임/배경만 필��링 + PNG URL 변환
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
