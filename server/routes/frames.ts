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
    const ext = path.extname(file.originalname)
    cb(null, `frame-${uuid()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'image/png') cb(null, true)
    else cb(new Error('PNG 파일만 업로드 가능합니다'))
  },
})

const router = Router()

// Public: active frames
router.get('/', (_req, res) => {
  res.json(db.getActiveFrames())
})

// Admin: all frames
router.get('/admin', requireAuth, (_req, res) => {
  res.json(db.getAllFrames())
})

// Admin: create frame
router.post(
  '/admin',
  requireAuth,
  upload.fields([
    { name: 'png_1x4', maxCount: 1 },
    { name: 'png_2x2', maxCount: 1 },
  ]),
  (req, res) => {
    const { name, layout, sort_order, frame_type, bg, textColor, pattern } = req.body
    const files = req.files as { [key: string]: Express.Multer.File[] }

    const frame: db.DbFrame = {
      id: uuid(),
      name: name || '새 프레임',
      frame_type: frame_type || 'png',
      bg: bg || '#ffffff',
      textColor: textColor || '#1a2e24',
      pattern: pattern || null,
      layout: layout || 'both',
      png_url_1x4: files?.png_1x4?.[0] ? `/uploads/${files.png_1x4[0].filename}` : null,
      png_url_2x2: files?.png_2x2?.[0] ? `/uploads/${files.png_2x2[0].filename}` : null,
      is_active: true,
      sort_order: parseInt(sort_order) || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    db.createFrame(frame)
    res.status(201).json(frame)
  },
)

// Admin: update frame metadata
router.put('/admin/:id', requireAuth, (req, res) => {
  const { name, layout, sort_order, frame_type, bg, textColor, pattern } = req.body
  const updates: Partial<db.DbFrame> = {}
  if (name !== undefined) updates.name = name
  if (layout !== undefined) updates.layout = layout
  if (sort_order !== undefined) updates.sort_order = parseInt(sort_order)
  if (frame_type !== undefined) updates.frame_type = frame_type
  if (bg !== undefined) updates.bg = bg
  if (textColor !== undefined) updates.textColor = textColor
  if (pattern !== undefined) updates.pattern = pattern

  const frame = db.updateFrame(req.params.id as string, updates)
  if (!frame) { res.status(404).json({ error: '프레임을 찾을 수 없습니다' }); return }
  res.json(frame)
})

// Admin: reorder frames
router.put('/admin/reorder', requireAuth, (req, res) => {
  const { ids } = req.body as { ids: string[] }
  if (!Array.isArray(ids)) { res.status(400).json({ error: 'ids 배열이 필요합니다' }); return }
  ids.forEach((id, i) => db.updateFrame(id, { sort_order: i }))
  res.json({ ok: true })
})

// Admin: toggle active
router.patch('/admin/:id/toggle', requireAuth, (req, res) => {
  const existing = db.getFrameById(req.params.id as string)
  if (!existing) { res.status(404).json({ error: '프레임을 찾을 수 없습니다' }); return }
  const frame = db.updateFrame(req.params.id as string, { is_active: !existing.is_active })
  res.json(frame)
})

// Admin: delete frame
router.delete('/admin/:id', requireAuth, (req, res) => {
  const frame = db.getFrameById(req.params.id as string)
  if (!frame) { res.status(404).json({ error: '프레임을 찾을 수 없습니다' }); return }

  // Delete PNG files
  for (const url of [frame.png_url_1x4, frame.png_url_2x2]) {
    if (url) {
      const filePath = path.join(__dirname, '..', url)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    }
  }

  db.deleteFrame(req.params.id as string)
  res.json({ ok: true })
})

// Admin: upload/replace PNG for existing frame
router.post(
  '/admin/:id/upload',
  requireAuth,
  upload.fields([
    { name: 'png_1x4', maxCount: 1 },
    { name: 'png_2x2', maxCount: 1 },
  ]),
  (req, res) => {
    const files = req.files as { [key: string]: Express.Multer.File[] }
    const updates: Partial<db.DbFrame> = {}

    if (files?.png_1x4?.[0]) updates.png_url_1x4 = `/uploads/${files.png_1x4[0].filename}`
    if (files?.png_2x2?.[0]) updates.png_url_2x2 = `/uploads/${files.png_2x2[0].filename}`

    const frame = db.updateFrame(req.params.id as string, updates)
    if (!frame) { res.status(404).json({ error: '프레임을 찾을 수 없습니다' }); return }
    res.json(frame)
  },
)

export default router
