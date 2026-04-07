import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'qquqqu-admin-secret-key'

export { JWT_SECRET }

export interface AuthPayload {
  id: string
  role: 'super' | 'editor'
}

declare global {
  namespace Express {
    interface Request {
      admin?: AuthPayload
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: '인증이 필요합니다' })
    return
  }

  try {
    const token = header.slice(7)
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload
    req.admin = payload
    next()
  } catch {
    res.status(401).json({ error: '유효하지 않은 토큰입니다' })
  }
}
