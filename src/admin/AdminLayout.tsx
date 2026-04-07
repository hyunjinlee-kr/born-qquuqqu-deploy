import { useState } from 'react'
import { useAuth } from './useAuth'
import LoginPage from './LoginPage'
import FramesPage from './FramesPage'
import BackgroundsPage from './BackgroundsPage'

type Tab = 'frames' | 'backgrounds'

export default function AdminLayout() {
  const { token, login, logout, isLoggedIn } = useAuth()
  const [tab, setTab] = useState<Tab>('frames')

  if (!isLoggedIn) {
    return <LoginPage onLogin={login} />
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="bg-white border-b border-border px-5 py-3 flex items-center justify-between sticky top-0 z-10">
        <h1 className="font-bold text-txt text-[16px]">
          Born <span className="text-acc">★</span> qquqqu <span className="text-muted text-[13px] font-normal ml-1">Admin</span>
        </h1>
        <button
          onClick={logout}
          className="text-[13px] text-txt2 hover:text-txt transition-colors"
        >
          로그아웃
        </button>
      </header>

      {/* Tab nav */}
      <nav className="bg-white border-b border-border px-5 flex gap-1">
        {([
          { id: 'frames' as Tab, label: '프레임 관리' },
          { id: 'backgrounds' as Tab, label: '배경 관리' },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-3 text-[14px] font-bold border-b-2 transition-all"
            style={tab === t.id
              ? { borderColor: '#2EC27E', color: '#1A9E5E' }
              : { borderColor: 'transparent', color: '#8AAA96' }
            }
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="max-w-[800px] mx-auto p-5">
        {tab === 'frames' && <FramesPage token={token!} onAuthError={logout} />}
        {tab === 'backgrounds' && <BackgroundsPage token={token!} />}
      </main>
    </div>
  )
}
