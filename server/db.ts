import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, 'data', 'db.json')

export interface DbAdmin {
  id: string
  name: string
  email: string
  password_hash: string
  role: 'super' | 'editor'
  created_at: string
}

export interface DbFrame {
  id: string
  name: string
  frame_type: 'solid' | 'pattern' | 'png'
  bg: string
  textColor: string
  pattern: 'heart' | 'dot' | 'star' | null
  layout: '1x4' | '2x2' | 'both'
  png_url_1x4: string | null
  png_url_2x2: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface DbBackground {
  id: string
  label: string
  type: 'star' | 'heart' | 'solid' | 'custom'
  bg: string | null
  patternColor: string | null
  image_url: string | null
  is_active: boolean
  sort_order: number
}

interface Database {
  admins: DbAdmin[]
  frames: DbFrame[]
  backgrounds: DbBackground[]
}

function read(): Database {
  const raw = fs.readFileSync(DB_PATH, 'utf-8')
  return JSON.parse(raw)
}

function write(db: Database) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

// Admins
export function findAdminByEmail(email: string): DbAdmin | undefined {
  return read().admins.find(a => a.email === email)
}

export function createAdmin(admin: DbAdmin) {
  const db = read()
  db.admins.push(admin)
  write(db)
}

// Frames
export function getAllFrames(): DbFrame[] {
  return read().frames
}

export function getActiveFrames(): DbFrame[] {
  return read().frames.filter(f => f.is_active).sort((a, b) => a.sort_order - b.sort_order)
}

export function getFrameById(id: string): DbFrame | undefined {
  return read().frames.find(f => f.id === id)
}

export function createFrame(frame: DbFrame) {
  const db = read()
  db.frames.push(frame)
  write(db)
  return frame
}

export function updateFrame(id: string, updates: Partial<DbFrame>): DbFrame | null {
  const db = read()
  const idx = db.frames.findIndex(f => f.id === id)
  if (idx === -1) return null
  db.frames[idx] = { ...db.frames[idx], ...updates, updated_at: new Date().toISOString() }
  write(db)
  return db.frames[idx]
}

export function deleteFrame(id: string): boolean {
  const db = read()
  const idx = db.frames.findIndex(f => f.id === id)
  if (idx === -1) return false
  db.frames.splice(idx, 1)
  write(db)
  return true
}

// Backgrounds
export function getAllBackgrounds(): DbBackground[] {
  return read().backgrounds
}

export function getActiveBackgrounds(): DbBackground[] {
  return read().backgrounds.filter(b => b.is_active).sort((a, b) => a.sort_order - b.sort_order)
}

export function createBackground(bg: DbBackground) {
  const db = read()
  db.backgrounds.push(bg)
  write(db)
  return bg
}

export function getBackgroundById(id: string): DbBackground | undefined {
  return read().backgrounds.find(b => b.id === id)
}

export function updateBackground(id: string, updates: Partial<DbBackground>): DbBackground | null {
  const db = read()
  const idx = db.backgrounds.findIndex(b => b.id === id)
  if (idx === -1) return null
  db.backgrounds[idx] = { ...db.backgrounds[idx], ...updates }
  write(db)
  return db.backgrounds[idx]
}

export function deleteBackground(id: string): boolean {
  const db = read()
  const idx = db.backgrounds.findIndex(b => b.id === id)
  if (idx === -1) return false
  db.backgrounds.splice(idx, 1)
  write(db)
  return true
}
