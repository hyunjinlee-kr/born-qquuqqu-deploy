import { useEffect, useState } from 'react'

interface Config {
  activeFrames: string[]
  activeBackgrounds: string[]
}

const DEFAULT_CONFIG: Config = {
  activeFrames: [],
  activeBackgrounds: [],
}

// GitHub Pages CDN 캐시를 우회하기 위해 raw.githubusercontent.com에서 직접 읽기
const CONFIG_URL = 'https://raw.githubusercontent.com/hyunjinlee-kr/born-qquuqqu-deploy/gh-pages/config.json'

export function useConfig() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${CONFIG_URL}?t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(setConfig)
      .catch(() => {
        // GitHub 접근 실패 시 로컬 config.json 폴백
        fetch(`./config.json?t=${Date.now()}`)
          .then(res => res.json())
          .then(setConfig)
          .catch(() => {})
      })
      .finally(() => setLoading(false))
  }, [])

  return { config, loading }
}
