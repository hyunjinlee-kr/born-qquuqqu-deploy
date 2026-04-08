import { useMemo, useState, useEffect } from 'react'
import type { Step, Layout, FrameOption, BgOption, CameraMode } from './types'
import { useConfig } from './hooks/useConfig'

import Landing from './components/Landing'
import LayoutSelect from './components/LayoutSelect'
import FrameSelect from './components/FrameSelect'
import BgSelect from './components/BgSelect'
import SourceSelect from './components/SourceSelect'
import Camera from './components/Camera'
import Result from './components/Result'
import AdminPage from './admin/AdminPage'

const FALLBACK_BG: BgOption = { id: '_none', label: '없음', type: 'none' }

function PhotoboothApp() {
  const [step, setStep] = useState<Step>('landing')
  const [layout, setLayout] = useState<Layout>('1x4')
  const [frame, setFrame] = useState<FrameOption | null>(null)
  const [bg, setBg] = useState<BgOption>(FALLBACK_BG)
  const [photos, setPhotos] = useState<string[]>([])
  const [videoClips, setVideoClips] = useState<Blob[]>([])
  const [mode, setMode] = useState<CameraMode>('photo')
  const { activeFrames, activeBackgrounds, loading } = useConfig()

  // 선택된 레이아웃에 맞는 프레임만 필터 (PNG 프레임은 해당 레이아웃 PNG가 있어야 표시)
  const filteredFrames = useMemo(() =>
    activeFrames.filter(f => {
      if (f.type !== 'png') return true // solid/pattern은 모든 레이아웃 지원
      return layout === '1x4' ? !!f.pngUrl1x4 : !!f.pngUrl2x2
    }),
    [activeFrames, layout]
  )

  function reset() {
    setStep('landing')
    setLayout('1x4')
    setFrame(null)
    setBg(FALLBACK_BG)
    setPhotos([])
    setVideoClips([])
    setMode('photo')
  }

  function handleCameraDone(p: string[], v: Blob[], m: CameraMode) {
    setPhotos(p)
    setVideoClips(v)
    setMode(m)
    setStep('result')
  }

  function handleAlbum(p: string[]) {
    setPhotos(p)
    setVideoClips([])
    setMode('photo')
    setStep('result')
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-bg text-muted">로딩 중...</div>
  }

  if (step === 'result' && frame) {
    return <Result layout={layout} frame={frame} bg={bg} photos={photos} videoClips={videoClips} mode={mode} onRetake={() => setStep('source')} onHome={reset} />
  }

  return (
    <div className="max-w-[430px] md:max-w-[640px] lg:max-w-[800px] mx-auto min-h-screen relative">
      {step === 'landing' && <Landing onEnter={() => setStep('layout')} />}
      {step === 'layout' && <LayoutSelect layout={layout} onSelect={setLayout} onNext={() => setStep('frame')} onBack={() => setStep('landing')} />}
      {step === 'frame' && <FrameSelect layout={layout} frame={frame} onSelect={setFrame} onNext={() => setStep('bg')} onBack={() => setStep('layout')} frames={filteredFrames} />}
      {step === 'bg' && <BgSelect bg={bg} onSelect={setBg} onNext={() => setStep('source')} onSkip={() => { setBg(FALLBACK_BG); setStep('source') }} onBack={() => setStep('frame')} backgrounds={activeBackgrounds} />}
      {step === 'source' && <SourceSelect layout={layout} onCamera={() => setStep('camera')} onAlbum={handleAlbum} onBack={() => setStep('bg')} />}
      {step === 'camera' && <Camera onDone={handleCameraDone} onBack={() => setStep('source')} />}
    </div>
  )
}

export default function App() {
  const [hash, setHash] = useState(window.location.hash)

  useEffect(() => {
    const onHash = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (hash === '#admin') return <AdminPage />
  return <PhotoboothApp />
}
