'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase-client'

interface UserRoast {
  id: string
  url: string
  score: number
  summary: string
  issues: unknown[]
  positives: unknown[]
  created_at: string
}

interface MonitoredSite {
  id: string
  url: string
  current_score: number | null
  previous_score: number | null
  last_checked_at: string | null
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-zinc-600 text-sm">—</span>
  const color = score < 40 ? '#f87171' : score < 70 ? '#fb923c' : '#4ade80'
  return <span className="text-sm font-bold" style={{ color }}>{score}/100</span>
}

function TrendBadge({ current, previous }: { current: number | null; previous: number | null }) {
  if (current === null || previous === null) return null
  const diff = current - previous
  if (diff > 0) return <span className="text-xs text-green-400">📈 +{diff} pts</span>
  if (diff < 0) return <span className="text-xs text-red-400">📉 {diff} pts</span>
  return <span className="text-xs text-zinc-500">➡️ Stable</span>
}

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [plan, setPlan] = useState<string | null>(null)
  const [roasts, setRoasts] = useState<UserRoast[]>([])
  const [monitored, setMonitored] = useState<MonitoredSite[]>([])
  const [loading, setLoading] = useState(true)
  const [addingUrl, setAddingUrl] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      const userEmail = session.user.email ?? ''
      setEmail(userEmail)

      const { data: subscriber } = await supabase
        .from('subscribers')
        .select('id, plan')
        .eq('email', userEmail)
        .single()

      if (!subscriber || subscriber.plan !== 'illimite') {
        router.push('/')
        return
      }

      setPlan(subscriber.plan)

      const [{ data: userRoasts }, { data: monitoredSites }] = await Promise.all([
        supabase
          .from('user_roasts')
          .select('*')
          .eq('user_id', subscriber.id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('monitored_sites')
          .select('*')
          .eq('user_id', subscriber.id)
          .order('created_at', { ascending: false }),
      ])

      setRoasts(userRoasts ?? [])
      setMonitored(monitoredSites ?? [])
      setLoading(false)
    }

    load()
  }, [router])

  async function handleAddSite() {
    if (!newUrl.trim()) return
    const supabase = getSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    let url = newUrl.trim()
    if (!url.startsWith('http')) url = 'https://' + url

    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (!subscriber) return

    const { data } = await supabase
      .from('monitored_sites')
      .insert({ user_id: subscriber.id, url })
      .select()
      .single()

    if (data) {
      setMonitored((prev) => [data, ...prev])
    }

    setNewUrl('')
    setAddingUrl(false)
  }

  function reviewRoast(roast: UserRoast) {
    localStorage.setItem('roast_result', JSON.stringify({
      url: roast.url,
      lang: 'fr',
      overall: roast.score,
      summary: roast.summary,
      issues: roast.issues,
      positives: roast.positives,
    }))
    router.push('/roast')
  }

  async function handleLogout() {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div style={{ background: '#0A0A0A' }} className="min-h-screen text-white flex items-center justify-center">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ background: '#FF4500', width: 8, height: 8, borderRadius: '50%', animation: 'dot-pulse 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
          ))}
          <style>{`@keyframes dot-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.25;transform:scale(.75)} }`}</style>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#0A0A0A' }} className="min-h-screen text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 sticky top-0 z-10" style={{ background: '#0A0A0A' }}>
        <span className="text-lg font-bold tracking-tight">JudgeMyApp</span>
        <div className="flex items-center gap-3">
          <span className="text-zinc-500 text-sm hidden sm:block">{email}</span>
          <button
            onClick={() => router.push('/')}
            style={{ background: '#FF4500' }}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Nouvelle analyse
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-zinc-500 hover:text-white transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-10 max-w-4xl mx-auto w-full flex flex-col gap-12">

        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold mb-1">
            Bonjour {email?.split('@')[0]} 👋
          </h1>
          <p className="text-zinc-500 text-sm">
            Plan <span className="text-white font-semibold">Illimité</span> · Analyses illimitées
          </p>
        </div>

        {/* Mes analyses */}
        <section>
          <h2 className="text-xs font-bold tracking-widest text-zinc-500 mb-4">MES ANALYSES</h2>
          {roasts.length === 0 ? (
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 px-5 py-8 text-center">
              <p className="text-zinc-500 text-sm">Aucune analyse sauvegardée.</p>
              <button
                onClick={() => router.push('/')}
                style={{ background: '#FF4500' }}
                className="mt-4 px-5 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                Analyser mon premier site →
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {roasts.map((roast) => (
                <div
                  key={roast.id}
                  className="rounded-xl bg-zinc-900 border border-zinc-800 px-5 py-4 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{roast.url}</p>
                    <p className="text-zinc-600 text-xs mt-0.5">
                      {new Date(roast.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <ScoreBadge score={roast.score} />
                    <button
                      onClick={() => reviewRoast(roast)}
                      className="text-xs text-zinc-400 hover:text-white transition-colors border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 rounded-lg"
                    >
                      Revoir →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Monitoring */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold tracking-widest text-zinc-500">MONITORING</h2>
            <button
              onClick={() => setAddingUrl(true)}
              className="text-xs text-zinc-400 hover:text-white transition-colors border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 rounded-lg"
            >
              + Ajouter un site
            </button>
          </div>

          {addingUrl && (
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://monsite.fr"
                onKeyDown={(e) => e.key === 'Enter' && handleAddSite()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 text-sm"
              />
              <button
                onClick={handleAddSite}
                style={{ background: '#FF4500' }}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                Ajouter
              </button>
              <button
                onClick={() => setAddingUrl(false)}
                className="px-3 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-white border border-zinc-800"
              >
                ✕
              </button>
            </div>
          )}

          {monitored.length === 0 ? (
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 px-5 py-8 text-center">
              <p className="text-zinc-500 text-sm">Aucun site surveillé.</p>
              <p className="text-zinc-600 text-xs mt-1">
                Ajoute un site pour recevoir une alerte si son score baisse.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {monitored.map((site) => (
                <div
                  key={site.id}
                  className="rounded-xl bg-zinc-900 border border-zinc-800 px-5 py-4 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{site.url}</p>
                    <p className="text-zinc-600 text-xs mt-0.5">
                      {site.last_checked_at
                        ? `Vérifié le ${new Date(site.last_checked_at).toLocaleDateString('fr-FR')}`
                        : 'Pas encore analysé'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <ScoreBadge score={site.current_score} />
                    <TrendBadge current={site.current_score} previous={site.previous_score} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {monitored.length > 0 && (
            <p className="text-zinc-600 text-xs mt-3 text-center">
              Sites re-analysés automatiquement chaque semaine
            </p>
          )}
        </section>
      </main>
    </div>
  )
}
