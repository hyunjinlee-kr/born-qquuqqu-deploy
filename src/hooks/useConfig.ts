import { useEffect, useState } from 'react'

interface Config {
  activeFrames: string[]
  activeBackgrounds: string[]
}

const DEFAULT_CONFIG: Config = {
  activeFrames: [],
  activeBackgrounds: [],
}

// GitHub API로 직접 읽기 (캐시 없음, 즉시 반영)
const API_URL = 'https://api.github.com/repos/hyunjinlee-kr/born-qquuqqu-deploy/contents/config.json?ref=gh-pages'

export function useConfig() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}&t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        const content = JSON.parse(atob(data.content))
        setConfig(content)
      })
      .catch(() => {
        // API 실패 시 로컬 config.json 폴백
        fetch(`./config.json?t=${Date.now()}`)
          .then(res => res.json())
          .then(setConfig)
          .catch(() => {})
      })
      .finally(() => setLoading(false))
  }, [])

  return { config, loading }
}
