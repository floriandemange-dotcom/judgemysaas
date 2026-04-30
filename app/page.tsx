'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const content = {
  fr: {
    titleStart: 'Ton site fait fuir',
    titleEnd: 'tes clients',
    subtitle: "Colle l'URL de ton site. En 30 secondes, tu sais exactement ce qui bloque tes ventes.",
    placeholder: 'https://monsite.fr',
    cta: 'Découvrir ce qui cloche →',
    sub: 'Gratuit · 30 secondes · Sans inscription',
    error: 'URL invalide. Ajoute https:// devant.',
    apiError: "Erreur lors de l'analyse. Réessaie.",
    limitError: 'Limite de 3 analyses par jour atteinte. Crée un compte gratuit pour continuer.',
    loadingMessages: [
      'On parcourt ton site...',
      'On examine chaque élément...',
      'On identifie les points de friction...',
      'On prépare ton diagnostic...',
    ],
    cards: [
      { icon: '—', title: 'Clarté du message', desc: 'Est-ce qu\'on comprend ce que tu vends en 5 secondes ?' },
      { icon: '—', title: 'Taux de conversion', desc: 'Pourquoi les visiteurs partent sans acheter ?' },
      { icon: '—', title: 'Expérience mobile', desc: 'Ton site fonctionne-t-il bien sur téléphone ?' },
    ],
    trustTitle: 'Déjà',
    trustCount: '47 sites',
    trustSuffix: ' analysés cette semaine',
    stats: [
      { icon: '', value: '30 sec', label: 'Temps de diagnostic moyen' },
      { icon: '', value: '6 problèmes', label: 'Détectés en moyenne par site' },
      { icon: '', value: 'Gratuit', label: 'Sans inscription requise' },
    ],
    footer: 'JudgeMyApp © 2025 · France',
  },
  en: {
    titleStart: 'Your website is driving away',
    titleEnd: 'your customers',
    subtitle: "Paste your URL. In 30 seconds, you'll know exactly what's killing your sales.",
    placeholder: 'https://mywebsite.com',
    cta: "Find out what's wrong →",
    sub: 'Free · 30 seconds · No sign-up',
    error: 'Invalid URL. Make sure it starts with https://',
    apiError: 'Analysis failed. Please try again.',
    limitError: 'Daily limit of 3 analyses reached. Create a free account to continue.',
    loadingMessages: [
      'Going through your site...',
      'Examining each element...',
      'Identifying friction points...',
      'Preparing your report...',
    ],
    cards: [
      { icon: '—', title: 'Message clarity', desc: 'Do visitors understand what you sell in 5 seconds?' },
      { icon: '—', title: 'Conversion rate', desc: 'Why do visitors leave without buying?' },
      { icon: '—', title: 'Mobile experience', desc: 'Does your site work well on mobile?' },
    ],
    trustTitle: 'Already',
    trustCount: '47 sites',
    trustSuffix: ' reviewed this week',
    stats: [
      { icon: '', value: '30 sec', label: 'Average review time' },
      { icon: '', value: '6 issues', label: 'Found on average per site' },
      { icon: '', value: 'Free', label: 'No sign-up required' },
    ],
    footer: 'JudgeMyApp © 2025 · France',
  },
}

export default function Home() {
  const [lang, setLang] = useState<'fr' | 'en'>('fr')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loadingStep, setLoadingStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const router = useRouter()
  const t = content[lang]

  useEffect(() => {
    if (!loading) {
      setLoadingStep(0)
      setProgress(0)
      return
    }

    const msgTimer = setInterval(() => {
      setLoadingStep((s) => (s + 1) % 4)
    }, 2000)

    // 0 → 90 in 15s = 1% every 167ms
    const progTimer = setInterval(() => {
      setProgress((p) => (p < 90 ? p + 1 : p))
    }, 167)

    return () => {
      clearInterval(msgTimer)
      clearInterval(progTimer)
    }
  }, [loading])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    let normalized = url.trim()
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized
    }

    try {
      new URL(normalized)
    } catch {
      setError(t.error)
      return
    }

    // Rate limiting: 3 analyses/day for non-authenticated users
    const today = new Date().toISOString().split('T')[0]
    const usage = JSON.parse(localStorage.getItem('roast_usage') ?? '{}')
    const dailyCount = usage.date === today ? (usage.count ?? 0) : 0
    if (dailyCount >= 3) {
      setError(t.limitError)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalized, lang }),
      })

      if (!res.ok) throw new Error('API error')

      const data = await res.json()
      setProgress(100)
      localStorage.setItem('roast_result', JSON.stringify({ ...data, url: normalized, lang }))
      // Increment daily counter
      localStorage.setItem('roast_usage', JSON.stringify({ date: today, count: dailyCount + 1 }))
      await new Promise((r) => setTimeout(r, 400))
      router.push('/roast')
    } catch {
      setError(t.apiError)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ background: '#0A0A0A' }} className="min-h-screen text-white flex flex-col items-center justify-center px-4">
        <style>{`
          @keyframes dot-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.25; transform: scale(0.75); }
          }
        `}</style>

        <div className="flex flex-col items-center gap-10 w-full max-w-sm">
          <span className="text-xl font-bold tracking-tight">JudgeMyApp</span>

          {/* Pulsing dots */}
          <div className="flex gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  background: '#FF4500',
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  animation: 'dot-pulse 1.2s ease-in-out infinite',
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>

          {/* Rotating message */}
          <p
            key={loadingStep}
            className="text-base text-zinc-300 text-center"
            style={{ minHeight: 28, transition: 'opacity 0.3s' }}
          >
            {t.loadingMessages[loadingStep]}
          </p>

          {/* Progress bar */}
          <div className="w-full">
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                style={{
                  width: `${progress}%`,
                  background: '#FF4500',
                  transition: 'width 0.15s linear',
                  height: '100%',
                  borderRadius: 9999,
                }}
              />
            </div>
            <p className="text-zinc-600 text-xs text-right mt-1.5">{progress}%</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#0A0A0A' }} className="min-h-screen text-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
        <span className="text-xl font-bold tracking-tight text-white">JudgeMyApp</span>
        <button
          onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
          className="px-3 py-1 rounded-full border border-zinc-700 text-sm text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
        >
          {lang === 'fr' ? 'EN' : 'FR'}
        </button>
      </nav>

      {/* Hero */}
      <main className="flex flex-col items-center text-center px-4 pt-20 pb-28 relative overflow-hidden">
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 800,
            height: 500,
            background: 'radial-gradient(ellipse at center, rgba(255,69,0,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6 max-w-4xl relative">
          {t.titleStart} <span style={{ color: '#FF4500' }}>{t.titleEnd}</span>
        </h1>

        <p className="text-lg sm:text-xl text-zinc-400 mb-10 max-w-lg leading-relaxed">
          {t.subtitle}
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-xl flex flex-col sm:flex-row gap-3 relative">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t.placeholder}
            className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 transition-colors text-sm"
          />
          <button
            type="submit"
            disabled={!url.trim()}
            style={{ background: !url.trim() ? '#7c3200' : '#FF4500', transition: 'background 0.2s' }}
            className="px-6 py-3 rounded-xl font-semibold text-white disabled:cursor-not-allowed whitespace-nowrap text-sm"
          >
            {t.cta}
          </button>
        </form>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <p className="mt-4 text-xs text-zinc-600 tracking-wide">{t.sub}</p>

        {/* Feature cards */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full text-left">
          {t.cards.map((card) => (
            <div key={card.title} className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 px-5 py-5">
              <p className="font-semibold text-sm text-white mb-2">{card.title}</p>
              <p className="text-zinc-500 text-sm leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Social proof */}
      <section className="px-4 pb-28 max-w-4xl mx-auto w-full">
        <p className="text-center text-zinc-500 text-sm mb-12">
          {t.trustTitle}
          <span className="text-white font-semibold"> {t.trustCount}</span>
          {t.trustSuffix}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {t.stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <span className="text-3xl font-bold text-white">{s.value}</span>
              <span className="text-zinc-500 text-sm">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Powered by */}
      <div className="border-t border-zinc-900 py-6 px-4">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          <span className="flex items-center gap-1.5 text-zinc-600 text-xs">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M17.25 2h-10.5A4.75 4.75 0 002 6.75v10.5A4.75 4.75 0 006.75 22h10.5A4.75 4.75 0 0022 17.25V6.75A4.75 4.75 0 0017.25 2zM8.4 16.5l-1.15-3.1H6.1L5 16.5H3.5l3.35-9h1.4l3.35 9H8.4zm5.85 0l-1.15-3.1h-1.15L10.8 16.5H9.3l3.35-9h1.4l3.35 9h-1.95zm-5.3-4.3h1.8L9.9 9.05 8.95 12.2zm5.85 0h1.8l-.95-3.15-.85 3.15z" /></svg>
            Claude
          </span>
          <span className="flex items-center gap-1.5 text-zinc-600 text-xs">
            <svg width="13" height="13" viewBox="0 0 180 180" fill="currentColor" aria-hidden><path d="M90 0C40.3 0 0 40.3 0 90s40.3 90 90 90 90-40.3 90-90S139.7 0 90 0zm44.3 161.3L67.7 72H54v56.3H43.7V72H20v-10h80v10H76.3V161L64.7 149l63 12.3z"/></svg>
            Next.js
          </span>
          <span className="flex items-center gap-1.5 text-zinc-600 text-xs">
            <svg width="13" height="11" viewBox="0 0 116 100" fill="currentColor" aria-hidden><path d="M57.5 0L115 100H0L57.5 0z" /></svg>
            Vercel
          </span>
          <span className="flex items-center gap-1.5 text-zinc-600 text-xs">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 14.09c-1.56.59-3.09.35-4.19-.5l.93-1.07c.72.55 1.76.71 2.76.35.94-.34 1.4-1.04 1.24-1.68-.17-.68-.95-.9-2.02-1.05-1.5-.2-3.02-.62-2.61-2.4.33-1.43 1.69-2.24 3.37-2.24.97 0 1.92.27 2.67.77l-.87 1.1c-.57-.38-1.27-.57-1.97-.57-.88 0-1.54.36-1.68.93-.13.54.49.77 1.52.93 1.63.24 3.16.72 2.73 2.57-.3 1.31-1.44 2.41-3.88 2.86z" /></svg>
            Stripe
          </span>
          <span className="flex items-center gap-1.5 text-zinc-600 text-xs">
            <svg width="11" height="13" viewBox="0 0 109 113" fill="currentColor" aria-hidden><path d="M63.7 0L0 65.5h54.5L44.8 113 109 47.5H54.5L63.7 0z" /></svg>
            Supabase
          </span>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-5 text-center flex flex-col items-center gap-2">
        <p className="text-zinc-600 text-xs">{t.footer}</p>
        <div className="flex gap-4">
          <a href="/mentions-legales" className="text-zinc-700 text-xs hover:text-zinc-500 transition-colors">
            Mentions légales
          </a>
          <a href="/cgv" className="text-zinc-700 text-xs hover:text-zinc-500 transition-colors">
            CGV
          </a>
        </div>
      </footer>
    </div>
  )
}
