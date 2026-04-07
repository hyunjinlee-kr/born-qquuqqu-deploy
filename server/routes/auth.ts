import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuid } from 'uuid'
import { findAdminByEmail, createAdmin } from '../db.js'
import { JWT_SECRET } from '../middleware/auth.js'

const router = Router()

// 회원가입
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body
  if (!name || !email || !password) {
    res.status(400).json({ error: '이름, 이메일, 비밀번호를 모두 입력하세요' })
    return
  }
  if (password.length < 4) {
    res.status(400).json({ error: '비밀번호는 4자 이상이어야 합니다' })
    return
  }

  const existing = findAdminByEmail(email)
  if (existing) {
    res.status(409).json({ error: '이미 등록된 이메일입니다' })
    return
  }

  const hash = await bcrypt.hash(password, 10)
  const admin = {
    id: uuid(),
    name,
    email,
    password_hash: hash,
    role: 'editor' as const,
    created_at: new Date().toISOString(),
  }
  createAdmin(admin)

  const token = jwt.sign({ id: admin.id, role: admin.role }, JWT_SECRET, { expiresIn: '24h' })
  res.status(201).json({ token, role: admin.role })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    res.status(400).json({ error: '이메일과 비밀번호를 입력하세요' })
    return
  }

  const admin = findAdminByEmail(email)
  if (!admin) {
    res.status(401).json({ error: '이메일 또는 비밀번호가 틀렸습니다' })
    return
  }

  const valid = await bcrypt.compare(password, admin.password_hash)
  if (!valid) {
    res.status(401).json({ error: '이메일 또는 비밀번호가 틀렸습니다' })
    return
  }

  const token = jwt.sign({ id: admin.id, role: admin.role }, JWT_SECRET, { expiresIn: '24h' })
  res.json({ token, role: admin.role })
})

export default router
