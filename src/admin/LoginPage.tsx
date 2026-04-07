import { useState } from 'react'
import { adminLogin, adminRegister } from '../lib/api'

interface Props {
  onLogin: (token: string) => void
}

export default function LoginPage({ onLogin }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const { token } = await adminLogin(email, password)
        onLogin(token)
      } else {
        const { token } = await adminRegister(name, email, password)
        onLogin(token)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '실패')
    } finally {
      setLoading(false)
    }
  }

  function switchMode() {
    setMode(m => m === 'login' ? 'register' : 'login')
    setError('')
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-5">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-card border border-border shadow-card p-8 w-full max-w-[380px]"
      >
        <h1 className="font-display text-[28px] font-black text-txt text-center mb-1"
            style={{ fontFamily: '"Playfair Display", serif' }}>
          Born <span className="text-acc">★</span> qquqqu
        </h1>
        <p className="text-muted text-[13px] text-center mb-8">
          {mode === 'login' ? 'Admin 로그인' : 'Admin 회원가입'}
        </p>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[13px]">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4 mb-6">
          {mode === 'register' && (
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="이름"
              required
              className="w-full px-4 py-3 rounded-xl border border-border text-[14px] text-txt
                         outline-none focus:border-acc transition-colors"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="회사 이메일"
            required
            className="w-full px-4 py-3 rounded-xl border border-border text-[14px] text-txt
                       outline-none focus:border-acc transition-colors"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="비밀번호"
            required
            minLength={4}
            className="w-full px-4 py-3 rounded-xl border border-border text-[14px] text-txt
                       outline-none focus:border-acc transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-acc text-white font-bold text-[15px] rounded-2xl py-3.5
                     transition-all hover:-translate-y-0.5 active:scale-[0.97]
                     disabled:opacity-50"
        >
          {loading
            ? (mode === 'login' ? '로그인 중...' : '가입 중...')
            : (mode === 'login' ? '로그인' : '회원가입')
          }
        </button>

        <button
          type="button"
          onClick={switchMode}
          className="w-full mt-4 text-[13px] text-txt2 hover:text-acc transition-colors"
        >
          {mode === 'login'
            ? '계정이 없으신가요? 회원가입'
            : '이미 계정이 있으신가요? 로그인'
          }
        </button>
      </form>
    </div>
  )
}
