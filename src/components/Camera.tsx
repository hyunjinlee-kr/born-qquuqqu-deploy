import { useEffect, useRef, useState } from 'react'
import type { FilterType, CameraMode } from '../types'

interface Props {
  onDone: (photos: string[], videoClips: Blob[], mode: CameraMode) => void
  onBack: () => void
}

const TOTAL = 4
const COUNTDOWN_SECS = 3
const VIDEO_DURATION_MS = 3000

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'none', label: '기본' },
  { id: 'bw',   label: 'B&W' },
  { id: 'y2k',  label: 'Y2K' },
]

const FILTER_CSS: Record<FilterType, string> = {
  none: 'none',
  bw:   'grayscale(100%)',
  y2k:  'saturate(1.8) contrast(1.1) hue-rotate(10deg)',
}

const CAMERA_ERRORS: Record<string, string> = {
  NotAllowedError:       '카메라 권한이 거부됐어요.\n주소창 자물쇠 아이콘을 눌러\n카메라를 허용해주세요.',
  NotFoundError:         '카메라를 찾을 수 없어요.\n기기에 카메라가 연결되어 있는지\n확인해주세요.',
  NotReadableError:      '카메라가 다른 앱에서\n사용 중이에요.\n다른 앱을 종료 후 다시 시도해주세요.',
  OverconstrainedError:  '카메라 설정을 지원하지 않아요.\n다시 시도해주세요.',
  ProtocolError:         'HTTPS 또는 localhost에서만\n카메라를 사용할 수 있어요.',
  NotSupportedError:     'Chrome 최신 버전을\n사용해주세요.',
  default:               '카메라를 시작할 수 없어요.\n다시 시도해주세요.',
}

export default function Camera({ onDone, onBack }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const rafRef = useRef<number>(0)

  const [mode, setMode] = useState<CameraMode>('photo')
  const [filter, setFilter] = useState<FilterType>('none')
  const [photos, setPhotos] = useState<string[]>([])
  const [videoClips, setVideoClips] = useState<Blob[]>([])
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recSecs, setRecSecs] = useState(0)
  const [flash, setFlash] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [capturing, setCapturing] = useState(false)

  const currentCount = mode === 'photo' ? photos.length : videoClips.length

  async function startCamera() {
    setCameraError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      }).catch(() =>
        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      )
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (err: unknown) {
      const name = err instanceof Error ? err.name : 'default'
      if (err instanceof Error && err.message?.includes('https')) {
        setCameraError(CAMERA_ERRORS.ProtocolError)
      } else {
        setCameraError(CAMERA_ERRORS[name] ?? CAMERA_ERRORS.default)
      }
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(CAMERA_ERRORS.NotSupportedError)
      return
    }
    startCamera()
    return () => {
      stopCamera()
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  function capturePhoto() {
    if (!videoRef.current || capturing) return
    setCapturing(true)

    let count = COUNTDOWN_SECS
    setCountdown(count)

    const tick = setInterval(() => {
      count--
      if (count > 0) {
        setCountdown(count)
      } else {
        clearInterval(tick)
        setCountdown(null)
        takeSnapshot()
      }
    }, 1000)
  }

  function takeSnapshot() {
    const video = videoRef.current
    if (!video) return

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')!

    // Mirror (front camera)
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)

    // Apply filter via CSS filter on canvas
    if (filter === 'bw') {
      ctx.filter = 'grayscale(100%)'
    } else if (filter === 'y2k') {
      ctx.filter = 'saturate(1.8) contrast(1.1) hue-rotate(10deg)'
    }
    ctx.drawImage(video, 0, 0)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)

    setFlash(true)
    setTimeout(() => setFlash(false), 450)
    setCapturing(false)

    setPhotos(prev => {
      const next = [...prev, dataUrl]
      if (next.length >= TOTAL) {
        setTimeout(() => {
          stopCamera()
          onDone(next, [], 'photo')
        }, 100)
      }
      return next
    })
  }

  function startVideoCapture() {
    if (!streamRef.current || capturing || isRecording) return
    setCapturing(true)

    let count = COUNTDOWN_SECS
    setCountdown(count)

    const tick = setInterval(() => {
      count--
      if (count > 0) {
        setCountdown(count)
      } else {
        clearInterval(tick)
        setCountdown(null)
        beginRecording()
      }
    }, 1000)
  }

  function beginRecording() {
    const stream = streamRef.current
    if (!stream) return

    const videoStream = new MediaStream(stream.getVideoTracks())
    const mimeType =
      MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' :
      MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4'

    const recorder = new MediaRecorder(videoStream, { mimeType })
    const chunks: BlobPart[] = []
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType })
      setIsRecording(false)
      setCapturing(false)
      setRecSecs(0)

      setVideoClips(prev => {
        const next = [...prev, blob]
        if (next.length >= TOTAL) {
          setTimeout(() => {
            stopCamera()
            onDone([], next, 'video')
          }, 100)
        }
        return next
      })
    }

    recorder.start()
    recorderRef.current = recorder
    setIsRecording(true)

    // Count up timer
    let elapsed = 0
    const timer = setInterval(() => {
      elapsed++
      setRecSecs(elapsed)
    }, 1000)

    // Auto stop after 3s
    setTimeout(() => {
      clearInterval(timer)
      recorder.stop()
    }, VIDEO_DURATION_MS)
  }

  function handleCapture() {
    if (mode === 'photo') capturePhoto()
    else startVideoCapture()
  }

  function switchMode(m: CameraMode) {
    if (capturing || isRecording) return
    setMode(m)
    setPhotos([])
    setVideoClips([])
  }

  const captureLabel =
    mode === 'photo' ? 'Capture'
    : isRecording ? '녹화 중...'
    : '● 녹화 시작'

  return (
    <div className="flex flex-col min-h-screen bg-bg animate-fadeUp">
      {/* Header */}
      <div className="px-5 pt-5 pb-2 flex items-center justify-between">
        <button onClick={onBack} className="text-txt2 text-sm flex items-center gap-1">
          ← 뒤로
        </button>

        {/* Mode toggle */}
        <div
          className="flex rounded-full p-[3px]"
          style={{ background: '#DDE3E5' }}
        >
          {(['photo', 'video'] as CameraMode[]).map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className="px-4 py-1.5 rounded-full text-[12px] font-bold transition-all duration-200"
              style={mode === m ? {
                background: '#fff',
                color: '#1A9E5E',
                boxShadow: '0 1px 4px rgba(0,0,0,.1)',
              } : {
                color: '#8AAA96',
              }}
            >
              {m === 'photo' ? '📷 사진' : '🎬 영상 3초'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center px-5 md:px-10 pb-6 gap-4">
        {/* Progress dots */}
        <div className="flex gap-2 items-center">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: 28, height: 6,
                background: i < currentCount ? '#2EC27E' : '#DDE3E5',
              }}
            />
          ))}
          <span className="ml-1 text-[13px] font-bold text-txt2">
            {currentCount} / {TOTAL}
          </span>
        </div>

        {/* Camera view */}
        <div
          className="relative w-full rounded-[20px] overflow-hidden bg-black"
          style={{ maxWidth: 560, aspectRatio: '4/3' }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)', filter: FILTER_CSS[filter] }}
          />

          {/* Camera error overlay */}
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center"
                 style={{ background: 'rgba(10,20,15,.92)' }}>
              <p className="text-white text-[14px] whitespace-pre-line leading-relaxed">{cameraError}</p>
              <button
                onClick={startCamera}
                className="bg-acc text-white text-[13px] font-bold px-5 py-2.5 rounded-xl"
              >
                다시 시도
              </button>
            </div>
          )}

          {/* Countdown overlay — no blur, just number */}
          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span
                key={countdown}
                className="text-white font-black animate-countdown"
                style={{
                  fontSize: 72,
                  textShadow: '0 2px 16px rgba(0,0,0,.6)',
                }}
              >
                {countdown}
              </span>
            </div>
          )}

          {/* REC indicator */}
          {isRecording && (
            <div
              className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-[12px] font-bold"
              style={{ background: 'rgba(0,0,0,.5)' }}
            >
              <span className="animate-rec-blink" style={{ color: '#FF3B30', fontSize: 10 }}>●</span>
              REC {recSecs}s
            </div>
          )}

          {/* Flash */}
          {flash && (
            <div className="absolute inset-0 bg-white animate-flash pointer-events-none" />
          )}
        </div>

        {/* Filter tabs — photo mode only */}
        {mode === 'photo' && (
          <div className="flex gap-2">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className="px-4 py-1.5 rounded-full text-[12px] font-bold border transition-all"
                style={filter === f.id ? {
                  background: '#2EC27E', color: '#fff', border: '1px solid #2EC27E',
                } : {
                  background: '#fff', color: '#4A6358', border: '1px solid #DDE3E5',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Capture button */}
        <div className="mt-auto w-full max-w-[360px] md:max-w-[460px]">
          <button
            onClick={handleCapture}
            disabled={capturing || isRecording || !!cameraError || currentCount >= TOTAL}
            className="w-full bg-acc text-white font-bold text-[16px] rounded-2xl py-4
                       transition-all hover:-translate-y-0.5 active:scale-[0.97]
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {captureLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
