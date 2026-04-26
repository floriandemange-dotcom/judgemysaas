'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase-client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div style={{ background: '#0A0A0A' }} className="min-h-screen text-white flex flex-col">
      <nav className="flex items-center px-6 py-5 max-w-6xl mx-auto w-full">
        <a href="/" className="text-xl font-bold tracking-tight">JudgeMyApp</a>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Connexion</h1>
            <p className="text-zinc-500 text-sm">Accède à ton dashboard Illimité</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 text-sm"
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 text-sm"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              style={{ background: '#FF4500' }}
              className="py-3 rounded-xl font-semibold text-sm text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? '...' : 'Se connecter'}
            </button>
          </form>

          <p className="text-zinc-500 text-sm text-center">
            Pas de compte ?{' '}
            <a href="/register" className="text-white hover:underline">Créer un compte</a>
          </p>
        </div>
      </div>
    </div>
  )
}
