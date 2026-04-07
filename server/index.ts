import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import framesRoutes from './routes/frames.js'
import backgroundsRoutes from './routes/backgrounds.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = parseInt(process.env.PORT || '3000')

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

const app = express()

app.use(cors())
app.use(express.json())

// Static: uploaded files
app.use('/uploads', express.static(uploadsDir))

// API routes
app.use('/api/admin', authRoutes)
app.use('/api/frames', framesRoutes)
app.use('/api/backgrounds', backgroundsRoutes)

// Serve Vite build output in production
const distDir = path.join(__dirname, '..', 'dist')
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get('/{*path}', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`🚀 Born ★ qquqqu server running on http://localhost:${PORT}`)
})
