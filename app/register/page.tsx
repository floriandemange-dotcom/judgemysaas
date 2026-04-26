'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase-client'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Create subscriber record for free plan
    await supabase.from('subscribers').upsert({ email, plan: 'free' }, { onConflict: 'email' })

    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <div style={{ background: '#0A0A0A' }} className="min-h-screen text-white flex flex-col items-center justify-center px-4 gap-4 text-center">
        <span className="text-4xl">📬</span>
        <h1 className="text-2xl font-bold">Vérifie ta boîte mail</h1>
        <p className="text-zinc-400 text-sm max-w-xs">
          Un lien de confirmation t'a été envoyé à <strong>{email}</strong>. Clique dessus pour activer ton compte.
        </p>
        <a href="/login" className="mt-2 text-sm text-zinc-400 hover:text-white underline">
          Retour à la connexion
        </a>
      </div>
    )
  }

  return (
    <div style={{ background: '#0A0A0A' }} className="min-h-screen text-white flex flex-col">
      <nav className="flex items-center px-6 py-5 max-w-6xl mx-auto w-full">
        <a href="/" className="text-xl font-bold tracking-tight">JudgeMyApp</a>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Créer un compte</h1>
            <p className="text-zinc-500 text-sm">Gratuit · Accès immédiat</p>
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
              placeholder="Mot de passe (min. 8 caractères)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
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
              {loading ? '...' : 'Créer mon compte'}
            </button>
          </form>

          <p className="text-zinc-500 text-sm text-center">
            Déjà un compte ?{' '}
            <a href="/login" className="text-white hover:underline">Se connecter</a>
          </p>
        </div>
      </div>
    </div>
  )
}
