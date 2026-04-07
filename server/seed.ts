import bcrypt from 'bcryptjs'
import { v4 as uuid } from 'uuid'
import { createAdmin, findAdminByEmail, createFrame, getAllFrames, createBackground, getAllBackgrounds } from './db.js'
import type { DbFrame, DbBackground } from './db.js'

const EMAIL = 'admin@qquqqu.com'
const PASSWORD = 'admin1234'

const SEED_FRAMES: Omit<DbFrame, 'id' | 'created_at' | 'updated_at'>[] = [
  { name: '블랙',   frame_type: 'solid',   bg: '#1a1a1a', textColor: '#f0f0f0', pattern: null,    layout: 'both', png_url_1x4: null, png_url_2x2: null, is_active: true, sort_order: 0 },
  { name: '화이트', frame_type: 'solid',   bg: '#ffffff', textColor: '#1a2e24', pattern: null,    layout: 'both', png_url_1x4: null, png_url_2x2: null, is_active: true, sort_order: 1 },
  { name: '민트',   frame_type: 'solid',   bg: '#e8f8f0', textColor: '#1a5e3a', pattern: null,    layout: 'both', png_url_1x4: null, png_url_2x2: null, is_active: true, sort_order: 2 },
  { name: '네이비', frame_type: 'solid',   bg: '#1a2744', textColor: '#c8d8ff', pattern: null,    layout: 'both', png_url_1x4: null, png_url_2x2: null, is_active: true, sort_order: 3 },
  { name: '크림',   frame_type: 'solid',   bg: '#fdf6ec', textColor: '#4a3010', pattern: null,    layout: 'both', png_url_1x4: null, png_url_2x2: null, is_active: true, sort_order: 4 },
  { name: '로즈',   frame_type: 'solid',   bg: '#fdeef0', textColor: '#6a1a28', pattern: null,    layout: 'both', png_url_1x4: null, png_url_2x2: null, is_active: true, sort_order: 5 },
  { name: '하트',   frame_type: 'pattern', bg: '#fff0f5', textColor: '#c0185a', pattern: 'heart', layout: 'both', png_url_1x4: null, png_url_2x2: null, is_active: true, sort_order: 6 },
  { name: '도트',   frame_type: 'pattern', bg: '#f0f4ff', textColor: '#2244aa', pattern: 'dot',   layout: 'both', png_url_1x4: null, png_url_2x2: null, is_active: true, sort_order: 7 },
  { name: '별',     frame_type: 'pattern', bg: '#fffbe8', textColor: '#7a5a00', pattern: 'star',  layout: 'both', png_url_1x4: null, png_url_2x2: null, is_active: true, sort_order: 8 },
]

const SEED_BACKGROUNDS: Omit<DbBackground, 'id'>[] = [
  // None
  { label: '없음',        type: 'solid',  bg: null,      patternColor: null,      image_url: null, is_active: true, sort_order: 0 },
  // Solids
  { label: '화이트',      type: 'solid',  bg: '#ffffff', patternColor: null,      image_url: null, is_active: true, sort_order: 1 },
  { label: '블랙',        type: 'solid',  bg: '#1a1a1a', patternColor: null,      image_url: null, is_active: true, sort_order: 2 },
  { label: '민트',        type: 'solid',  bg: '#e8f8f0', patternColor: null,      image_url: null, is_active: true, sort_order: 3 },
  { label: '네이비',      type: 'solid',  bg: '#1a2744', patternColor: null,      image_url: null, is_active: true, sort_order: 4 },
  { label: '크림',        type: 'solid',  bg: '#fdf6ec', patternColor: null,      image_url: null, is_active: true, sort_order: 5 },
  { label: '로즈',        type: 'solid',  bg: '#fdeef0', patternColor: null,      image_url: null, is_active: true, sort_order: 6 },
  // Star patterns
  { label: '화이트 별',   type: 'star',   bg: '#ffffff', patternColor: '#c8e6d4', image_url: null, is_active: true, sort_order: 10 },
  { label: '민트 별',     type: 'star',   bg: '#e8f8f0', patternColor: '#a8d8b8', image_url: null, is_active: true, sort_order: 11 },
  { label: '다크 별',     type: 'star',   bg: '#1a2e24', patternColor: '#2ec27e', image_url: null, is_active: true, sort_order: 12 },
  { label: '네이비 별',   type: 'star',   bg: '#1a2744', patternColor: '#c8d8ff', image_url: null, is_active: true, sort_order: 13 },
  { label: '크림 별',     type: 'star',   bg: '#fdf6ec', patternColor: '#f0d080', image_url: null, is_active: true, sort_order: 14 },
  { label: '로즈 별',     type: 'star',   bg: '#fdeef0', patternColor: '#f0a0b0', image_url: null, is_active: true, sort_order: 15 },
  // Heart patterns
  { label: '화이트 하트', type: 'heart',  bg: '#ffffff', patternColor: '#ffb3c6', image_url: null, is_active: true, sort_order: 20 },
  { label: '다크 하트',   type: 'heart',  bg: '#1a1a1a', patternColor: '#ff4d6d', image_url: null, is_active: true, sort_order: 21 },
  { label: '핑크 하트',   type: 'heart',  bg: '#ffe0ee', patternColor: '#ff80ab', image_url: null, is_active: true, sort_order: 22 },
  { label: '퍼플 하트',   type: 'heart',  bg: '#2d1b69', patternColor: '#d0a0ff', image_url: null, is_active: true, sort_order: 23 },
  { label: '연보라 하트', type: 'heart',  bg: '#f0e8ff', patternColor: '#b080d0', image_url: null, is_active: true, sort_order: 24 },
  { label: '네이비 하트', type: 'heart',  bg: '#1a2744', patternColor: '#ff80ab', image_url: null, is_active: true, sort_order: 25 },
]

async function seed() {
  // Admin account
  const existing = findAdminByEmail(EMAIL)
  if (existing) {
    console.log(`✅ 어드민 계정이 이미 있습니다: ${EMAIL}`)
  } else {
    const hash = await bcrypt.hash(PASSWORD, 10)
    createAdmin({
      id: uuid(),
      name: 'Admin',
      email: EMAIL,
      password_hash: hash,
      role: 'super',
      created_at: new Date().toISOString(),
    })
    console.log(`✅ 어드민 계정 생성 완료`)
    console.log(`   이메일: ${EMAIL}`)
    console.log(`   비밀번호: ${PASSWORD}`)
  }

  // Seed frames
  const existingFrames = getAllFrames()
  if (existingFrames.length > 0) {
    console.log(`✅ 프레임이 이미 ${existingFrames.length}개 있습니다 (스킵)`)
  } else {
    const now = new Date().toISOString()
    for (const f of SEED_FRAMES) {
      createFrame({ ...f, id: uuid(), created_at: now, updated_at: now })
    }
    console.log(`✅ 기본 프레임 ${SEED_FRAMES.length}개 생성 완료`)
  }

  // Seed backgrounds
  const existingBgs = getAllBackgrounds()
  if (existingBgs.length > 0) {
    console.log(`✅ 배경이 이미 ${existingBgs.length}개 있습니다 (스킵)`)
  } else {
    for (const b of SEED_BACKGROUNDS) {
      createBackground({ ...b, id: uuid() })
    }
    console.log(`✅ 기본 배경 ${SEED_BACKGROUNDS.length}개 생성 완료`)
  }
}

seed()
