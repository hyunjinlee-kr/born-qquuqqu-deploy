export type Layout = '1x4' | '2x2'
export type FilterType = 'none' | 'bw' | 'y2k'
export type CameraMode = 'photo' | 'video'

export type Step =
  | 'landing'
  | 'layout'
  | 'frame'
  | 'bg'
  | 'source'
  | 'camera'
  | 'result'

export interface FrameOption {
  id: string
  name: string
  bg: string
  textColor: string
  type: 'solid' | 'pattern' | 'png'
  pattern?: 'heart' | 'dot' | 'star'
  pngUrl1x4?: string
  pngUrl2x2?: string
}

export interface BgOption {
  id: string
  label: string
  type: 'star' | 'heart' | 'solid' | 'none' | 'upload' | 'custom'
  bg?: string
  patternColor?: string
  imageUrl?: string
}

export interface AppState {
  step: Step
  layout: Layout
  frame: FrameOption
  bg: BgOption
  photos: string[]
  videoClips: Blob[]
  mode: CameraMode
}
