import { useEffect, useState } from 'react'

interface Config {
  activeFrames: string[]
  activeBackgrounds: string[]
}

const DEFAULT_CONFIG: Config = {
  activeFrames: [],
  activeBackgrounds: [],
}

export function useConfig() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`./config.json?t=${Date.now()}`)
      .then(res => res.json())
      .then(setConfig)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { config, loading }
}
