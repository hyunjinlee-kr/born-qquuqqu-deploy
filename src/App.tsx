import { useState } from 'react'
import type { Step, Layout, FrameOption, BgOption, CameraMode } from './types'
import { FRAMES } from './lib/frames'

import Landing from './components/Landing'
import LayoutSelect from './components/LayoutSelect'
import FrameSelect from './components/FrameSelect'
import BgSelect from './components/BgSelect'
import SourceSelect from './components/SourceSelect'
import Camera from './components/Camera'
import Result from './components/Result'

const FALLBACK_FRAME: FrameOption = FRAMES[0]
const FALLBACK_BG: BgOption = { id: '_none', label: '없음', type: 'none' }

export default function App() {
  const [step, setStep] = useState<Step>('landing')
  const [layout, setLayout] = useState<Layout>('1x4')
  const [frame, setFrame] = useState<FrameOption>(FALLBACK_FRAME)
  const [bg, setBg] = useState<BgOption>(FALLBACK_BG)
  const [photos, setPhotos] = useState<string[]>([])
  const [videoClips, setVideoClips] = useState<Blob[]>([])
  const [mode, setMode] = useState<CameraMode>('photo')

  function reset() {
    setStep('landing')
    setLayout('1x4')
    setFrame(FALLBACK_FRAME)
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

  if (step === 'result') {
    return <Result layout={layout} frame={frame} bg={bg} photos={photos} videoClips={videoClips} mode={mode} onRetake={() => setStep('source')} onHome={reset} />
  }

  return (
    <div className="max-w-[430px] md:max-w-[640px] lg:max-w-[800px] mx-auto min-h-screen relative">
      {step === 'landing' && <Landing onEnter={() => setStep('layout')} />}
      {step === 'layout' && <LayoutSelect layout={layout} onSelect={setLayout} onNext={() => setStep('frame')} onBack={() => setStep('landing')} />}
      {step === 'frame' && <FrameSelect layout={layout} frame={frame} onSelect={setFrame} onNext={() => setStep('bg')} onBack={() => setStep('layout')} />}
      {step === 'bg' && <BgSelect bg={bg} onSelect={setBg} onNext={() => setStep('source')} onSkip={() => { setBg(FALLBACK_BG); setStep('source') }} onBack={() => setStep('frame')} />}
      {step === 'source' && <SourceSelect layout={layout} onCamera={() => setStep('camera')} onAlbum={handleAlbum} onBack={() => setStep('bg')} />}
      {step === 'camera' && <Camera onDone={handleCameraDone} onBack={() => setStep('source')} />}
    </div>
  )
}
