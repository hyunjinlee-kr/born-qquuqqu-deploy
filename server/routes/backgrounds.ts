import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { v4 as uuid } from 'uuid'
import { requireAuth } from '../middleware/auth.js'
import * as db from '../db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads')

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => {
    cb(null, `bg-${uuid()}${path.extname(file.originalname)}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
})

const router = Router()

// Public: active backgrounds
router.get('/', (_req, res) => {
  res.json(db.getActiveBackgrounds())
})

// Admin: all backgrounds
router.get('/admin', requireAuth, (_req, res) => {
  res.json(db.getAllBackgrounds())
})

// Admin: create background
router.post('/admin', requireAuth, upload.single('image'), (req, res) => {
  const { label, type, bg, patternColor, sort_order } = req.body
  const file = req.file

  const background: db.DbBackground = {
    id: uuid(),
    label: label || '새 배경',
    type: type || 'custom',
    bg: bg || null,
    patternColor: patternColor || null,
    image_url: file ? `/uploads/${file.filename}` : null,
    is_active: true,
    sort_order: parseInt(sort_order) || 0,
  }

  db.createBackground(background)
  res.status(201).json(background)
})

// Admin: reorder backgrounds
router.put('/admin/reorder', requireAuth, (req, res) => {
  const { ids } = req.body as { ids: string[] }
  if (!Array.isArray(ids)) { res.status(400).json({ error: 'ids 배열이 필요합니다' }); return }
  ids.forEach((id, i) => db.updateBackground(id, { sort_order: i }))
  res.json({ ok: true })
})

// Admin: toggle active
router.patch('/admin/:id/toggle', requireAuth, (req, res) => {
  const existing = db.getBackgroundById(req.params.id as string)
  if (!existing) { res.status(404).json({ error: '배경을 찾을 수 없습니다' }); return }
  const bg = db.updateBackground(req.params.id as string, { is_active: !existing.is_active })
  res.json(bg)
})

// Admin: delete background
router.delete('/admin/:id', requireAuth, (req, res) => {
  const bgs = db.getAllBackgrounds()
  const bg = bgs.find(b => b.id === req.params.id as string)
  if (!bg) { res.status(404).json({ error: '배경을 찾을 수 없습니다' }); return }

  if (bg.image_url) {
    const filePath = path.join(__dirname, '..', bg.image_url)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  }

  db.deleteBackground(req.params.id as string)
  res.json({ ok: true })
})

export default router
