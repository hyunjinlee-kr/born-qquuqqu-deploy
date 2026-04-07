import type { BgOption } from '../types'

export const BG_OPTIONS: BgOption[] = [
  // Star patterns
  { id: 'star-wg',   label: '화이트 별',  type: 'star',  bg: '#ffffff', patternColor: '#c8e6d4' },
  { id: 'star-mg',   label: '민트 별',    type: 'star',  bg: '#e8f8f0', patternColor: '#a8d8b8' },
  { id: 'star-dk',   label: '다크 별',    type: 'star',  bg: '#1a2e24', patternColor: '#2ec27e' },
  { id: 'star-nv',   label: '네이비 별',  type: 'star',  bg: '#1a2744', patternColor: '#c8d8ff' },
  { id: 'star-cr',   label: '크림 별',    type: 'star',  bg: '#fdf6ec', patternColor: '#f0d080' },
  { id: 'star-rz',   label: '로즈 별',    type: 'star',  bg: '#fdeef0', patternColor: '#f0a0b0' },
  // Heart patterns
  { id: 'heart-wpk', label: '화이트 하트', type: 'heart', bg: '#ffffff', patternColor: '#ffb3c6' },
  { id: 'heart-dk',  label: '다크 하트',  type: 'heart', bg: '#1a1a1a', patternColor: '#ff4d6d' },
  { id: 'heart-pk',  label: '핑크 하트',  type: 'heart', bg: '#ffe0ee', patternColor: '#ff80ab' },
  { id: 'heart-pp',  label: '퍼플 하트',  type: 'heart', bg: '#2d1b69', patternColor: '#d0a0ff' },
  { id: 'heart-lp',  label: '연보라 하트', type: 'heart', bg: '#f0e8ff', patternColor: '#b080d0' },
  { id: 'heart-nv',  label: '네이비 하트', type: 'heart', bg: '#1a2744', patternColor: '#ff80ab' },
  // Solid
  { id: 'solid-wh',  label: '화이트',     type: 'solid', bg: '#ffffff' },
  { id: 'solid-bk',  label: '블랙',       type: 'solid', bg: '#1a1a1a' },
  { id: 'solid-mt',  label: '민트',       type: 'solid', bg: '#e8f8f0' },
  { id: 'solid-nv',  label: '네이비',     type: 'solid', bg: '#1a2744' },
  { id: 'solid-cr',  label: '크림',       type: 'solid', bg: '#fdf6ec' },
  { id: 'solid-rz',  label: '로즈',       type: 'solid', bg: '#fdeef0' },
  // None
  { id: 'none',      label: '없음',       type: 'none' },
]
