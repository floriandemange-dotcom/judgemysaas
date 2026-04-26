'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'

function MerciContent() {
  const params = useSearchParams()
  const router = useRouter()
  const plan = params.get('plan') ?? ''
  const isIllimite = plan === 'illimite'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [accountCreated, setAccountCreated] = useState(false)

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = getSupabaseClient()
    const { error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    await supabase.from('subscribers').upsert(
      { email, plan: 'illimite' },
      { onConflict: 'email' }
    )

    setAccountCreated(true)
    setLoading(false)
  }

  return (
    <div style={{ background: '#0A0A0A' }} className="min-h-screen text-white flex flex-col">
      <nav className="flex items-center px-6 py-5 max-w-6xl mx-auto w-full">
        <span className="text-xl font-bold tracking-tight">JudgeMyApp</span>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center gap-6">
        <p className="text-5xl">✅</p>
        <h1 className="text-3xl sm:text-4xl font-bold">Paiement confirmé !</h1>
        <p className="text-zinc-400 text-base max-w-sm leading-relaxed">
          {isIllimite
            ? 'Bienvenue dans le plan Illimité. Crée ton compte ci-dessous pour accéder à ton dashboard.'
            : 'Ton rapport complet arrive dans quelques secondes.'}
        </p>

        {isIllimite && !accountCreated && (
          <form onSubmit={handleCreateAccount} className="w-full max-w-sm flex flex-col gap-3 mt-2">
            <input
              type="email"
              placeholder="Ton email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 text-sm"
            />
            <input
              type="password"
              placeholder="Choisis un mot de passe (min. 8 caractères)"
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
              {loading ? '...' : 'Créer mon compte Illimité →'}
            </button>
          </form>
        )}

        {isIllimite && accountCreated && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-green-400 text-sm">Compte créé ! Vérifie ta boîte mail pour confirmer.</p>
            <button
              onClick={() => router.push('/dashboard')}
              style={{ background: '#FF4500' }}
              className="px-6 py-3 rounded-xl font-semibold text-sm text-white hover:opacity-90 transition-opacity"
            >
              Accéder à mon dashboard →
            </button>
          </div>
        )}

        {!isIllimite && (
          <button
            onClick={() => router.push('/roast')}
            style={{ background: '#FF4500' }}
            className="mt-2 px-6 py-3 rounded-xl font-semibold text-sm text-white hover:opacity-90 transition-opacity"
          >
            Voir mon rapport complet →
          </button>
        )}
      </div>
    </div>
  )
}

export default function MerciPage() {
  return (
    <Suspense>
      <MerciContent />
    </Suspense>
  )
}
